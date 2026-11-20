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
  function question(pos) {
    var i = SEQ[pos], q = L.questions[i];
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

  /* ---------- ending (visual novel) ---------- */
  function buildSteps() {
    var steps = [], bg = "scene-2018", t = "scene";
    L.intro.forEach(function (ln) { steps.push({ type: "line", bg: bg, kind: t, who: ln[0], text: ln[1] }); });
    /* one linear story: each decision point shows the situation, then a single button = the survey answer.
       A wrong answer plays its bad ending right there and stops; a right one gets Elon's reaction, then the next decision. */
    var ended = false;
    SEQ.forEach(function (i) {
      if (ended) return;
      var sit = L.situations[i], a = answers[i];
      steps.push({ type: "line", bg: bg, kind: t, who: sit[0], text: sit[1] });
      steps.push({ type: "choice", bg: bg, kind: t, pick: a });
      if (!a.elon) {
        L.bad[i].forEach(function (ln, k, arr) {
          steps.push({ type: "line", bg: "bad-" + (i + 1), kind: "bad", who: ln[0], text: ln[1], tag: L.badTags[i], last: k === arr.length - 1 });
        });
        ended = true;
      } else {
        steps.push({ type: "line", bg: bg, kind: t, who: L.replies[i][0], text: L.replies[i][1] });
      }
    });
    if (!ended) {
      L.matchLines.forEach(function (ln) { steps.push({ type: "line", bg: "match", kind: "match", who: ln[0], text: ln[1], tag: L.matchTag }); });
      L.trueLines.forEach(function (ln) { steps.push({ type: "line", bg: "true-ending", kind: "true", who: ln[0], text: ln[1], tag: L.trueTag }); });
    }
    steps.push({ type: "end", bg: steps[steps.length - 1].bg, kind: steps[steps.length - 1].kind });
    return steps;
  }

  function story() {
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
        var cb = el("button", "btn choice-btn", esc(st.pick.label));
        cb.setAttribute("data-opt", st.pick.elon ? "elon" : "trap");
        cb.onclick = function (e) { e.stopPropagation(); n++; render(); };
        dlg.appendChild(cb);
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
      if (steps[n].type === "end" || steps[n].type === "choice") return;
      n++; render();
    };
    render();
  }

  title();
})();
