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
    function setChar(slot, spec) {
      if (!spec) { removeChar(slot); return; }
      var cur = sprites[slot];
      if (cur && cur.id === spec.id && cur.expr === spec.expr) return;
      var frames = frameNames(spec.id, spec.expr).filter(function (f) { return have("chr", spec.id + "-" + spec.expr + "-" + f); });
      if (!frames.length) { removeChar(slot); return; }               // no art yet: nothing drawn (text placeholder only)
      var swap = !!(cur && cur.id === spec.id);
      if (cur) removeChar(slot, swap);
      var wrap = el("div", "chr " + slot), scl = el("div", "scl"), bob = el("div", "bob");
      var c = { id: spec.id, expr: spec.expr, wrap: wrap, imgs: {}, frames: frames, alive: true, cur: frames[0], special: !!(A.chars[spec.id].special && A.chars[spec.id].special[spec.expr]) };
      var loaded = 0;
      frames.forEach(function (f) {
        var im = new Image(); im.alt = ""; im.draggable = false; im.className = "sprite";
        im.onerror = function () { delete c.imgs[f]; if (im.parentNode) im.parentNode.removeChild(im); c.frames = c.frames.filter(function (x) { return x !== f; }); if (!c.frames.length) removeChar(slot, true); };
        im.src = frameSrc(spec.id, spec.expr, f);
        c.imgs[f] = im; bob.appendChild(im);
      });
      scl.appendChild(bob); wrap.appendChild(scl);
      c.scl = scl;
      wrap.style.animationDelay = "0s"; bob.style.animationDelay = (-Math.random() * 2.4).toFixed(2) + "s";
      var anim = swap ? "hop" : (spec.anim || (slot === "L" ? "slide-l" : slot === "R" ? "slide-r" : "fade"));
      wrap.classList.add("in-" + anim);
      chL.appendChild(wrap);
      sprites[slot] = c; layout(); showFrame(c, c.frames[0]);
      if (c.special) breathe(c); else blink(c);
    }
    function blink(c) {   // b frame for 110 ms every 2.5-5 s
      if (c.frames.indexOf("b") < 0) return;
      (function loop() {
        timers.push(setTimeout(function () {
          if (!c.alive) return;
          if (!(c.talkOn && c.cur === "c")) { showFrame(c, "b"); timers.push(setTimeout(function () { if (c.alive) showFrame(c, "a"); loop(); }, 110)); }
          else loop();
        }, 2500 + Math.random() * 2500));
      })();
    }
    function breathe(c) {   // numeric frames alternate
      if (c.frames.length < 2) return;
      var i = 0;
      (function loop() { timers.push(setTimeout(function () { if (!c.alive) return; i = (i + 1) % c.frames.length; showFrame(c, c.frames[i]); loop(); }, 1200)); })();
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
      Object.keys(sprites).forEach(function (k) {
        var c = sprites[k]; if (!c) return;
        var me = !dimAll && isChar && c.id === who, other = !dimAll && isChar && !me;
        c.wrap.style.filter = dimAll ? "brightness(.6)" : (other ? "brightness(.75)" : "");
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
        ovL.appendChild(el("div", "ovl in-" + (o.anim || "fade"), esc(txt)));
      });
      if (cue.bgfx) {
        if (cue.bgfx.dark != null) { bgfx.style.opacity = cue.bgfx.dark; }
        if (cue.bgfx.grayscale != null) bgL.style.filter = "grayscale(" + cue.bgfx.grayscale + ")";
      }
      (cue.stage || []).forEach(function (e) {
        if (e === "shake") { s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake"); }
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
    function render() {
      var st = steps[n];
      setBg(st.bg, st.kind, null);
      apply(A.cues && A.cues[st.key]);
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
      if (typing) { typing(); return; }
      if (steps[n].type === "end" || steps[n].type === "choice") return;
      n++; render();
    };
    render();
  }

  title();
})();
