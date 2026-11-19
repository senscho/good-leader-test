(function () {
  "use strict";
  var app = document.getElementById("app");
  var L = null, lang = null;
  var answers = [];       // {idx, elon, label}
  var order = [];         // per-question option order
  var timers = [];

  function clear() { timers.forEach(clearTimeout); timers = []; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function show(node) { clear(); app.innerHTML = ""; app.appendChild(node); }

  /* ---------- title ---------- */
  function title() {
    clear(); answers = []; L = null;
    document.documentElement.lang = "ko";
    var s = el("section", "screen center");
    s.innerHTML = '<h1>Billionaire<br>Aptitude Test</h1>';
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
  function question(i) {
    var q = L.questions[i];
    var s = el("section", "screen");
    var p = el("div", "progress");
    for (var k = 0; k < 4; k++) p.appendChild(el("i", k <= i ? "on" : ""));
    s.appendChild(p);
    var w = el("div", "qwrap");
    w.appendChild(el("div", "qnum", L.qLabel + " " + (i + 1) + " / 4"));
    w.appendChild(el("h2", "qtext", esc(q.q)));
    var st = el("div", "stack");
    order[i].forEach(function (oi) {
      var b = el("button", "btn", esc(q.opts[oi]));
      b.setAttribute("data-opt", oi === 1 ? "elon" : "trap");
      b.onclick = function () {
        answers.push({ idx: i, elon: oi === 1, label: q.opts[oi], short: q.short[oi] });
        if (i < 3) question(i + 1); else result();
      };
      st.appendChild(b);
    });
    w.appendChild(st); s.appendChild(w);
    show(s);
  }

  /* ---------- result ---------- */
  function allElon() { return answers.every(function (a) { return a.elon; }); }
  function result() {
    var R = L.result, s = el("section", "screen center");
    if (allElon()) {
      s.innerHTML = '<div class="result-big match">' + esc(R.matchTitle) + '</div><div class="dim">' + esc(R.matchSub) + '</div>';
      var b = el("button", "btn primary", esc(R.see)); b.onclick = ending;
      var st = el("div", "stack"); st.appendChild(b); s.appendChild(st);
      show(s);
    } else {
      s.innerHTML = '<div class="scan"></div><div class="dim">' + esc(R.scanning) + '</div>';
      show(s);
      timers.push(setTimeout(function () {
        s.innerHTML = '<div class="result-big no">' + esc(R.noTitle) + '</div><div class="dim">' + esc(R.noSub) + '</div>';
        timers.push(setTimeout(ending, 2600));
      }, 1400));
    }
  }

  /* ---------- ending (visual novel) ---------- */
  function buildSteps() {
    var steps = [], bg = "scene-2018", t = "scene";
    L.intro.forEach(function (ln) { steps.push({ type: "line", bg: bg, kind: t, who: ln[0], text: ln[1] }); });
    var wrong = -1;
    answers.forEach(function (a, i) { if (!a.elon && wrong < 0) wrong = i; });
    if (wrong >= 0) {
      var sit = L.situations[wrong];
      steps.push({ type: "line", bg: bg, kind: t, who: sit[0], text: sit[1] });
      steps.push({ type: "choice", bg: bg, kind: t, picks: [answers[wrong]] });
      L.bad[wrong].forEach(function (ln, k, arr) {
        steps.push({ type: "line", bg: "bad-" + (wrong + 1), kind: "bad", who: ln[0], text: ln[1], tag: L.badTags[wrong], last: k === arr.length - 1 });
      });
    } else {
      steps.push({ type: "choice", bg: bg, kind: t, picks: answers });
      L.matchLines.forEach(function (ln) { steps.push({ type: "line", bg: "match", kind: "match", who: ln[0], text: ln[1], tag: L.matchTag }); });
      L.trueLines.forEach(function (ln) { steps.push({ type: "line", bg: "true-ending", kind: "true", who: ln[0], text: ln[1], tag: L.trueTag }); });
    }
    steps.push({ type: "end", bg: steps[steps.length - 1].bg, kind: steps[steps.length - 1].kind });
    return steps;
  }

  function ending() {
    var steps = buildSteps(), n = 0, curBg = null, typing = null;
    var s = el("section", "screen vn");
    var stage = el("div", "stage"), dlg = el("div", "dlg");
    s.appendChild(stage); s.appendChild(dlg);
    show(s);

    function setBg(id, kind) {
      if (curBg === id) return; curBg = id;
      stage.innerHTML = "";
      var ph = el("div", "ph " + (kind === "bad" ? "bad" : kind === "true" ? "true" : kind === "match" ? "match" : ""));
      ph.setAttribute("data-slot", id);
      ph.innerHTML = '<span class="slot">slot: ' + id + '</span><div class="desc">' + esc(L.placeholders[id]) + '</div>';
      stage.appendChild(ph);
    }
    function typeText(node, text, done) {
      var i = 0; node.textContent = "";
      var iv = setInterval(function () {
        i++; node.textContent = text.slice(0, i);
        if (i >= text.length) { finish(); }
      }, 22);
      function finish() { clearInterval(iv); node.textContent = text; typing = null; done && done(); }
      typing = finish;
    }
    function render() {
      var st = steps[n];
      setBg(st.bg, st.kind);
      dlg.innerHTML = "";
      if (st.type === "line") {
        dlg.appendChild(el("div", "name " + st.who, esc(L.speakers[st.who])));
        var t = el("div", "txt"); dlg.appendChild(t);
        var nx = el("span", "next", L.tapHint); nx.style.visibility = "hidden"; dlg.appendChild(nx);
        typeText(t, st.text, function () { nx.style.visibility = "visible"; });
        if (st.tag && st.last) { /* tag shown on ending screen */ }
      } else if (st.type === "choice") {
        dlg.appendChild(el("div", "choice-title", esc(L.choiceTitle)));
        st.picks.forEach(function (a) {
          dlg.appendChild(el("div", "chip", "<small>" + esc(L.choiceNote) + "</small>" + esc(a.label)));
        });
        dlg.appendChild(el("span", "next", L.tapHint));
      } else {
        var last = steps[n - 1];
        var box = el("div", "end-box");
        box.appendChild(el("div", "tag" + (last.kind === "bad" ? "" : " ok"), esc(last.tag || "")));
        var b = el("button", "btn primary", esc(L.replay));
        b.onclick = function (e) { e.stopPropagation(); title(); };
        box.appendChild(b); dlg.appendChild(box);
      }
    }
    dlg.onclick = stage.onclick = function () {
      if (typing) { typing(); return; }
      if (steps[n].type === "end") return;
      n++; render();
    };
    render();
  }

  title();
})();
