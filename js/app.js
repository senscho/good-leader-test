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
  function pastel(sec) {   // title + survey: bg-title behind a white wash (css .pastel)
    if (have("bg", "title")) { sec.style.backgroundImage = 'url("art/bg/bg-title.webp")'; setBackdrop("art/bg/bg-title.webp"); } else setBackdropNone();
  }
  var ICONS = ["q-worklife", "q-trust", "q-giveup", "q-protocol"];   // by question index
  function title() {
    clear(); answers = []; L = null;
    document.documentElement.lang = "ko";
    var s = el("section", "screen center pastel");
    pastel(s);
    var card = el("div", "card");
    card.innerHTML = '<h1>좋은 리더 테스트</h1><div class="sub-title" style="margin-top:6px">The Good Leader Test</div><div class="dim" style="margin:14px 0 18px">나는 어떤 리더일까? · 4 questions, about a minute</div>';
    var st = el("div", "stack");
    [["ko", "한국어"], ["en", "English"]].forEach(function (p) {
      var b = el("button", "btn lang", p[1]);
      b.setAttribute("data-lang", p[0]);
      b.onclick = function () { start(p[0]); };
      st.appendChild(b);
    });
    card.appendChild(st); s.appendChild(card);
    if (have("fx", "sparkle")) [["16%", "20%", "0s"], ["82%", "30%", "1.1s"]].forEach(function (q) {
      var sp = new Image(); sp.alt = ""; sp.className = "fxi in-twinkle"; sp.src = "art/fx/fx-sparkle.webp";
      sp.style.left = q[0]; sp.style.top = q[1]; sp.style.width = "11%"; sp.style.animationDelay = q[2]; s.appendChild(sp);
    });
    show(s);
    preload(["art/prop/prop-q-worklife.webp", "art/prop/prop-q-trust.webp", "art/prop/prop-q-giveup.webp", "art/prop/prop-q-protocol.webp"]);
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
    var s = el("section", "screen pastel");
    pastel(s);
    var p = el("div", "progress");
    for (var k = 0; k < 4; k++) p.appendChild(el("i", k <= pos ? "on" : ""));
    s.appendChild(p);
    var w = el("div", "qwrap"), card = el("div", "card"), icon = null;
    if (have("prop", ICONS[i])) { icon = new Image(); icon.alt = ""; icon.className = "qicon"; icon.src = "art/prop/prop-" + ICONS[i] + ".webp"; card.appendChild(icon); }
    card.appendChild(el("div", "qnum", L.qLabel + " " + (pos + 1) + " / 4"));
    card.appendChild(el("h2", "qtext", esc(q.q)));
    var st = el("div", "stack");
    order[i].forEach(function (oi) {
      var b = el("button", "btn", esc(q.opts[oi]));
      b.setAttribute("data-opt", oi === 1 ? "elon" : "trap");
      b.onclick = function () {
        if (s.getAttribute("data-done")) return; s.setAttribute("data-done", "1");
        answers[i] = { idx: i, elon: oi === 1, label: q.opts[oi] };
        if (pos < 3) { if (icon) icon.className = "qicon out"; setTimeout(function () { question(pos + 1); }, icon ? 220 : 0); }
        else { s.appendChild(el("div", "flash")); setTimeout(story, 160); }   // white flash, then the story
      };
      st.appendChild(b);
    });
    card.appendChild(st); w.appendChild(card); s.appendChild(w);
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
          ln("bad." + i + "." + k, (i === 3 && k < 4) ? SEQ_BG[3] : BAD_BG[i], "bad", l, { tag: L.badTags[i], last: k === arr.length - 1 });
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
    var bgState = { sat: 1, gray: 0 };
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
      bgfx.style.opacity = 0; bgState = { sat: 1, gray: 0 }; bgL.style.filter = "";
      bgL.style.transition = "none"; bgL.style.transform = ""; void bgL.offsetWidth; bgL.style.transition = "";
      pBack.classList.remove("dim"); pFront.classList.remove("dim");
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
    function spotlight(who, dimAll) {   // speaker: scale 1, front, bright. Other sprites while someone speaks: dimmed, behind (no scaling). Narrator: neutral. Choice: all dimmed.
      var isChar = CHAR_IDS.indexOf(who) >= 0;
      var warm = (A.bgFilter && A.bgFilter[curBg]) || "";     // sunset tint / bright-bg matching per background, composed with the dimming below
      Object.keys(sprites).forEach(function (k) {
        var c = sprites[k]; if (!c) return;
        var me = !dimAll && isChar && c.id === who, other = !dimAll && isChar && !me;
        var dim = dimAll ? "brightness(.6)" : (other ? "brightness(.75)" : "");
        c.wrap.style.filter = (warm + " " + dim).trim();
        c.scl.style.transform = "scale(1)";   // all sprites stay at full size; overlap is fine, the speaker is in front
        c.wrap.style.zIndex = me ? 3 : (k === "C" ? 2 : 1);
      });
    }

    /* ----- props / logos / fx / overlay / stage effects (art-less entries are skipped, so missing art never breaks a scene) ----- */
    var KIND_FILE = { prop: function (n) { return "art/prop/prop-" + n + ".webp"; }, fx: function (n) { return "art/fx/fx-" + n + ".webp"; },
                      logo: function (n) { return "art/logo/logo-" + n + ".svg"; }, chr: function (n) { return "art/chr/" + n + ".webp"; } };
    function wapi(node, frames, opt) { if (node.animate) return node.animate(frames, opt); return null; }
    function stageSize() { return { w: s.clientWidth || 390, h: s.clientHeight || 844 }; }
    function addProp(o) {
      var def = (A.props || {})[o.id]; if (!def) return null;
      var kind = def.kind || "prop", nm = o.name || def.name;
      if (!have(kind, nm)) return null;
      var im = new Image(); im.alt = ""; im.draggable = false;
      im.className = "prop" + (def.cls ? " " + def.cls : "") + (o.cls ? " " + o.cls : "");
      im.setAttribute("data-prop", o.id); im.setAttribute("data-key", o.key || o.id);
      var x = o.x != null ? o.x : def.x, y = o.y != null ? o.y : def.y, w = o.w != null ? o.w : def.w, h = o.h != null ? o.h : def.h;
      im.style.left = pct(x); im.style.top = pct(y); im.style.width = pct(w);
      if (h != null) { im.style.height = pct(h); im.style.objectFit = "cover"; }
      if (o.op != null) im.style.opacity = o.op;
      if (o.flip) im.style.scale = "-1 1";
      if (o.rot != null) im.style.rotate = o.rot + "deg";
      if (o.delay) im.style.animationDelay = o.delay + "ms";
      var an = o.anim || "fade"; if (an !== "none") im.classList.add("in-" + an);
      im.src = KIND_FILE[kind](nm);
      ((o.layer || def.layer) === "front" ? pFront : pBack).appendChild(im);
      if (o.loop) timers.push(setTimeout(function () { im.classList.remove("in-" + an); im.classList.add("loop-" + o.loop); }, (o.delay || 0) + 700));
      if (o.fly) {   // fly in from another point of the stage (percent coordinates), ending at x,y
        var S = stageSize(), fx = ((o.fly.x != null ? o.fly.x : x) - x) / 100 * S.w, fy = ((o.fly.y != null ? o.fly.y : y) - y) / 100 * S.h;
        wapi(im, [{ transform: "translate(" + fx + "px," + fy + "px) scale(" + (o.fly.s || 1) + ")", opacity: o.fly.op != null ? o.fly.op : 1 }, { transform: "none", opacity: 1 }],
             { duration: o.fly.ms || 700, easing: o.fly.ease || "ease-out", delay: o.delay || 0, fill: "backwards" });
      }
      if (def.alt && have(kind, def.alt)) {   // two-frame prop (crowd cheer): alternate a <-> b
        var a2 = new Image(); a2.src = KIND_FILE[kind](def.alt); var cur = 0;
        (function loop() { timers.push(setTimeout(function () { if (!im.parentNode) return; cur ^= 1; im.src = KIND_FILE[kind](cur ? def.alt : nm); loop(); }, def.altMs || 320)); })();
      }
      return im;
    }
    function layersFor(id, key) {
      var sel = '[data-prop="' + id + '"]' + (key ? '[data-key="' + key + '"]' : "");
      var out = [];
      [pBack, pFront].forEach(function (L2) { out = out.concat([].slice.call(L2.querySelectorAll(sel))); });
      out = out.concat([].slice.call(ovL.querySelectorAll('[data-chip="' + id + '"]')), [].slice.call(fxL.querySelectorAll('[data-fx="' + id + '"]')));
      return out;
    }
    function removeThing(o) {
      layersFor(o.id, o.key).forEach(function (e) {
        if (o.anim) { e.classList.remove("in-pop", "in-drop", "in-fade", "in-wipe", "loop-float", "loop-spin", "loop-spin2", "loop-wobble"); e.classList.add("out-" + o.anim); timers.push(setTimeout(function () { e.parentNode && e.parentNode.removeChild(e); }, 520)); }
        else e.parentNode && e.parentNode.removeChild(e);
      });
    }
    function modThing(o) {   // change a prop already on stage: rotate / scale / move / re-play a loop
      layersFor(o.id, o.key).forEach(function (e) {
        e.style.transition = "rotate .45s ease, scale .5s ease, left .6s ease, top .6s ease";
        if (o.rot != null) e.style.rotate = o.rot + "deg";
        if (o.scale != null) e.style.scale = (o.flipx ? "-" : "") + o.scale + " " + o.scale;
        if (o.x != null) e.style.left = pct(o.x);
        if (o.y != null) e.style.top = pct(o.y);
        if (o.loop) { e.classList.remove("loop-spin", "loop-float", "loop-wobble", "loop-spin2"); e.classList.add("loop-" + o.loop); }
        if (o.op != null) e.style.opacity = o.op;
      });
    }
    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    function chip(o) {   // text chip / sign: updates in place when the id already exists
      var tpl = o.raw != null ? o.raw : (L.overlay && L.overlay[o.text]); if (tpl == null) return;
      var txt = o.n != null ? tpl.replace("{n}", typeof o.n === "number" ? fmt(o.n) : o.n) : tpl;
      var ex = ovL.querySelector('[data-chip="' + o.id + '"]'), ov;
      if (ex) { ov = ex; ov.textContent = txt; ov.classList.remove("in-pop"); void ov.offsetWidth; ov.classList.add("in-pop"); }
      else {
        ov = el("div", "ovl in-" + (o.anim || "pop") + (o.big ? "" : " chip") + (o.cls ? " " + o.cls : ""));
        ov.textContent = txt; ov.setAttribute("data-chip", o.id); ovL.appendChild(ov);
      }
      if (o.y != null) ov.style.top = pct(o.y);
      if (o.x != null) ov.style.left = pct(o.x);
      if (o.ms) timers.push(setTimeout(function () { ov.parentNode && ov.parentNode.removeChild(ov); }, o.ms));
      if (o.count) {   // count-up
        var t0 = null, ms = o.count.ms || 1200;
        (function step(t) { if (t0 == null) t0 = t; var k = Math.min(1, (t - t0) / ms); ov.textContent = tpl.replace("{n}", fmt(Math.round(o.count.from + (o.count.to - o.count.from) * k))); if (k < 1 && ov.parentNode) requestAnimationFrame(step); })(performance.now());
      }
    }
    function slotX(slot) { var c = sprites[slot]; return c ? parseFloat(c.wrap.style.left) : 50; }
    function fxImg(id, o, cls, ms) {
      if (!have("fx", id)) return null;
      var im = new Image(); im.alt = ""; im.className = "fxi " + cls; im.setAttribute("data-fx", o.fxid || id);
      im.style.left = pct(o.x); im.style.top = pct(o.y != null ? o.y : 50); im.style.width = pct(o.w || 12);
      if (o.flip) im.style.scale = "-1 1";
      im.src = KIND_FILE.fx(id); fxL.appendChild(im);
      if (ms) timers.push(setTimeout(function () { im.parentNode && im.parentNode.removeChild(im); }, ms));
      return im;
    }
    function confetti(o) {
      var box = el("div", "confetti"); box.setAttribute("data-fx", "confetti");
      var cols = o.cols || ["#ff6b8b", "#ffd166", "#06d6a0", "#4cc9f0", "#c77dff"];
      for (var i = 0; i < (o.n || 26); i++) {
        var p = el("i"); p.style.left = (Math.random() * 100) + "%"; p.style.background = cols[i % cols.length];
        p.style.animationDuration = (2.2 + Math.random() * 2) + "s"; p.style.animationDelay = (-Math.random() * 4) + "s"; box.appendChild(p);
      }
      fxL.appendChild(box);
    }
    function launch(o) {   // rocket flies from -> to (percent coords) with a smoke trail wiping along the path
      var S = stageSize(), dx = (o.to.x - o.from.x) / 100 * S.w, dy = (o.from.y - o.to.y) / 100 * S.h;   // dy: up is positive
      var len = Math.sqrt(dx * dx + dy * dy), up = Math.atan2(dy, dx) * 180 / Math.PI, ms = o.ms || 1600;
      if (have("fx", "smoke-trail")) {
        var tr = new Image(); tr.alt = ""; tr.className = "fxi"; tr.setAttribute("data-fx", "smoke");
        tr.style.left = pct((o.from.x + o.to.x) / 2); tr.style.top = pct((o.from.y + o.to.y) / 2); tr.style.width = Math.round(len) + "px";
        tr.style.rotate = (-up) + "deg"; tr.src = KIND_FILE.fx("smoke-trail"); fxL.appendChild(tr);
        wapi(tr, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: ms, easing: "ease-out", fill: "both" });
        timers.push(setTimeout(function () { wapi(tr, [{ opacity: 1 }, { opacity: 0 }], { duration: 1400, fill: "forwards" }); timers.push(setTimeout(function () { tr.parentNode && tr.parentNode.removeChild(tr); }, 1500)); }, ms + 500));
      }
      var r = addProp({ id: "rocket", anim: "none", x: o.to.x, y: o.to.y, rot: 90 - up, layer: "front" });
      if (r) { r.classList.add("in-none"); wapi(r, [{ transform: "translate(" + (-dx) + "px," + dy + "px)" }, { transform: "none" }], { duration: ms, easing: "ease-out", fill: "backwards" }); }
    }
    function lines(o) {   // gold lines drawn one after another from a point to each target (SVG)
      var S = stageSize(), ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 " + S.w + " " + S.h); svg.setAttribute("class", "goldlines"); svg.setAttribute("data-fx", "goldlines");
      svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
      fxL.appendChild(svg);
      o.to.forEach(function (t, i) {
        var ln2 = document.createElementNS(ns, "line"), x1 = o.from.x / 100 * S.w, y1 = o.from.y / 100 * S.h, x2 = t.x / 100 * S.w, y2 = t.y / 100 * S.h, L2 = Math.hypot(x2 - x1, y2 - y1);
        ln2.setAttribute("x1", x1); ln2.setAttribute("y1", y1); ln2.setAttribute("x2", x2); ln2.setAttribute("y2", y2);
        ln2.setAttribute("stroke", "#E9C46A"); ln2.setAttribute("stroke-width", 2.5); ln2.setAttribute("stroke-linecap", "round"); ln2.style.opacity = .9;
        ln2.setAttribute("stroke-dasharray", L2); ln2.setAttribute("stroke-dashoffset", L2); svg.appendChild(ln2);
        wapi(ln2, [{ strokeDashoffset: L2 }, { strokeDashoffset: 0 }], { duration: 500, delay: i * 450, easing: "ease-out", fill: "forwards" });
      });
    }
    function applyBgFilter() { bgL.style.filter = "saturate(" + bgState.sat + ") grayscale(" + bgState.gray + ")"; }
    function apply(cue) {
      if (!cue) return;
      if (cue.chars) Object.keys(cue.chars).forEach(function (k) { setChar(k, cue.chars[k]); });
      (cue.remove || []).forEach(removeThing);
      (cue.add || []).forEach(addProp);
      (cue.mod || []).forEach(modThing);
      (cue.overlay || []).forEach(chip);
      if (cue.bgfx) {
        if (cue.bgfx.dark != null) bgfx.style.opacity = cue.bgfx.dark;
        if (cue.bgfx.grayscale != null) { bgState.gray = cue.bgfx.grayscale; applyBgFilter(); }
        if (cue.bgfx.sat != null) { bgState.sat = cue.bgfx.sat; applyBgFilter(); }
      }
      if (cue.zoom) { bgL.style.transformOrigin = cue.zoom.ox + "% " + cue.zoom.oy + "%"; bgL.style.transform = "scale(" + cue.zoom.s + ")"; }
      if (cue.propDim != null) { pBack.classList.toggle("dim", !!cue.propDim); pFront.classList.toggle("dim", !!cue.propDim); }
      (cue.fx || []).forEach(function (o) {
        if (o.id === "dust-puff") {
          var y = o.y != null ? o.y : 76;
          if (!fxImg("dust-puff", { x: o.x, y: y, w: o.w || 18, flip: o.flip }, "in-puffi", 800)) {   // no art: CSS puff
            var d = el("div", "dust in-puff" + (o.flip ? " flip" : "")); d.style.left = pct(o.x); d.style.top = pct(y); fxL.appendChild(d);
          }
        } else if (o.id === "sparkle") fxImg("sparkle", o, "in-spark", 1000);
        else if (o.id === "sweat") {   // beside a sprite's head
          var sx = o.at ? slotX(o.at) + (o.dx != null ? o.dx : 8) : o.x; fxImg("sweat", { x: sx, y: o.y != null ? o.y : 36, w: o.w || 6 }, "in-pop", o.ms || 1800);
        } else if (o.id === "ring") { var rg = el("div", "ring"); rg.style.left = pct(o.x); rg.style.top = pct(o.y); fxL.appendChild(rg); timers.push(setTimeout(function () { rg.parentNode && rg.parentNode.removeChild(rg); }, 900)); }
        else if (o.id === "alarm") { var al = el("div", "alarm"); al.setAttribute("data-fx", "alarm"); al.style.left = pct(o.x); al.style.top = pct(o.y); fxL.appendChild(al); }
        else if (o.id === "confetti") confetti(o);
        else if (o.id === "confetti-gray") { var cf = fxL.querySelector(".confetti"); if (cf) cf.classList.add("gray"); }
        else if (o.id === "qmark") chip({ id: o.key || "qm", raw: "?", cls: "qm", x: slotX(o.at) + (o.dx || 0), y: o.y != null ? o.y : 30, ms: o.ms || 2200 });
      });
      if (cue.launch) launch(cue.launch);
      if (cue.lines) lines(cue.lines);
      (cue.stage || []).forEach(function (e) { if (e === "shake") shake(); });
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
    /* a cut-scene beat before the line (e.g. Elon asleep on the factory floor): no dialog box, a blinking tap arrow, waits for a tap */
    var beatWait = null;
    function runBeat(beat, st) {
      busy = true; dlg.style.display = "none";
      setBg(beat.bg, st.kind, null);
      ["L", "C", "R"].forEach(function (k) { setChar(k, beat.chars && beat.chars[k] || null); });
      var hint = el("div", "beat-hint", "▼"); s.appendChild(hint);
      timers.push(setTimeout(function () {   // short guard so the tap that opened the beat cannot skip it
        busy = false;
        beatWait = function () { beatWait = null; if (hint.parentNode) hint.parentNode.removeChild(hint); dlg.style.display = ""; st.beatDone = true; render(); };
      }, beat.guard || 450));
    }
    function render() {
      var st = steps[n], cue = A.cues && A.cues[st.key];
      flushSeq();
      if (cue && cue.beat && !st.beatDone) { runBeat(cue.beat, st); return; }
      setBg(st.bg, st.kind, null);
      apply(cue); if (cue && cue.seq) runSeq(cue.seq);
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
        box.appendChild(b); box.appendChild(el("div", "disc", esc(L.disclaimer))); dlg.appendChild(box);
      }
    }
    s.onclick = function () {   // tap anywhere on the stage (dialog included) advances lines; choice/end need their button
      if (busy) return;
      if (beatWait) { beatWait(); return; }
      if (typing) { typing(); return; }
      if (steps[n].type === "end" || steps[n].type === "choice") return;
      n++; render();
    };
    render();
  }

  title();
})();
