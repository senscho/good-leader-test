/* Audio engine: everything plays through WebAudio (decodeAudioData + BufferSource + Gain), never <audio>.
   The AudioContext is created/resumed inside a user tap (the language buttons, or the first tap anywhere), so there is never an autoplay error.
   Graph: BGM tracks -> bgmLP (drop-out filter) -> bgmDrop -> bgmDuck -> bgmBus -+
          SFX voices  -> sfxBus ------------------------------------------------+-> compressor -> master (mute) -> destination
          typing ticks -> tickBus -----------------------------------------------+
   No file, no sound: everything is skipped silently when an audio file or WebAudio is unavailable. No external requests. */
(function () {
  "use strict";
  var CFG = window.AUDIO || { have: {}, bgm: {}, sfx: {}, cues: {}, events: {}, auto: {}, tick: {} };
  var HAVE_B = (CFG.have && CFG.have.bgm) || [], HAVE_S = (CFG.have && CFG.have.sfx) || [];
  var ctx = null, master, comp, bgmBus, bgmDuck, bgmDrop, bgmLP, sfxBus, tickBus;
  var bufs = {}, loading = {}, queue = Promise.resolve(), preloadStarted = false;
  var muted = !!CFG.defaultMuted, cur = null, curKey = null;
  var typingOn = false, duckTo = 1, duckTimer = null;
  var pend = [], voices = {}, loopsByKey = {}, autoOff = [], manual = false;
  var bgmToken = 0, bgmTimers = [], lastTick = 0, tickCount = 0, tickWin = [], charN = 0;
  var btn = null, LOG = [];
  function log(kind, id) { if (LOG.length < 3000) LOG.push([kind, id, Math.round(performance.now())]); }

  try { var sv = window.localStorage && localStorage.getItem(CFG.storageKey || "glt-muted"); if (sv === "1") muted = true; else if (sv === "0") muted = false; } catch (e) {}

  /* ---------- helpers ---------- */
  function now() { return ctx ? ctx.currentTime : 0; }
  function ramp(param, to, ms) {
    var t = now(); try { param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); if (ms > 0) param.linearRampToValueAtTime(to, t + ms / 1000); else param.setValueAtTime(to, t); } catch (e) {}
  }
  function target(param, to, ms) { var t = now(); try { param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.setTargetAtTime(to, t, Math.max(0.005, ms / 1000 / 3)); } catch (e) {} }
  function later(ms, fn) { var id = setTimeout(fn, ms); bgmTimers.push(id); return id; }
  function lerp(a, b, k) { return a + (b - a) * k; }

  /* ---------- context ---------- */
  function build() {
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 12; comp.knee.value = 6; comp.attack.value = 0.003; comp.release.value = 0.2; comp.connect(master);
    bgmBus = ctx.createGain(); bgmBus.gain.value = 1; bgmBus.connect(comp);
    bgmDuck = ctx.createGain(); bgmDuck.gain.value = 1; bgmDuck.connect(bgmBus);
    bgmDrop = ctx.createGain(); bgmDrop.gain.value = 1; bgmDrop.connect(bgmDuck);
    bgmLP = ctx.createBiquadFilter(); bgmLP.type = "lowpass"; bgmLP.frequency.value = 20000; bgmLP.Q.value = 0.5; bgmLP.connect(bgmDrop);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(comp);
    tickBus = ctx.createGain(); tickBus.gain.value = 1; tickBus.connect(comp);
  }
  function unlock() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      try { ctx = new AC(); } catch (e) { ctx = null; return false; }
      build();
      try { var b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) {}   // silent buffer: iOS unlock
      try { window.SFX && SFX.prepare && SFX.prepare(ctx).catch(function () {}); } catch (e) {}
      startPreload();
    }
    if (ctx.state !== "running") { try { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
    return true;
  }
  function onGesture() { unlock(); }
  ["pointerdown", "touchend", "click", "keydown"].forEach(function (ev) { document.addEventListener(ev, onGesture, { capture: true, passive: true }); });
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    try { if (document.hidden) ctx.suspend(); else ctx.resume(); } catch (e) {}
  });

  /* ---------- loading ---------- */
  function load(file) {   // file: "bgm-pastel" -> audio/bgm-pastel.mp3
    if (bufs[file]) return Promise.resolve(bufs[file]);
    if (loading[file]) return loading[file];
    if (!ctx) return Promise.resolve(null);
    var p = fetch("audio/" + file + ".mp3").then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (res, rej) { var q = ctx.decodeAudioData(ab, res, rej); if (q && q.then) q.then(res, rej); }); })
      .then(function (b) { bufs[file] = b; return b; })
      .catch(function () { return null; });
    loading[file] = p; return p;
  }
  function enqueue(files) { files.forEach(function (f) { queue = queue.then(function () { return load(f); }); }); }
  function startPreload() {
    if (preloadStarted) return; preloadStarted = true;
    var order = ["bgm-pastel", "bgm-tension-a"];
    HAVE_S.forEach(function (n) { order.push("sfx-" + n); });
    ["wry", "wry-end", "tension-b", "tent", "true-piano", "true-strings", "true-drive", "true-choir", "true-final"].forEach(function (n) { if (HAVE_B.indexOf(n) >= 0) order.push("bgm-" + n); });
    order = order.filter(function (f) { var k = f.split("-")[0], n = f.slice(4); return k === "sfx" ? HAVE_S.indexOf(f.slice(4)) >= 0 : HAVE_B.indexOf(f.slice(4)) >= 0; });
    enqueue(order);
  }

  /* ---------- BGM ---------- */
  function trackFiles(def) { return def.files.filter(function (f) { return HAVE_B.indexOf(f) >= 0; }); }
  function barStart(tr, after) {   // time of the first bar line of the playing track at/after now + after seconds
    var t = now() + (after || 0);
    if (!tr || !tr.def.bpm) return t;
    var bar = 4 * 60 / tr.def.bpm, k = Math.ceil((t - tr.t0) / bar - 1e-6);
    return tr.t0 + Math.max(0, k) * bar;
  }
  function fadeOut(tr, ms, when) {
    if (!tr || tr.dead) return; tr.dead = true;
    var g = tr.tg.gain, t = Math.max(now(), when || 0), d = Math.max(0.02, ms / 1000);
    try { g.cancelScheduledValues(t); g.setValueAtTime(when ? g.value : g.value, t); g.linearRampToValueAtTime(0, t + d); } catch (e) {}
    tr.srcs.forEach(function (s) { try { s.stop(t + d + 0.05); } catch (e) {} });
    if (cur === tr) cur = null, curKey = null;
  }
  function playTrack(name, o) {
    var def = CFG.bgm[name]; if (!def) return null;
    var files = trackFiles(def); if (!files.length) return null;
    var tr = { name: name, def: def, tg: null, srcs: [], stems: {}, t0: 0, dead: false, vol: def.gain };
    var bs = files.map(function (f) { return bufs["bgm-" + f]; });
    if (bs.some(function (b) { return !b; })) return null;
    var when = Math.max(now() + 0.03, o.when || 0), fade = (o.fade || 0) / 1000;
    tr.tg = ctx.createGain(); tr.tg.connect(bgmLP);
    tr.tg.gain.setValueAtTime(0.0001, when);
    var vol = o.vol != null ? o.vol : def.gain;
    if (fade > 0) tr.tg.gain.linearRampToValueAtTime(vol, when + fade); else tr.tg.gain.setValueAtTime(vol, when);
    tr.vol = vol;
    files.forEach(function (f, i) {
      var s = ctx.createBufferSource(), sg = ctx.createGain(), nm = def.stems ? def.stems[i] : "main";
      s.buffer = bs[i]; if (def.loop) { s.loop = true; s.loopStart = 0; s.loopEnd = Math.min(def.len || bs[i].duration, bs[i].duration); }
      var init = def.stems ? ((o.stems && o.stems[nm] != null) ? o.stems[nm] : 0) : 1;
      sg.gain.value = init; s.connect(sg); sg.connect(tr.tg); s.start(when);
      tr.srcs.push(s); tr.stems[nm] = sg;
      if (!def.loop) s.onended = function () { if (cur === tr) { cur = null; curKey = null; } };
    });
    tr.t0 = when; return tr;
  }
  function setStems(tr, st, fade) {
    if (!tr) return; var f = (st.fade != null ? st.fade : fade) || 400;
    Object.keys(st).forEach(function (k) {
      if (k === "fade" || !tr.stems[k]) return;
      var v = st[k], delay = 0; if (Object.prototype.toString.call(v) === "[object Array]") { delay = v[1]; v = v[0]; }
      var g = tr.stems[k];
      if (delay > 0) later(delay, function () { if (!tr.dead) ramp(g.gain, v, f); }); else ramp(g.gain, v, f);
    });
  }
  function bgmPlay(name, b) {
    var def = CFG.bgm[name]; if (!def) return;
    var token = ++bgmToken, files = trackFiles(def);
    if (!files.length) return;
    function go() {
      if (token !== bgmToken || !ctx) return;
      var fade = b.fade != null ? b.fade : 600, oldFade = b.oldFade != null ? b.oldFade : (b.stop != null ? b.stop : fade);
      var when = 0;
      if (b.at === "bar") when = barStart(cur, (b.after || 0) / 1000);
      else if (typeof b.at === "number") when = now() + b.at / 1000;
      var old = cur;
      var tr = playTrack(name, { fade: fade, when: when, stems: b.stems, vol: b.vol });
      if (!tr) return;
      if (old) fadeOut(old, oldFade, when || 0);
      cur = tr; curKey = name; log("bgm", name);
      if (b.stems && def.stems) setStems(tr, b.stems, 0);
    }
    var wait = files.map(function (f) { return load("bgm-" + f); });
    Promise.all(wait).then(go);
  }
  function bgmStop(ms) { bgmToken++; if (cur) fadeOut(cur, ms == null ? 600 : ms); }
  function setDrop(d) {
    if (!ctx) return;
    if (d === false) { target(bgmLP.frequency, 20000, 120); target(bgmDrop.gain, 1, 120); }
    else { var ms = d.ms || 250; target(bgmLP.frequency, d.lp || 350, ms); target(bgmDrop.gain, d.gain != null ? d.gain : .25, ms); }
  }
  function duckBase() { return Math.min(typingOn ? (CFG.tick && CFG.tick.bgmTypingDuck || .73) : 1, duckTo); }
  function applyDuck(ms) { if (ctx) target(bgmDuck.gain, duckBase(), ms || 100); }
  function duck(to, ms) {
    duckTo = to; applyDuck(40); clearTimeout(duckTimer);
    duckTimer = setTimeout(function () { duckTo = 1; applyDuck(400); }, ms);
  }
  function bgmAct(b) {
    if (!ctx || !b) return;
    if (b.drop !== undefined) setDrop(b.drop);
    if (b.duck) duck(b.duck.to, b.duck.ms);
    if (b.swell) ramp(bgmBus.gain, b.swell.to, b.swell.ms);
    if (b.vol && cur && !b.play) { var v = b.vol; cur.vol = v[0]; ramp(cur.tg.gain, v[0], v[1]); }
    if (b.cut != null) {
      bgmToken++; var tr = cur; if (tr) fadeOut(tr, b.cut);
      setTimeout(function () { setDrop(false); }, b.cut + 20);
      if (b.then) { var th = b.then, tk = bgmToken; later(th.after || 0, function () { if (tk === bgmToken) bgmPlay(th.play, { fade: th.fade }); }); }
      return;
    }
    if (b.play) bgmPlay(b.play, b);
    else if (b.stop != null) bgmStop(b.stop);
    if (b.stems && !b.play && cur) setStems(cur, b.stems, b.fade);
    if (b.stem && cur) setStems(cur, b.stem, b.fade);
    if (b.final) {
      var f = b.final, tk2 = bgmToken, fdef = CFG.bgm[f.play];
      load("bgm-" + f.play).then(function () {
        if (tk2 !== bgmToken || !ctx || !cur) return;
        var when = f.at === "bar" ? barStart(cur, (f.after || 0) / 1000) : now() + (f.after || 0) / 1000, host = cur;
        var tr = playTrack(f.play, { fade: 0, when: when });
        if (!tr) return;
        log("bgm", f.play); tr.finalOf = host; host.finalTrack = tr; ramp(bgmBus.gain, 1, 1200);
        var lead = Math.max(0, (when - now()) * 1000);
        later(lead, function () { if (f.stems && !host.dead) setStems(host, f.stems, 300); });
        if (f.then) later(lead + (f.then.afterMs || 0), function () { if (!host.dead) setStems(host, f.then.stems, f.then.fade || 1500); });
      });
    }
  }

  /* ---------- SFX ---------- */
  function def(id) { return (CFG.sfx && CFG.sfx[id]) || null; }
  function panFor(o) { return o.pan; }
  function playOne(spec, opts) {
    if (!ctx) return;
    var id = typeof spec === "string" ? spec : spec.id, o = typeof spec === "string" ? {} : spec, d = def(id) || {};
    opts = opts || {};
    var synth = d.synth || (d.file ? null : id), file = d.file || null;
    var rate = (o.rate || 1) * (opts.rate || 1), g = (o.gain != null ? o.gain : 1) * (d.gain != null ? d.gain : 1) * (opts.gain != null ? opts.gain : 1);
    var t0 = now() + (opts.delay || 0);
    log("sfx", id);
    var vg = ctx.createGain(); vg.gain.value = g;
    var out = vg;
    if (o.pan != null) {
      var pn = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pn) {
        var p = o.pan;
        if (Object.prototype.toString.call(p) === "[object Array]") { pn.pan.setValueAtTime(p[0], t0); pn.pan.linearRampToValueAtTime(p[1], t0 + (p[2] || 600) / 1000); } else pn.pan.value = p;
        vg.connect(pn); pn.connect(sfxBus); out = vg;
      } else vg.connect(sfxBus);
    } else vg.connect(sfxBus);
    var handle = null, dur = 1;
    if (file) {
      var b = bufs["sfx-" + file]; if (!b) return;
      var s = ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = rate; s.loop = !!o.loop; s.connect(vg); s.start(t0);
      dur = b.duration / rate; handle = { stop: function (t) { try { s.stop(t + 0.05); } catch (e) {} } };
    } else if (window.SFX && SFX[synth]) {
      var jitter = o.noJitter ? 1 : 1 + (Math.random() * 0.1 - 0.05);
      var opt = { r: rate * (id === "ui-choice-sting" || o.rate ? 1 : jitter), big: o.big || opts.big, lp: o.lp || opts.lp };
      try { handle = SFX[synth](ctx, vg, t0, opt) || null; } catch (e) { handle = null; }
      dur = 3;
    } else return;
    if (d.duck) duck(d.duck.to, d.duck.ms);
    if (d.vibrate) { try { if (navigator.vibrate && o.vibrate !== false) navigator.vibrate(d.vibrate); } catch (e) {} }
    if (d.stops) d.stops.forEach(function (st) { stopKey(st.key, st.fade); });
    if (o.loop || o.key) {
      var key = o.key || id;
      if (o.loop && handle) { stopKey(key, 60); loopsByKey[key] = { vg: vg, h: handle }; }
    }
    return { vg: vg, h: handle };
  }
  /* sfx(spec): handles n / gap / ramp repeats and the t delay */
  function sfx(spec, extra) {
    if (!ctx) return;
    var o = typeof spec === "string" ? { id: spec } : spec, n = o.n || 1, gap = (o.gap || 0) / 1000, i;
    for (i = 0; i < n; i++) {
      var k = n > 1 ? i / (n - 1) : 0, gm = 1, pr = 1;
      if (o.ramp === "up") gm = lerp(.45, 1, k); else if (o.ramp === "down") gm = lerp(1, .35, k); else if (o.ramp && o.ramp.length) gm = lerp(o.ramp[0], o.ramp[1], k);
      if (o.pitchRamp) pr = lerp(o.pitchRamp[0], o.pitchRamp[1], k);
      playOne(o, { delay: i * gap, gain: gm * ((extra && extra.gain) || 1), rate: pr });
    }
  }
  function stopKey(k, fade) {
    var key = typeof k === "string" ? k : k.key, f = typeof k === "string" ? (fade == null ? 150 : fade) : (k.fade != null ? k.fade : 150);
    if (fade != null && typeof k === "string") f = fade;
    var L = loopsByKey[key]; if (!L || !ctx) return; delete loopsByKey[key];
    var t = now(), d = Math.max(0.03, f / 1000);
    try { L.vg.gain.cancelScheduledValues(t); L.vg.gain.setValueAtTime(L.vg.gain.value, t); L.vg.gain.linearRampToValueAtTime(0, t + d); } catch (e) {}
    try { L.h.stop(t + d); } catch (e) {}
  }

  /* ---------- cues (scheduled with timers so a quick tap can cancel the not-yet-played ones) ---------- */
  function runNow(c, quiet) {
    if (c.bgm) bgmAct(c.bgm);
    (c.sfxStop || []).forEach(function (k) { stopKey(k); });
    if (!quiet) (c.sfx || []).forEach(function (s) { if (!(s && s.t)) sfx(s); });
  }
  function sched(c, t) {
    var e = { t: t, c: c, id: 0 };
    e.id = setTimeout(function () { var i = pend.indexOf(e); if (i >= 0) pend.splice(i, 1); runNow(c, false); }, t); pend.push(e);
  }
  function flush() {   // a tap skipped ahead: the sounds that were still waiting are dropped, the music/state changes are applied
    var p = pend; pend = [];
    p.forEach(function (e) { clearTimeout(e.id); runNow(e.c, true); });
  }
  function schedTimed(list, base) {   // sfx entries with a t (ms) are scheduled relative to the cue (or seq entry) start
    (list || []).forEach(function (s) {
      if (!(s && s.t)) return;
      var cp = {}; for (var k in s) cp[k] = s[k]; delete cp.t; sched({ sfx: [cp] }, base + s.t);
    });
  }
  function runCue(c) {
    if (!c) return;
    runNow(c, false); schedTimed(c.sfx, 0);
    (c.seq || []).forEach(function (e) {
      sched({ bgm: e.bgm, sfx: e.sfx, sfxStop: e.sfxStop }, e.t || 0);
      schedTimed(e.sfx, e.t || 0);
    });
  }

  /* ---------- public API ---------- */
  var Audio = window.GameAudio = {
    unlock: unlock,
    isMuted: function () { return muted; },
    cue: function (key) {
      flush(); var c = CFG.cues && CFG.cues[key];
      autoOff = (c && c.autoOff) || []; manual = !!(c && c.manual);
      if (c) runCue(c);
    },
    run: function (c) { runCue(c); },          // inline bgm/sfx fields coming from an art cue
    event: function (name) {
      if (name === "ui.mute") return;
      var c = CFG.events && CFG.events[name]; if (c) runCue(c);
    },
    /* automatic sounds from stage actions: kind = add | fx | stage ; o = {id, anim, delay, x} */
    auto: function (kind, o) {
      if (!ctx || manual || autoOff.indexOf(kind) >= 0) return;
      var A = CFG.auto || {}, s = null;
      if (kind === "add") {
        var pm = A.prop || {};
        s = Object.prototype.hasOwnProperty.call(pm, o.id) ? pm[o.id] : (A.anim || {})[o.anim || "fade"];
      } else if (kind === "fx") s = (A.fx || {})[o.id];
      else if (kind === "stage") s = (A.stage || {})[o.id];
      if (!s) return;
      var spec = typeof s === "string" ? { id: s } : JSON.parse(JSON.stringify(s));
      if (kind === "fx" && o.x != null && !spec.loop) spec.pan = Math.max(-.8, Math.min(.8, (o.x / 100 - .5) * 1.6));
      if (o.delay) { var e = { c: { sfx: [spec] }, id: 0 }; e.id = setTimeout(function () { var i = pend.indexOf(e); if (i >= 0) pend.splice(i, 1); runNow(e.c, false); }, o.delay); pend.push(e); }
      else sfx(spec);
    },
    stop: function (key, fade) { stopKey(key, fade); },
    sceneClear: function () { stopKey("alarm", 100); stopKey("servo", 150); },
    reset: function () {   // back to the title: stop everything that is looping or pending
      bgmToken++; flush(); Object.keys(loopsByKey).forEach(function (k) { stopKey(k, 200); }); autoOff = []; manual = false; typingOn = false; applyDuck(200);
      if (ctx) { setDrop(false); ramp(bgmBus.gain, 1, 300); }
    },
    bgmStop: bgmStop,
    typing: function (on) { typingOn = !!on; applyDuck(150); },
    tick: function (who, ch) {   // one soft blip per two letters, rate limited
      if (!ctx || ctx.state !== "running" || muted) return;
      if (/[\s.,!?;:…·'"“”‘’()\-—]/.test(ch || "")) return;
      var T = CFG.tick || {}; charN++;
      if (charN % (T.everyNthChar || 2)) return;
      var tm = performance.now(); if (tm - lastTick < (T.minGapMs || 55)) return;
      tickWin = tickWin.filter(function (x) { return tm - x < 1000; }); if (tickWin.length >= (T.maxPerSec || 14)) return;
      tickWin.push(tm); lastTick = tm;
      if (window.SFX && SFX.tick) { var g = ctx.createGain(); g.gain.value = 1; g.connect(tickBus); try { SFX.tick(ctx, g, now(), who); } catch (e) {} }
    },
    setMuted: setMuted,
    onMute: null
  };

  /* ---------- mute button ---------- */
  function setMuted(m, silent) {
    muted = !!m;
    if (btn) { btn.textContent = muted ? "🔇" : "🔊"; btn.setAttribute("aria-pressed", muted ? "true" : "false"); btn.setAttribute("aria-label", muted ? "Sound off / 소리 켜기" : "Sound on / 소리 끄기"); btn.setAttribute("data-muted", muted ? "1" : "0"); }
    if (ctx) target(master.gain, muted ? 0 : 1, 40);
    try { localStorage.setItem(CFG.storageKey || "glt-muted", muted ? "1" : "0"); } catch (e) {}
    if (window.GameAudio && typeof window.GameAudio.onMute === "function") { try { window.GameAudio.onMute(muted); } catch (e) {} }
  }
  function makeButton() {
    btn = document.createElement("button"); btn.id = "mute"; btn.type = "button"; btn.className = "mute-btn";
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      unlock();
      if (!muted && ctx) sfx("ui-click");   // click only before muting, silence when turning the sound back on
      setMuted(!muted);
    });
    document.body.appendChild(btn); setMuted(muted);
  }
  if (document.body) makeButton(); else document.addEventListener("DOMContentLoaded", makeButton);

  /* debugging / tests */
  Audio._state = function () { return { ctx: ctx && ctx.state, muted: muted, cur: curKey, loaded: Object.keys(bufs), masterGain: master && master.gain.value, loops: Object.keys(loopsByKey) }; };
  Audio._ctx = function () { return ctx; };
  Audio._log = function () { return LOG; };
  Audio._stems = function () { var o = {}; if (cur) Object.keys(cur.stems).forEach(function (k) { o[k] = +cur.stems[k].gain.value.toFixed(2); }); return o; };
})();
