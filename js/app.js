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
    /* per-question option order (shuffled so the trap is not always on top) */
    order = L.questions.map(function () { return Math.random() < 0.5 ? [0, 1] : [1, 0]; });
    document.documentElement.lang = l;
    story();
  }

  /* ---------- story (visual novel, choices inline) ---------- */
  var BG = "scene-2018";
  function line(bg, kind, ln, extra) {
    var o = { type: "line", bg: bg, kind: kind, who: ln[0], text: ln[1] };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }

  function story() {
    var steps = [], n = 0, curBg = null, typing = null;
    L.intro.forEach(function (ln) { steps.push(line(BG, "scene", ln)); });
    L.questions.forEach(function (q, i) {
      steps.push(line(BG, "scene", L.situations[i]));
      steps.push({ type: "choice", bg: BG, kind: "scene", q: i, ctx: L.situations[i][1] });
    });

    var s = el("section", "screen vn");
    var stage = el("div", "stage"), dlg = el("div", "dlg");
    s.appendChild(stage); s.appendChild(dlg);
    show(s);

    /* the player picked an option: extend the story for that path */
    function pick(i, oi) {
      var q = L.questions[i], elon = oi === 1;
      answers.push({ idx: i, elon: elon, label: q.opts[oi] });
      var add = [];
      if (!elon) {
        steps.length = n + 1;   /* drop the rest of the quiz path */
        add.push({ type: "result", match: false, bg: BG, kind: "scene" });
        L.bad[i].forEach(function (ln, k, arr) {
          add.push(line("bad-" + (i + 1), "bad", ln, { tag: L.badTags[i], last: k === arr.length - 1 }));
        });
        add.push({ type: "end" });
      } else {
        add.push(line(BG, "scene", L.replies[i]));
        if (i === L.questions.length - 1) {
          add.push({ type: "result", match: true, bg: BG, kind: "scene" });
          L.matchOpen.concat(L.matchLines).forEach(function (ln) { add.push(line("match", "match", ln, { tag: L.matchTag })); });
          L.trueLines.forEach(function (ln) { add.push(line("true-ending", "true", ln, { tag: L.trueTag })); });
          add.push({ type: "end" });
        }
      }
      Array.prototype.splice.apply(steps, [n + 1, 0].concat(add));
      advance();
    }

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
    function advance() { n++; render(); }

    /* full-screen "match / no match" beat shown between the last choice and the ending */
    function resultOverlay(st) {
      var R = L.result, o = el("section", "screen center overlay");
      s.appendChild(o);
      if (st.match) {
        o.innerHTML = '<div class="result-big match">' + esc(R.matchTitle) + '</div><div class="dim">' + esc(R.matchSub) + '</div>';
        var b = el("button", "btn primary", esc(R.see));
        b.onclick = function () { advance(); };
        var bs = el("div", "stack"); bs.appendChild(b); o.appendChild(bs);
      } else {
        o.innerHTML = '<div class="scan"></div><div class="dim">' + esc(R.scanning) + '</div>';
        timers.push(setTimeout(function () {
          o.innerHTML = '<div class="result-big no">' + esc(R.noTitle) + '</div><div class="dim">' + esc(R.noSub) + '</div>';
          timers.push(setTimeout(advance, 2600));
        }, 1400));
      }
    }

    function render() {
      var old = s.querySelector(".overlay"); if (old) old.remove();
      var st = steps[n];
      if (st.type === "end") {
        var last = steps[n - 1];
        dlg.innerHTML = "";
        var box = el("div", "end-box");
        box.appendChild(el("div", "tag" + (last.kind === "bad" ? "" : " ok"), esc(last.tag || "")));
        var rb = el("button", "btn primary", esc(L.replay));
        rb.onclick = function (e) { e.stopPropagation(); title(); };
        box.appendChild(rb); dlg.appendChild(box);
        return;
      }
      if (st.type === "result") { dlg.innerHTML = ""; resultOverlay(st); return; }
      setBg(st.bg, st.kind);
      dlg.innerHTML = "";
      dlg.classList.toggle("choosing", st.type === "choice");
      if (st.type === "line") {
        dlg.appendChild(el("div", "name " + st.who, esc(L.speakers[st.who])));
        var t = el("div", "txt"); dlg.appendChild(t);
        var nx = el("span", "next", L.tapHint); nx.style.visibility = "hidden"; dlg.appendChild(nx);
        typeText(t, st.text, function () { nx.style.visibility = "visible"; });
      } else if (st.type === "choice") {
        var q = L.questions[st.q];
        dlg.appendChild(el("div", "choice-title", esc(L.choiceTitle)));
        var stack = el("div", "stack");
        order[st.q].forEach(function (oi) {
          var b = el("button", "btn", esc(q.opts[oi]));
          b.setAttribute("data-opt", oi === 1 ? "elon" : "trap");
          b.onclick = function (e) { e.stopPropagation(); pick(st.q, oi); };
          stack.appendChild(b);
        });
        dlg.appendChild(stack);
      }
    }
    /* tapping advances lines only; choices and the end screen need a button */
    dlg.onclick = stage.onclick = function () {
      var st = steps[n];
      if (typing) { typing(); return; }
      if (st.type !== "line") return;
      advance();
    };
    render();
  }

  title();
})();
