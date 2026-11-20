/* Synthesized sound effects (WebAudio recipes from art-plan-v1.md section 18-4). No files, no network.
   Every recipe is R[name](ctx, out, t, o): `out` = the voice gain node, `t` = start time, o = { r: pitch rate, big, lp, ... }. Pan, bus and gain are applied by the engine (audio.js).
   Loop recipes return { stop(t) }. The recipes also run on an OfflineAudioContext, which is how they are tested. */
(function () {
  "use strict";
  var R = window.SFX = {};
  var cache = typeof WeakMap === "function" ? new WeakMap() : null;

  function nbuf(c, kind) {
    var m = cache && cache.get(c); if (!m) { m = {}; cache && cache.set(c, m); }
    if (m[kind]) return m[kind];
    var len = Math.floor(c.sampleRate * 4), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0), last = 0, i, w;
    for (i = 0; i < len; i++) {
      w = Math.random() * 2 - 1;
      if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    m[kind] = b; return b;
  }
  /* gain envelope: 0 -> peak over a, optional hold, exponential decay d */
  function env(c, dest, t, a, peak, d, hold) {
    var g = c.createGain(), p = g.gain; hold = hold || 0;
    p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a);
    if (hold) p.setValueAtTime(peak, t + a + hold);
    p.exponentialRampToValueAtTime(0.0001, t + a + hold + d);
    g.connect(dest); return g;
  }
  function osc(c, dest, type, f0, f1, t, dur, gt) {
    var o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + (gt || dur));
    o.start(t); o.stop(t + dur + 0.05); o.connect(dest); return o;
  }
  function noise(c, dest, t, dur, kind) {
    var s = c.createBufferSource(); s.buffer = nbuf(c, kind || "white"); s.loop = true;
    s.start(t, Math.random() * 2); s.stop(t + dur + 0.05); s.connect(dest); return s;
  }
  function filt(c, type, f, q, dest) {
    var b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; b.connect(dest); return b;
  }
  function gain(c, v, dest) { var g = c.createGain(); g.gain.value = v; g.connect(dest); return g; }
  function sweep(f, t, a, b, dur) { f.frequency.setValueAtTime(a, t); f.frequency.exponentialRampToValueAtTime(b, t + dur); }
  /* a short filtered noise burst */
  function burst(c, dest, t, dur, type, f, q, peak, a, d) {
    var g = env(c, dest, t, a || 0.002, peak, d || dur), fl = filt(c, type, f, q, g); noise(c, fl, t, dur + (d || 0)); return g;
  }
  function pitch(o) { return (o.r || 1); }

  /* ---------- common UI (9) ---------- */
  R["ui-start"] = function (c, out, t, o) {
    var r = pitch(o), dl = c.createDelay(1), fb = gain(c, 0.25, dl); dl.delayTime.value = 0.15; dl.connect(fb); dl.connect(out);
    var bus = gain(c, 0.35, out); bus.connect(dl);
    [523.25, 659.25, 783.99].forEach(function (f, i) { var g = env(c, bus, t + i * 0.09, 0.005, 1, 0.14); osc(c, g, "triangle", f * r, 0, t + i * 0.09, 0.2); });
  };
  R["ui-click"] = function (c, out, t, o) {
    var r = pitch(o), g = env(c, out, t, 0.001, 0.3, 0.03), h = filt(c, "highpass", 600, 0.7, g); osc(c, h, "square", 1800 * r, 1200 * r, t, 0.04, 0.025);
  };
  R["ui-select"] = function (c, out, t, o) {
    var r = pitch(o), g = env(c, out, t, 0.004, 0.5, 0.12); osc(c, g, "sine", 660 * r, 990 * r, t, 0.15, 0.06);
    var g2 = env(c, out, t, 0.004, 0.15, 0.12); osc(c, g2, "triangle", 1320 * r, 0, t, 0.15);
  };
  R["ui-swipe"] = function (c, out, t, o) {
    var g = env(c, out, t, 0.02, 0.25, 0.12, 0.0), f = filt(c, "bandpass", 400, 1, g); sweep(f, t, 400 * pitch(o), 2400 * pitch(o), 0.14); noise(c, f, t, 0.3);
  };
  R["ui-flash"] = function (c, out, t, o) {
    var g = c.createGain(), p = g.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(0.4, t + 0.12); p.exponentialRampToValueAtTime(0.0001, t + 0.42); g.connect(out);
    noise(c, filt(c, "highpass", 1500, 0.7, g), t, 0.5);
    [880, 1320].forEach(function (f) { var e = env(c, out, t, 0.01, 0.15, 0.5); osc(c, e, "sine", f, 0, t, 0.6); });
  };
  /* typing blip (called by the engine per character): who -> timbre */
  R.tick = function (c, out, t, who) {
    var P = { narrator: ["triangle", 300, 0, 0.05], elon: ["square", 120, 900, 0.07], engineer: ["triangle", 420, 0, 0.07], board: ["sawtooth", 90, 700, 0.07], consultant: ["square", 260, 0, 0.06] }[who] || ["triangle", 300, 0, 0.05];
    var jit = 1 + (Math.random() * 0.12 - 0.06), g = env(c, out, t, 0.002, P[3], 0.026), dest = g;
    if (P[2]) dest = filt(c, "lowpass", P[2], 0.7, g);
    var o = osc(c, dest, P[0], P[1] * jit, 0, t, 0.03);
    if (who === "consultant") { o.frequency.setValueAtTime(260 * jit, t); o.frequency.linearRampToValueAtTime(300 * jit, t + 0.028); }
  };
  R["ui-choice-sting"] = function (c, out, t, o) {
    var r = pitch(o), lp = filt(c, "lowpass", 1200, 0.7, out);
    [[196, 0], [293.66, 0.16]].forEach(function (n) {
      var g = env(c, lp, t + n[1], 0.01, 0.6, 0.45), g2 = env(c, lp, t + n[1], 0.01, 0.3, 0.45);
      osc(c, g, "sine", n[0] * r, 0, t + n[1], 0.55); osc(c, g2, "triangle", n[0] * r / 2, 0, t + n[1], 0.55);
    });
    var k = env(c, out, t, 0.004, 0.7, 0.12); osc(c, k, "sine", 65 * r, 0, t, 0.2);
  };
  R["ui-choice-press"] = function (c, out, t, o) {
    var r = pitch(o), g = env(c, out, t, 0.004, 0.35, 0.09); osc(c, g, "triangle", 392 * r, 262 * r, t, 0.12, 0.09);
    R["ui-click"](c, gain(c, 0.9, out), t, { r: 1 });
  };
  R["ui-reply-hit"] = function (c, out, t, o) {
    var r = pitch(o), k = env(c, out, t, 0.003, 0.5, 0.12); osc(c, k, "sine", 98 * r, 55 * r, t, 0.16, 0.12);
    var lp = filt(c, "lowpass", 800, 0.7, out), g = env(c, lp, t, 0.005, 0.25, 0.15);
    osc(c, g, "sawtooth", 98 * r, 0, t, 0.2); osc(c, g, "sawtooth", 146.83 * r, 0, t, 0.2);
  };

  /* ---------- props / effects (9) ---------- */
  R.pop = function (c, out, t, o) { var r = pitch(o), g = env(c, out, t, 0.002, 0.4, 0.11); osc(c, g, "sine", 380 * r, 820 * r, t, 0.13, 0.07); };
  R.drop = function (c, out, t, o) {
    var big = o.big, s = big ? 1.6 : 1, r = pitch(o), dest = o.lp ? filt(c, "lowpass", o.lp, 0.7, out) : out;
    var g = env(c, dest, t, 0.003, big ? 1 : 0.8, 0.22 * s); osc(c, g, "sine", (big ? 90 : 140) * r, (big ? 30 : 45) * r, t, 0.3 * s, 0.16 * s);
    burst(c, dest, t, 0.06, "lowpass", 500, 0.7, big ? 0.7 : 0.5, 0.002, 0.06);
  };
  R.whoosh = function (c, out, t, o) {
    var r = pitch(o), g = env(c, out, t, 0.06, 0.8, 0.2), f = filt(c, "bandpass", 300 * r, 0.8, g); sweep(f, t, 300 * r, 2200 * r, 0.26); noise(c, f, t, 0.35);
  };
  R.puff = function (c, out, t, o) {
    var g = env(c, out, t, 0.005, 0.3, 0.2), f = filt(c, "lowpass", 1400, 0.7, g); sweep(f, t, 1400, 400, 0.22); noise(c, f, t, 0.3);
  };
  R.sparkle = function (c, out, t, o) {
    var r = pitch(o), dl = c.createDelay(1), fb = gain(c, 0.3, dl), wet = gain(c, 0.3, out); dl.delayTime.value = 0.12; dl.connect(fb); dl.connect(wet);
    var bus = gain(c, 0.3, out); bus.connect(dl);
    [2093, 2637, 3136].forEach(function (f, i) { var g = env(c, bus, t + i * 0.045, 0.003, 0.7, 0.22); osc(c, g, "triangle", f * r, 0, t + i * 0.045, 0.3); });
  };
  R.ding = function (c, out, t, o) {
    var r = pitch(o); [[1320, 1], [2640, 0.3], [3960, 0.1]].forEach(function (p) { var g = env(c, out, t, 0.002, 0.3 * p[1], 0.7); osc(c, g, "sine", p[0] * r, 0, t, 0.8); });
  };
  R.paper = function (c, out, t, o) {
    [0, 0.06, 0.15].forEach(function (d, i) {
      var g = env(c, out, t + d + (i === 1 ? Math.random() * 0.02 : 0), 0.003, 0.22, 0.025), h = filt(c, "highpass", 1000, 0.7, g), f = filt(c, "bandpass", 2500, 0.6, h); noise(c, f, t + d, 0.05);
    });
  };
  R.qmark = function (c, out, t, o) {
    var r = pitch(o), g = env(c, out, t, 0.01, 0.4, 0.25, 0.1); osc(c, g, "sine", 440 * r, 587 * r, t, 0.55, 0.14);
  };
  R.plink = function (c, out, t, o) {
    var r = pitch(o), dl = c.createDelay(1), fb = gain(c, 0.25, dl); dl.delayTime.value = 0.13; dl.connect(fb); dl.connect(gain(c, 0.2, out));
    var g = env(c, out, t, 0.002, 0.25, 0.12), g2 = c.createGain(); g2.gain.value = 1; g.connect(dl);
    osc(c, g, "sine", 1800 * r, 1200 * r, t, 0.15, 0.04);
  };

  /* ---------- scene-specific (32) ---------- */
  R["clock-tick"] = function (c, out, t, o) {
    [[0, 3200], [0.5, 2600]].forEach(function (p) { burst(c, out, t + p[0], 0.012, "bandpass", p[1], 8, 0.3 * 3, 0.001, 0.012); });
  };
  R.bubble = function (c, out, t, o) {
    var r = pitch(o);
    [0, 0.08].forEach(function (d, i) {
      var g = env(c, out, t + d, 0.01, 0.4, 0.18), s = osc(c, g, "sine", (500 + i * 80) * r, (1000 + i * 120) * r, t + d, 0.25, 0.12);
      var lf = c.createOscillator(), lg = gain(c, 40, s.frequency); lf.frequency.value = 25; lf.connect(lg); lf.start(t + d); lf.stop(t + d + 0.3);
    });
  };
  R.servo = function (c, out, t, o) {
    var r = pitch(o), lp = filt(c, "lowpass", 1400, 0.7, out), g = env(c, lp, t, 0.02, 0.5, 0.15, 0.25), s = osc(c, g, "sawtooth", 180 * r, 360 * r, t, 0.45, 0.4);
    var am = c.createGain(); am.gain.value = 0.5; var lf = c.createOscillator(); lf.frequency.value = 30 * r; var lg = gain(c, 0.5, am.gain); lf.connect(lg); lf.start(t); lf.stop(t + 0.6);
    // AM: route the saw through an extra gain whose gain is modulated
    s.disconnect(); s.connect(am); am.connect(g);
    var ng = env(c, out, t, 0.02, 0.1, 0.15, 0.25), f = filt(c, "bandpass", 2000, 1, ng); noise(c, f, t, 0.5);
  };
  R["alarm-loop"] = function (c, out, t, o) {
    var lp = filt(c, "lowpass", 2200, 0.7, out), g = gain(c, 1, lp), s = c.createOscillator(); s.type = "square"; s.connect(g);
    var i; for (i = 0; i < 160; i++) s.frequency.setValueAtTime(i % 2 ? 660 : 880, t + i * 0.25);
    s.start(t); s.stop(t + 40.1);
    return { stop: function (tt) { try { s.stop(tt + 0.05); } catch (e) {} } };
  };
  var loopBufs = {};
  /* offline-rendered loops (built once after the audio unlock) */
  R.prepare = function (c) {
    var sr = c.sampleRate, done = [];
    function render(name, dur, build) {
      var oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, Math.floor(sr * dur), sr);
      build(oc, oc.destination);
      var p = oc.startRendering();
      if (p && p.then) { done.push(p.then(function (b) { loopBufs[name] = b; })); }
      else { done.push(new Promise(function (res) { oc.oncomplete = function (e) { loopBufs[name] = e.renderedBuffer; res(); }; })); }
    }
    render("snore", 3.2, function (oc, d) {   // 3.2 s: inhale swell 1.1 s, exhale 0.9 s (quieter), rest
      var g = oc.createGain(), p = g.gain; g.connect(d);
      p.setValueAtTime(0.0001, 0); p.linearRampToValueAtTime(0.25, 0.08); p.linearRampToValueAtTime(1.0 * 0.25, 1.0);
      p.linearRampToValueAtTime(0.12 * 0.25, 1.15); p.linearRampToValueAtTime(0.5 * 0.25, 1.5); p.linearRampToValueAtTime(0.0001, 2.0); p.setValueAtTime(0.0001, 3.12);
      var f = oc.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 220; f.Q.value = 2.5; f.connect(g);
      var n = oc.createBufferSource(); n.buffer = nbuf(oc, "brown"); n.loop = true; n.connect(f); n.start(0, 1);
      var sa = oc.createOscillator(); sa.type = "sawtooth"; sa.frequency.value = 62; var sg = oc.createGain(); sg.gain.setValueAtTime(0, 0); sg.gain.linearRampToValueAtTime(0.05, 0.6); sg.gain.linearRampToValueAtTime(0, 1.2);
      var vb = oc.createOscillator(), vg = gain(oc, 3, sa.frequency); vb.frequency.value = 5; vb.connect(vg); vb.start(0); sa.connect(sg); sg.connect(g); sa.start(0);
    });
    render("hum", 4, function (oc, d) {
      var g = gain(oc, 0.15 * 1.8, d);
      var a = oc.createOscillator(); a.frequency.value = 60; a.connect(g); a.start(0);
      var b = oc.createOscillator(); b.type = "triangle"; b.frequency.value = 120; b.connect(gain(oc, 0.4, g)); b.start(0);
      var nf = oc.createBiquadFilter(); nf.type = "lowpass"; nf.frequency.value = 180; var ng = gain(oc, 0.3 * 3, g); nf.connect(ng);
      var n = oc.createBufferSource(); n.buffer = nbuf(oc, "brown"); n.loop = true; n.connect(nf); n.start(0, 0.5);
    });
    return Promise.all(done);
  };
  function loopFrom(name) {
    return function (c, out, t, o) {
      var b = loopBufs[name]; if (!b) return null;
      var s = c.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = pitch(o); s.connect(out); s.start(t);
      return { stop: function (tt) { try { s.stop(tt + 0.05); } catch (e) {} } };
    };
  }
  R["snore-loop"] = loopFrom("snore");
  R["hum-loop"] = loopFrom("hum");
  R["tent-pop"] = function (c, out, t, o) {
    burst(c, out, t, 0.22, "lowpass", 900, 0.7, 0.9, 0.003, 0.22);
    var g = env(c, out, t, 0.003, 0.8, 0.25); osc(c, g, "sine", 85, 55, t, 0.3, 0.25);
    [0.12, 0.2].forEach(function (d) { burst(c, out, t + d, 0.1, "bandpass", 700, 1, 0.5, 0.01, 0.1); });
  };
  R.stamp = function (c, out, t, o) {
    var g = env(c, out, t, 0.002, 0.9, 0.1); osc(c, g, "sine", 110, 60, t, 0.14, 0.1);
    burst(c, out, t, 0.07, "lowpass", 1400, 0.7, 0.6, 0.001, 0.07); burst(c, out, t, 0.015, "highpass", 3000, 0.7, 0.4, 0.001, 0.015);
  };
  R.flicker = function (c, out, t, o) {
    var g = env(c, out, t, 0.003, 0.15, 0.04, 0.02); osc(c, g, "square", 100, 0, t, 0.08);
    burst(c, out, t, 0.04, "bandpass", 1000, 1, 0.15, 0.002, 0.04);
  };
  R["lights-off"] = function (c, out, t, o) {
    burst(c, out, t, 0.02, "highpass", 2000, 0.7, 0.4, 0.001, 0.02);
    var g = env(c, out, t, 0.004, 0.7, 0.5); osc(c, g, "sine", 120, 35, t, 0.6, 0.5);
  };
  R["slide-down"] = function (c, out, t, o) {
    var g = env(c, out, t, 0.01, 0.3, 0.5), s = osc(c, g, "sine", 1200, 280, t, 0.6, 0.52);
    var lf = c.createOscillator(), lg = gain(c, 40, s.frequency); lf.frequency.value = 6; lf.connect(lg); lf.start(t); lf.stop(t + 0.6);
  };
  R["chart-up"] = function (c, out, t, o) {
    [523.25, 587.33, 659.25, 783.99, 880].forEach(function (f, i) { var g = env(c, out, t + i * 0.07, 0.004, 0.18 + i * 0.05, 0.2); osc(c, g, "triangle", f, 0, t + i * 0.07, 0.3); });
    R.sparkle(c, out, t + 0.38, { r: 1 });
  };
  R.sand = function (c, out, t, o) {
    var g = c.createGain(), p = g.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(0.12, t + 0.15); p.setValueAtTime(0.12, t + 1.15); p.linearRampToValueAtTime(0.0001, t + 1.4); g.connect(out);
    var am = c.createGain(); am.gain.value = 0.3; am.connect(g); var lf = c.createOscillator(), lg = gain(c, 0.7 * 0.5, am.gain); lf.frequency.value = 40; lf.connect(lg); lf.start(t); lf.stop(t + 1.5);
    noise(c, filt(c, "highpass", 4000, 0.7, am), t, 1.4);
  };
  R["glass-tink"] = function (c, out, t, o) {
    [[2300, 1], [3500, 0.4]].forEach(function (p) { var g = env(c, out, t, 0.002, 0.4 * p[1], 0.35); osc(c, g, "sine", p[0], 0, t, 0.45); });
  };
  R["rope-clink"] = function (c, out, t, o) {
    [1900, 2550].forEach(function (f) { var g = env(c, out, t, 0.002, 0.3, 0.3); osc(c, g, "sine", f, 0, t, 0.4); });
    burst(c, out, t, 0.02, "highpass", 3000, 0.7, 0.3, 0.001, 0.02);
    var k = env(c, out, t, 0.003, 0.5, 0.08); osc(c, k, "sine", 80, 0, t, 0.12);
  };
  R["fanfare-wonky"] = function (c, out, t, o) {
    var lp = filt(c, "lowpass", 2500, 0.7, out);
    [[261.63, 0], [329.63, 0.16], [392, 0.32]].forEach(function (n) {
      var g = env(c, lp, t + n[1], 0.01, 0.3, 0.12, 0.03), s = osc(c, g, "square", n[0], 0, t + n[1], 0.2);
      var lf = c.createOscillator(), lg = gain(c, 5, s.frequency); lf.frequency.value = 5; lf.connect(lg); lf.start(t); lf.stop(t + 1.2);
    });
    var g = env(c, lp, t + 0.48, 0.01, 0.32, 0.18, 0.3), s = c.createOscillator(); s.type = "square"; s.frequency.setValueAtTime(523.25, t + 0.48);
    s.frequency.setValueAtTime(523.25, t + 0.58); s.frequency.exponentialRampToValueAtTime(523.25 * Math.pow(2, -5 / 12), t + 1.08); s.connect(g); s.start(t + 0.48); s.stop(t + 1.2);
  };
  R["sting-shock"] = function (c, out, t, o) {
    var lp = filt(c, "lowpass", 2500, 0.7, out), g = env(c, lp, t, 0.003, 0.35, 0.4);
    [233.08, 246.94, 261.63].forEach(function (f) { osc(c, g, "sawtooth", f, 0, t, 0.5); });
    burst(c, out, t, 0.08, "bandpass", 1500, 0.7, 0.4, 0.001, 0.08);
  };
  R["bad-sting"] = function (c, out, t, o) {   // sad trombone: sawtooth through a wah (band-pass swept 500-1100-500 Hz at 4 Hz)
    var g = env(c, out, t, 0.02, 0.35, 0.3, 1.9), w = filt(c, "bandpass", 700, 4, g), s = c.createOscillator(); s.type = "sawtooth";
    s.frequency.setValueAtTime(233.08, t); s.frequency.setValueAtTime(220, t + 0.33); s.frequency.setValueAtTime(207.65, t + 0.66);
    s.frequency.setValueAtTime(196, t + 0.99); s.frequency.exponentialRampToValueAtTime(160, t + 1.89);
    var vb = c.createOscillator(), vg = gain(c, 3, s.frequency); vb.frequency.value = 5.5; vb.connect(vg); vb.start(t + 0.99); vb.stop(t + 2.3);
    var lf = c.createOscillator(), lg = gain(c, 300, w.frequency); lf.frequency.value = 4; lf.connect(lg); lf.start(t); lf.stop(t + 2.3);
    s.connect(w); s.start(t); s.stop(t + 2.3);
    var boost = 2.2; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35 * boost, t + 0.03); g.gain.setValueAtTime(0.35 * boost, t + 1.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.25);
  };
  R["bad-final"] = function (c, out, t, o) {
    var g = env(c, out, t, 0.01, 0.45, 0.7), f = filt(c, "lowpass", 3000, 0.7, g); sweep(f, t, 3000, 200, 0.7); noise(c, f, t, 0.8);
    var s = env(c, out, t, 0.01, 0.5, 0.9); osc(c, s, "sine", 300, 60, t, 1.0, 0.9);
    var tb = env(c, out, t + 0.8, 0.01, 0.5, 0.15); osc(c, tb, "sine", 55, 0, t + 0.8, 0.2);
  };
  R.footsteps = function (c, out, t, o) {   // one step (the engine repeats it: n / gap / ramp)
    var r = pitch(o), g = env(c, out, t, 0.003, 0.8, 0.09); osc(c, g, "sine", 90 * r, 60 * r, t, 0.12, 0.09);
    burst(c, out, t, 0.04, "lowpass", 400, 0.7, 0.6, 0.002, 0.04);
  };
  R["sink-thud"] = function (c, out, t, o) {
    var g = env(c, out, t, 0.004, 1.0, 0.45); osc(c, g, "sine", 70, 32, t, 0.55, 0.45);
    burst(c, out, t, 0.14, "lowpass", 900, 0.7, 0.7, 0.002, 0.14);
    [1100, 1650, 2430].forEach(function (f) { var e = env(c, out, t, 0.002, 0.18 / 1.5, 0.28); osc(c, e, "sine", f, 0, t, 0.35); });
  };
  R["bird-chirp"] = function (c, out, t, o) {
    [[0, 2400, 3400], [0.11, 2400, 3400], [0.19, 2800, 2200]].forEach(function (n) {
      var g = env(c, out, t + n[0], 0.003, 0.25, 0.06), s = osc(c, g, "sine", n[1], n[2], t + n[0], 0.12, 0.07);
      var fm = c.createOscillator(), fg = gain(c, 120, s.frequency); fm.frequency.value = 22; fm.connect(fg); fm.start(t + n[0]); fm.stop(t + n[0] + 0.15);
    });
  };
  R["logo-pop"] = function (c, out, t, o) {
    var g = env(c, out, t, 0.004, 0.4, 0.16); osc(c, g, "sine", 300, 900, t, 0.2, 0.16);
    var g2 = env(c, out, t, 0.004, 0.2, 0.2); osc(c, g2, "triangle", 1800, 0, t, 0.25);
    R.sparkle(c, out, t + 0.08, { r: 1 });
  };
  R.glitch = function (c, out, t, o) {
    var g = env(c, out, t, 0.002, 0.3, 0.02, 0.06), s = c.createOscillator(), i; s.type = "square"; s.frequency.setValueAtTime(1000, t);
    for (i = 0; i < 6; i++) s.frequency.setValueAtTime(400 + Math.random() * 2600, t + i * 0.01 + 0.005);
    s.connect(g); s.start(t); s.stop(t + 0.1);
    [0.02, 0.07].forEach(function (d) { burst(c, out, t + d, 0.015, "highpass", 2000, 0.7, 0.3, 0.001, 0.015); });
  };
  R["orb-up"] = function (c, out, t, o) {
    [1, 1.5].forEach(function (k) {
      var g = env(c, out, t, 0.01, 0.3, 0.35), s = osc(c, g, "sine", 220 * k, 440 * k, t, 0.45, 0.35);
      var lf = c.createOscillator(), lg = gain(c, 6, s.frequency); lf.frequency.value = 7; lf.connect(lg); lf.start(t); lf.stop(t + 0.5);
    });
    burst(c, out, t, 0.35, "highpass", 6000, 0.7, 0.05, 0.01, 0.35);
  };
  R["cursor-ping"] = function (c, out, t, o) { var g = env(c, out, t, 0.002, 0.2, 0.08); osc(c, g, "sine", 2000, 2600, t, 0.12, 0.04); };
  R["ring-ping"] = function (c, out, t, o) {
    var dl = c.createDelay(1), fb = gain(c, 0.4, dl); dl.delayTime.value = 0.25; dl.connect(fb); dl.connect(out);
    var g = env(c, out, t, 0.003, 0.25, 0.9); g.connect(dl); osc(c, g, "sine", 1000, 0, t, 1.0);
  };
  R.hush = function (c, out, t, o) {
    var g = c.createGain(), p = g.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(0.2 * 2, t + 0.5); p.exponentialRampToValueAtTime(0.0001, t + 1.2); g.connect(out);
    noise(c, filt(c, "lowpass", 300, 0.7, g), t, 1.3);
  };
  R["line-draw"] = function (c, out, t, o) { var r = pitch(o), g = env(c, out, t, 0.004, 0.4, 0.3, 0.06); osc(c, g, "triangle", 523.25 * r, 0, t, 0.45); };
  R.riser = function (c, out, t, o) {
    var g = c.createGain(), p = g.gain; p.setValueAtTime(0.0001, t); p.exponentialRampToValueAtTime(0.35, t + 2.35); p.linearRampToValueAtTime(0.0001, t + 2.45); g.connect(out);
    var f = filt(c, "highpass", 500, 0.7, g); sweep(f, t, 500, 9000, 2.4); noise(c, f, t, 2.5);
    [1047, 1568, 2093].forEach(function (fr) { var e = env(c, out, t + 2.3, 0.01, 0.15, 1.2); osc(c, e, "sine", fr, 0, t + 2.3, 1.3); });
  };
  R["count-tick"] = function (c, out, t, o) {
    var r = pitch(o), lp = filt(c, "lowpass", 4000, 0.7, out), g = env(c, lp, t, 0.001, 0.12 * 2, 0.015); osc(c, g, "square", 600 * r, 1800 * r, t, 0.03, 0.015);
  };
  R.envelopes = function (c, out, t, o) {
    var i, ts = []; for (i = 0; i < 14; i++) ts.push(Math.random() * 0.7); ts.sort();
    ts.forEach(function (d, k) { burst(c, out, t + d, 0.01, "bandpass", 3000, 1, 0.5 * (1 - k / 18), 0.001, 0.01); });
    R.drop(c, gain(c, 0.5, out), t + 0.5, { r: 1 });
  };
})();
