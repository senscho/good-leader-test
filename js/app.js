(function () {
  "use strict";
  var app = document.getElementById("app");
  var L = null, lang = null;
  var answers = [];       // {idx, elon, label}
  var order = [];         // per-question option order
  var timers = [];
  /* story/survey order, as indexes into the i18n arrays: trust -> work-life -> automation -> tent (new line) */
  var SEQ = [1, 0, 2, 3];

  function clear() { timers.forEach(clearTimeout); timers = []; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function show(node) { clear(); app.innerHTML = ""; app.appendChild(node); }
  function setBackdropNone() { var bd = document.getElementById("backdrop"); if (bd) bd.style.backgroundImage = "none"; }

  /* ---------- title ---------- */
  function title() {
    clear(); answers = []; L = null; setBackdropNone();
    document.documentElement.lang = "ko";
    var s = el("section", "screen center");
    s.innerHTML = '<h1>좋은 리더 테스트</h1><div class="sub-title">The Good Leader Test</div><div class="dim">나는 어떤 리더일까? · 4 questions, about a minute</div>';
    var st = el("div", "stack");
    [["ko", "한국어"], ["en", "English"]].forEach(function (p) {
      var b = el("button", "btn lang", p[1]);
      b.setAttribute("data-lang", p[0]);
      b.onclick = function () { start(p[0]); };
      st.appendChild(b);
    });
    s.appendChild(st);
    show(s);
  }

  function start(l) {
    lang = l; L = I18N[l]; answers = [];
    order = L.questions.map(function () { return Math.random() < 0.5 ? [0, 1] : [1, 0]; });
    document.documentElement.lang = l;
    question(0);
  }

  /* ---------- questions ---------- */
  function question(pos) {
    var i = SEQ[pos], q = L.questions[i];
    if (pos === 3) preload(["art/bg/bg-meeting-room.webp", "art/chr/elon-neutral-a.webp"]);   // first story scene, fetched during the last survey question only
    var s = el("section", "screen");
    var p = el("div", "progress");
    for (var k = 0; k < 4; k++) p.appendChild(el("i", k <= pos ? "on" : ""));
    s.appendChild(p);
    var w = el("div", "qwrap");
    w.appendChild(el("div", "qnum", L.qLabel + " " + (pos + 1) + " / 4"));
    w.appendChild(el("h2", "qtext", esc(q.q)));
    var st = el("div", "stack");
    order[i].forEach(function (oi) {
      var b = el("button", "btn", esc(q.opts[oi]));
      b.setAttribute("data-opt", oi === 1 ? "elon" : "trap");
      b.onclick = function () {
        answers[i] = { idx: i, elon: oi === 1, label: q.opts[oi] };
        if (pos < 3) question(pos + 1); else story();
      };
      st.appendChild(b);
    });
    w.appendChild(st); s.appendChild(w);
    show(s);
  }

  /* ---------- story (visual novel on a layered stage) ---------- */
  var A = window.ART, SEQ_BG = ["factory-night", "meeting-room", "automation-line", "parking-dusk"];   // by question index
  var BAD_BG = ["bad-lobby", "bad-dark-factory", "bad-robot-museum", "bad-opening"];                    // by question index
  var CHAR_IDS = ["elon", "engineer", "board", "consultant"];

  function buildSteps() {
    var steps = [], t = "scene";
    function add(key, o) { o.key = key; steps.push(o); }
    function ln(key, bg, kind, l, extra) {
      var o = { type: "line", bg: bg, kind: kind, who: l[0], text: l[1] };
      if (extra) for (var k in extra) o[k] = extra[k];
      add(key, o);
    }
    L.intro.forEach(function (l, k) { ln("intro." + k, SEQ_BG[1], t, l); });
    /* one linear story: each decision point shows the situation, then a single button = the survey answer.
       A wrong answer plays its bad ending right there and stops; a right one gets Elon's reaction, then the next decision. */
    var ended = false;
    SEQ.forEach(function (i) {
      if (ended) return;
      var bg = SEQ_BG[i], a = answers[i];
      ln("sit." + i, bg, t, L.situations[i]);
      add("choice." + i, { type: "choice", bg: bg, kind: t, pick: a });
      if (!a.elon) {
        L.bad[i].forEach(function (l, k, arr) {
          ln("bad." + i + "." + k, BAD_BG[i], "bad", l, { tag: L.badTags[i], last: k === arr.length - 1 });
        });
        ended = true;
      } else {
        ln("reply." + i, bg, t, L.replies[i]);
      }
    });
    if (!ended) {
      L.matchLines.forEach(function (l, k) { ln("match." + k, "tent-line", "match", l, { tag: L.matchTag }); });
      L.trueLines.forEach(function (l, k) { ln("true." + k, "true-sky", "true", l, { tag: L.trueTag }); });
    }
    add("end", { type: "end", bg: steps[steps.length - 1].bg, kind: steps[steps.length - 1].kind });
    return steps;
  }

  function preload(list) { list.forEach(function (u) { var i = new Image(); i.src = u; }); }
  function have(kind, name) { return !!(A && A.have && A.have[kind] && A.have[kind].indexOf(name) >= 0); }
  function pct(v) { return (Math.round(v * 100) / 100) + "%"; }
  function setBackdrop(src) {
    var bd = document.getElementById("backdrop");
    if (bd) bd.style.backgroundImage = src ? 'url("' + src + '")' : "none";
  }

  function story() {
    var steps = buildSteps(), n = 0, curBg = null, typing = null, speaker = null;
    var s = el("section", "screen vn");
    var bgL = el("div", "layer bg-layer"), bgfx = el("div", "layer bg-fx"), pBack = el("div", "layer props props-back"),
        chL = el("div", "layer chars"), pFront = el("div", "layer props props-front"), fxL = el("div", "layer fx"),
        ovL = el("div", "layer overlay-text"), dlg = el("div", "dlg");
    [bgL, bgfx, pBack, chL, pFront, fxL, ovL, dlg].forEach(function (x) { s.appendChild(x); });
    show(s);
    var sprites = { L: null, C: null, R: null };   // slot -> {id, expr, wrap, imgs{frame:img}, frames[], alive, special}

    /* ----- background ----- */
    function placeholder(id, kind) {
      bgL.innerHTML = ""; setBackdrop(null);
      var ph = el("div", "ph " + (kind === "bad" ? "bad" : kind === "true" ? "true" : kind === "match" ? "match" : ""));
      ph.setAttribute("data-slot", id);
      ph.innerHTML = '<span class="slot">slot: ' + id + '</span><div class="desc">' + esc(L.placeholders[id]) + '</div>';
      bgL.appendChild(ph);
    }
    function clearScene() {
      [pBack, pFront, fxL, ovL].forEach(function (x) { x.innerHTML = ""; });
      bgfx.style.opacity = 0; bgL.style.filter = "";
      ["L", "C", "R"].forEach(function (k) { removeChar(k, true); });
    }
    function setBg(id, kind, how) {
      if (curBg === id) return; curBg = id;
      clearScene();
      s.setAttribute("data-bg", id);
      if (!have("bg", id)) { placeholder(id, kind); return; }
      var src = "art/bg/bg-" + id + ".webp", img = new Image();
      img.className = "bg-img"; img.alt = ""; img.draggable = false;
      img.onload = function () {
        if (curBg !== id) return;
        var olds = Array.prototype.slice.call(bgL.children);
        img.style.animation = "fade " + ((how && how.ms) || 500) + "ms ease";
        bgL.appendChild(img); setBackdrop(src);
        olds.forEach(function (o) { o.parentNode && o.parentNode.removeChild(o); });
      };
      img.onerror = function () { if (curBg === id) placeholder(id, kind); };
      img.src = src;
    }

    /* ----- sprites ----- */
    function frameNames(id, expr) {
      var def = A.chars[id]; if (!def) return [];
      if (def.special && def.special[expr]) return def.special[expr];
      return def.frames;
    }
    function isSpecial(id, expr) { var d = A.chars[id]; return !!(d && d.special && d.special[expr]); }
    function isBreathing(id, expr) { var d = A.chars[id]; return !!(d && d.breathing && d.breathing.indexOf(expr) >= 0); }
    function frameSrc(id, expr, f) { return "art/chr/" + id + "-" + expr + "-" + f + ".webp"; }
    /* positions depend on how many sprites are on stage (logical order L, C, R is kept): 1 -> 540, 2 -> 360/720, 3 -> 250/540/830 of 1080 */
    function layout() {
      var live = ["L", "C", "R"].filter(function (k) { return sprites[k]; });
      var xs = A.layouts[live.length] || [];
      live.forEach(function (k, i) { sprites[k].wrap.style.left = pct(xs[i] / A.stage.w * 100); });
    }
    function removeChar(slot, instant) {
      var c = sprites[slot]; if (!c) return;
      c.alive = false; sprites[slot] = null; layout();
      if (instant) { c.wrap.parentNode && c.wrap.parentNode.removeChild(c.wrap); return; }
      c.wrap.classList.add("out-" + (slot === "L" ? "l" : slot === "R" ? "r" : "c"));
      setTimeout(function () { c.wrap.parentNode && c.wrap.parentNode.removeChild(c.wrap); }, 320);
    }
    function showFrame(c, f) {
      if (!c.imgs[f]) f = c.frames[0];
      for (var k in c.imgs) c.imgs[k].style.visibility = (k === f) ? "visible" : "hidden";
      c.cur = f;
    }
    var BIG_HOP = ["surprised", "shocked", "cheer", "baffled"], SHAKE_EXPR = ["surprised", "shocked"];
    function setChar(slot, spec) {
      if (!spec) { removeChar(slot); return; }
      var cur = sprites[slot];
      if (cur && cur.id === spec.id && cur.expr === spec.expr) { if (spec.frame && cur.imgs[spec.frame]) showFrame(cur, spec.frame); return; }
      var frames = frameNames(spec.id, spec.expr).filter(function (f) { return have("chr", spec.id + "-" + spec.expr + "-" + f); });
      if (!frames.length) { removeChar(slot); return; }               // no art yet: nothing drawn (text placeholder only)
      var swap = !!(cur && cur.id === spec.id);
      var old = cur;
      if (cur) { if (swap) { sprites[slot] = null; cur.alive = false; } else removeChar(slot, false); }
      var wrap = el("div", "chr " + slot), scl = el("div", "scl"), bob = el("div", "bob");
      var canvas = A.chars[spec.id].canvas && A.chars[spec.id].canvas[spec.expr];
      if (canvas) { wrap.classList.add("land"); wrap.style.width = pct(canvas[0] / A.stage.w * 100); wrap.style.aspectRatio = canvas[0] + "/" + canvas[1]; wrap.style.height = "auto"; }
      var c = { id: spec.id, expr: spec.expr, wrap: wrap, imgs: {}, frames: frames, alive: true, cur: frames[0], special: isSpecial(spec.id, spec.expr) };
      frames.forEach(function (f) {
        var im = new Image(); im.alt = ""; im.draggable = false; im.className = "sprite";
        im.onerror = function () { delete c.imgs[f]; if (im.parentNode) im.parentNode.removeChild(im); c.frames = c.frames.filter(function (x) { return x !== f; }); if (!c.frames.length) removeChar(slot, true); };
        c.imgs[f] = im; bob.appendChild(im);
      });
      scl.appendChild(el("div", "fshadow")); scl.appendChild(bob); wrap.appendChild(scl);   // soft floor shadow under every sprite
      c.scl = scl;
      wrap.style.animationDelay = "0s"; bob.style.animationDelay = (-Math.random() * 2.4).toFixed(2) + "s";
      var big = swap && BIG_HOP.indexOf(spec.expr) >= 0;
      var anim = swap ? (big ? "hop-big" : "hop") : (spec.anim || (slot === "L" ? "slide-l" : slot === "R" ? "slide-r" : "fade"));
      wrap.classList.add("in-" + anim);
      if (swap && SHAKE_EXPR.indexOf(spec.expr) >= 0) shake();
      /* on an expression swap keep the old sprite until the new first frame has loaded (no blank flash) */
      var first = spec.frame && c.imgs[spec.frame] ? spec.frame : frames[0];
      var done = false;
      function ready() { if (done) return; done = true; if (old && old.wrap.parentNode) old.wrap.parentNode.removeChild(old.wrap); wrap.style.visibility = ""; }
      wrap.style.visibility = old ? "hidden" : "";
      c.imgs[first].onload = ready; timers.push(setTimeout(ready, 1500));
      frames.forEach(function (f) { c.imgs[f].src = frameSrc(spec.id, spec.expr, f); });
      chL.appendChild(wrap);
      sprites[slot] = c; layout(); showFrame(c, first);
      if (c.special) { if (isBreathing(spec.id, spec.expr)) breathe(c); } else blink(c);
    }
    function shake() { s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake"); timers.push(setTimeout(function () { s.classList.remove("shake"); }, 300)); }
    function blink(c) {   // b frame for 110 ms every 3-5 s
      if (c.frames.indexOf("b") < 0) return;
      (function loop() {
        timers.push(setTimeout(function () {
          if (!c.alive) return;
          if (!(c.talkOn && c.cur === "c")) { showFrame(c, "b"); timers.push(setTimeout(function () { if (c.alive) showFrame(c, "a"); loop(); }, 110)); }
          else loop();
        }, 3000 + Math.random() * 2000));
      })();
    }
    function breathe(c) {   // numeric frames alternate
      if (c.frames.length < 2) return;
      var i = 0;
      (function loop() { timers.push(setTimeout(function () { if (!c.alive) return; i = (i + 1) % c.frames.length; showFrame(c, c.frames[i]); loop(); }, 500)); })();
    }
    function talk(who, on) {   // a <-> c every 130 ms while the speaker's text is typing
      Object.keys(sprites).forEach(function (k) {
        var c = sprites[k]; if (!c || c.special) return;
        c.talkOn = false;
        if (on && c.id === who && c.frames.indexOf("c") >= 0) {
          c.talkOn = true;
          (function loop() { timers.push(setTimeout(function () {
            if (!c.alive || !c.talkOn) { if (c.alive) showFrame(c, "a"); return; }
            showFrame(c, c.cur === "c" ? "a" : "c"); loop(); }, 130)); })();
        } else if (c.alive && c.cur === "c") showFrame(c, "a");
      });
    }
    function spotlight(who, dimAll) {   // speaker: scale 1, front, bright. Other sprites while someone speaks: scale .88, dimmed, behind. Narrator: neutral. Choice: all dimmed.
      var isChar = CHAR_IDS.indexOf(who) >= 0;
      var warm = (A.warmBg || []).indexOf(curBg) >= 0 ? (A.warmFilter || "") : "";     // sunset scenes tint the sprites, composed with the dimming below
      Object.keys(sprites).forEach(function (k) {
        var c = sprites[k]; if (!c) return;
        var me = !dimAll && isChar && c.id === who, other = !dimAll && isChar && !me;
        var dim = dimAll ? "brightness(.6)" : (other ? "brightness(.75)" : "");
        c.wrap.style.filter = (warm + " " + dim).trim();
        c.scl.style.transform = other ? "scale(.88)" : "scale(1)";
        c.wrap.style.zIndex = me ? 3 : (k === "C" ? 2 : 1);
      });
    }

    /* ----- props / fx / overlay / stage effects (hooks; art-less entries are skipped) ----- */
    function addProp(o, layerName) {
      var def = (A.props || {})[o.id]; if (!def) return;
      var name = def.src.replace(/^prop\//, "").replace(/\.webp$/, "");
      if (!have("prop", name)) return;
      var im = new Image(); im.alt = ""; im.draggable = false; im.className = "prop in-" + (o.anim || "fade"); im.setAttribute("data-prop", o.id);
      im.style.left = pct(o.x != null ? o.x : def.x); im.style.top = pct(o.y != null ? o.y : def.y); im.style.width = pct(o.w != null ? o.w : def.w);
      if (o.delay) im.style.animationDelay = o.delay + "ms";
      if (o.flip) im.style.transform = "translate(-50%,-50%) scaleX(-1)";
      im.src = "art/" + def.src;
      ((o.layer || def.layer) === "front" ? pFront : pBack).appendChild(im);
    }
    function apply(cue) {
      if (!cue) return;
      if (cue.chars) Object.keys(cue.chars).forEach(function (k) { setChar(k, cue.chars[k]); });
      (cue.remove || []).forEach(function (o) { var e = s.querySelector('[data-prop="' + o.id + '"]'); if (e) e.parentNode.removeChild(e); });
      (cue.add || []).forEach(function (o) { addProp(o); });
      (cue.overlay || []).forEach(function (o) {
        var txt = L.overlay && L.overlay[o.text]; if (!txt) return;
        var ov = el("div", "ovl in-" + (o.anim || "fade"), esc(txt));
        if (o.y != null) ov.style.top = pct(o.y);
        ovL.appendChild(ov);
        if (o.ms) timers.push(setTimeout(function () { ov.parentNode && ov.parentNode.removeChild(ov); }, o.ms));
      });
      if (cue.bgfx) {
        if (cue.bgfx.dark != null) { bgfx.style.opacity = cue.bgfx.dark; }
        if (cue.bgfx.grayscale != null) bgL.style.filter = "grayscale(" + cue.bgfx.grayscale + ")";
      }
      (cue.fx || []).forEach(function (o) {   // CSS-only effects
        if (o.id === "dust-puff") {
          var d = el("div", "dust in-puff" + (o.flip ? " flip" : "")); d.style.left = pct(o.x); d.style.top = pct(o.y != null ? o.y : 76);
          fxL.appendChild(d);
        }
      });
      if (cue.glyph === "x") {   // X glyph drawn with SVG (no logo asset)
        ovL.appendChild(el("div", "xglyph in-pop", '<svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M18 18 L82 82 M82 18 L18 82" stroke="#fff" stroke-width="12" stroke-linecap="round" fill="none"/></svg>'));
      }
      (cue.stage || []).forEach(function (e) {
        if (e === "shake") shake();
      });
    }

    function typeText(node, text, done) {
      var i = 0; node.textContent = "";
      var iv = setInterval(function () {
        i++; node.textContent = text.slice(0, i);
        if (i >= text.length) { finish(); }
      }, 22);
      function finish() { clearInterval(iv); node.textContent = text; typing = null; talk(speaker, false); done && done(); }
      typing = finish;
    }
    var seqPending = [], seqT = [], busy = false;
    function flushSeq() { seqT.forEach(clearTimeout); seqT = []; var p = seqPending; seqPending = []; p.forEach(function (e) { apply(e); }); }
    function runSeq(list) {   // timeline: [{t, ...cue fields}]
      seqPending = list.slice();
      list.forEach(function (e) { seqT.push(setTimeout(function () { var i = seqPending.indexOf(e); if (i >= 0) { seqPending.splice(i, 1); apply(e); } }, e.t || 0)); });
    }
    /* a short cut-scene beat before the line (e.g. Elon asleep on the factory floor), dialog hidden meanwhile */
    function runBeat(beat, st) {
      busy = true; dlg.style.visibility = "hidden";
      setBg(beat.bg, st.kind, null);
      ["L", "C", "R"].forEach(function (k) { setChar(k, beat.chars && beat.chars[k] || null); });
      timers.push(setTimeout(function () { busy = false; dlg.style.visibility = ""; st.beatDone = true; render(); }, beat.ms || 700));
    }
    function render() {
      var st = steps[n], cue = A.cues && A.cues[st.key];
      flushSeq();
      if (cue && cue.beat && !st.beatDone) { runBeat(cue.beat, st); return; }
      setBg(st.bg, st.kind, null);
      if (cue && cue.seq) runSeq(cue.seq); else apply(cue);
      dlg.innerHTML = "";
      speaker = null;
      if (st.type === "line") {
        speaker = st.who;
        spotlight(st.who, false);
        dlg.appendChild(el("div", "name " + st.who, esc(L.speakers[st.who])));
        var t = el("div", "txt"); dlg.appendChild(t);
        var nx = el("span", "next", L.tapHint); nx.style.visibility = "hidden"; dlg.appendChild(nx);
        talk(st.who, true);
        typeText(t, st.text, function () { nx.style.visibility = "visible"; });
      } else if (st.type === "choice") {
        spotlight(null, true); talk(null, false);
        dlg.appendChild(el("div", "choice-title", esc(L.choiceTitle)));
        var cb = el("button", "btn choice-btn", esc(st.pick.label));
        cb.setAttribute("data-opt", st.pick.elon ? "elon" : "trap");
        cb.onclick = function (e) { e.stopPropagation(); n++; render(); };
        dlg.appendChild(cb);
      } else {
        spotlight(null, false); talk(null, false);
        var last = steps[n - 1];
        var box = el("div", "end-box");
        box.appendChild(el("div", "tag" + (last.kind === "bad" ? "" : " ok"), esc(last.tag || "")));
        var b = el("button", "btn primary", esc(L.replay));
        b.onclick = function (e) { e.stopPropagation(); title(); };
        box.appendChild(b); dlg.appendChild(box);
      }
    }
    s.onclick = function () {   // tap anywhere on the stage (dialog included) advances lines; choice/end need their button
      if (busy) return;
      if (typing) { typing(); return; }
      if (steps[n].type === "end" || steps[n].type === "choice") return;
      n++; render();
    };
    render();
  }

  title();
})();
