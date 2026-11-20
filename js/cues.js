/* Stage manifest + per-line cues (art-plan-v1.md sections 5, 9).
   Art is authored at 1080x2340; sprites are 900x1700 transparent webp, bottom-anchored.
   `have` lists the art files that actually exist. Anything not listed is never requested and falls back to the text placeholder
   (backgrounds) or is simply not drawn (sprites/props/fx). When Mika delivers a new file: add its name to `have`. */
window.ART = {
  have: {
    bg:  ["meeting-room", "factory-night", "automation-line", "parking-dusk", "tent-line"],   // art/bg/bg-<id>.webp
    chr: [   // art/chr/<char>-<expr>-<frame>.webp  (a = base, b = blink, c = talk)
      "board-annoyed-a", "board-annoyed-b", "board-annoyed-c", "board-baffled-a",
      "board-baffled-b", "board-baffled-c", "board-stern-a", "board-stern-b",
      "board-stern-c", "consultant-dismissive-a", "consultant-dismissive-b", "consultant-dismissive-c",
      "consultant-smug-a", "consultant-smug-b", "consultant-smug-c", "elon-carry-sink-a",
      "elon-carry-sink-b", "elon-carry-sink-c", "elon-firm-a", "elon-firm-b",
      "elon-firm-c", "elon-neutral-a", "elon-neutral-b", "elon-neutral-c",
      "elon-regret-a", "elon-regret-b", "elon-regret-c", "elon-sleep-1",
      "elon-sleep-2", "elon-smile-a", "elon-smile-b", "elon-smile-c",
      "elon-surprised-a", "elon-surprised-b", "elon-surprised-c", "engineer-cheer-a",
      "engineer-cheer-b", "engineer-cheer-c", "engineer-neutral-a", "engineer-neutral-b",
      "engineer-neutral-c", "engineer-puzzled-a", "engineer-puzzled-b", "engineer-puzzled-c",
      "engineer-shocked-a", "engineer-shocked-b", "engineer-shocked-c", "engineer-worried-a",
      "engineer-worried-b", "engineer-worried-c"
    ],
    prop: [],                              // art/prop/prop-<name>[-<n>].webp
    fx: []                                 // art/fx/fx-<name>.webp
  },
  warmBg: ["parking-dusk", "tent-line"],                           // sunset scenes: sprites get this filter (composed with speaker dimming)
  warmFilter: "sepia(.15) saturate(1.1) brightness(1.05)",
  stage: { w: 1080, h: 2340, spriteW: 900, spriteH: 1700 },
  slots: ["L", "C", "R"],                                       // logical order, kept whatever the count
  layouts: { 1: [540], 2: [360, 720], 3: [250, 540, 830] },       // sprite centre x (of 1080) by number of sprites on stage; edges may crop up to 90px
  chars: {   // exprs and frame letters: a = base, b = blink (eyes closed), c = talk (mouth open); special poses use numeric frames
    elon:       { exprs: ["neutral", "firm", "regret", "surprised", "smile"], frames: ["a", "b", "c"],
                  special: { sleep: ["1", "2"], "carry-sink": ["a", "b", "c"] },   // special poses: no blink/talk; frames chosen by cues
                  breathing: ["sleep"], canvas: { sleep: [1600, 900] } },            // sleep: 2-frame breathing loop on a 1600x900 landscape canvas, bottom-aligned
    engineer:   { exprs: ["neutral", "worried", "puzzled", "shocked", "cheer"], frames: ["a", "b", "c"] },
    board:      { exprs: ["stern", "annoyed", "baffled"], frames: ["a", "b", "c"] },
    consultant: { exprs: ["smug", "dismissive"], frames: ["a", "b", "c"] }
  },
  props: {   // x/y = % of stage, w = % of stage width, layer = back|front  (add entries when prop art exists)
  },
  /* keys: intro.N  sit.I  choice.I  reply.I  bad.I.N  match.N  true.N  end   (I = question index, N = line index)
     cue fields: chars {L|C|R: {id, expr, anim} | null}, add/remove [{id, anim, delay, x, y, w, flip}], stage ["shake","dim-chars"],
     bgfx {dark, grayscale}, overlay [{id, text, anim}], counter {id, from, to, ms}.  A background change clears props/fx/overlay and sprites. */
  cues: {
    /* Logical slots: Elon C, engineer L, board / consultant R (plus Elon R in the match ending); the real x comes from `layouts` by sprite count.
       Speaker: front, full size, bright, talking (a<->c every 130 ms while the line types); the others stay full size, dimmed, behind. Blink: b for 110 ms every 3-5 s.
       A background change clears every sprite, so each scene re-adds who is in it. Expressions follow art-plan-v1.md section 3 (s12 gives the frame sets). */

    /* ---- trust / meeting-room (intro + decision 1) ---- */
    "intro.0": { chars: { C: { id: "elon", expr: "neutral", anim: "fade" } } },
    "intro.1": { chars: { L: { id: "engineer", expr: "worried" } } },
    "intro.2": { chars: { R: { id: "board", expr: "stern" } } },
    "sit.1":   { chars: { L: { id: "engineer", expr: "puzzled" }, R: null } },
    "reply.1": { chars: { C: { id: "elon", expr: "firm" } } },

    /* ---- work-life / factory-night (decision 2) ---- */
    "sit.0":   { chars: { L: { id: "engineer", expr: "neutral" } } },
    "reply.0": { chars: { C: { id: "elon", expr: "firm" } } },

    /* ---- automation / automation-line (decision 3): starts with a 700 ms cut of Elon asleep (landscape sleep-1/2 breathing) on the factory-night bg ---- */
    "sit.2":   { beat: { bg: "factory-night", ms: 700, chars: { C: { id: "elon", expr: "sleep", anim: "fade" } } },
                 chars: { L: { id: "engineer", expr: "worried" } } },
    "reply.2": { chars: { C: { id: "elon", expr: "regret" } } },

    /* ---- regulations / parking-dusk (decision 4) ---- */
    "sit.3":   { chars: { L: { id: "engineer", expr: "worried" } } },
    "reply.3": { chars: { C: { id: "elon", expr: "firm" } } },

    /* ---- bad ending 1 (trust) - bad-dark-factory ---- */
    "bad.1.1": { chars: { R: { id: "board", expr: "annoyed" } } },
    "bad.1.2": { chars: { L: { id: "engineer", expr: "worried" } } },
    "bad.1.5": { chars: { L: { id: "engineer", expr: "puzzled" } } },
    "bad.1.6": { chars: { L: null, R: null } },

    /* ---- bad ending 2 (work-life) - bad-lobby: consultant smug/dismissive/smug on R, engineer puzzled L, board stern replaces him on L ---- */
    "bad.0.1": { chars: { R: { id: "consultant", expr: "smug" } } },
    "bad.0.2": { chars: { L: { id: "engineer", expr: "puzzled" } } },
    "bad.0.3": { chars: { R: { id: "consultant", expr: "dismissive" } } },
    "bad.0.5": { chars: { L: { id: "board", expr: "stern" } } },
    "bad.0.6": { chars: { R: { id: "consultant", expr: "smug" } } },

    /* ---- bad ending 3 (automation) - bad-robot-museum ---- */
    "bad.2.1": { chars: { L: { id: "engineer", expr: "neutral" } } },
    "bad.2.2": { chars: { R: { id: "board", expr: "baffled" } } },

    /* ---- bad ending 4 (regulations) - bad-opening ---- */
    "bad.3.1": { chars: { L: { id: "engineer", expr: "worried" } } },
    "bad.3.2": { chars: { R: { id: "board", expr: "stern" } } },
    "bad.3.5": { chars: { L: { id: "engineer", expr: "shocked" } } },
    "bad.3.6": { chars: { L: null } },

    /* ---- success: tent-line, then true-sky ---- */
    "match.2": { chars: { L: { id: "engineer", expr: "cheer" }, R: { id: "elon", expr: "smile", anim: "fade" } } },
    /* true.2 (buys Twitter): Elon walks in carrying the sink (carry-sink a), sets it down with a thud (b: shake + dust + THUD chip),
       smirks (c), walks off, then an SVG X glyph pops in. CSS-only fx (no sink/bird prop art yet). */
    "true.2": { seq: [
      { t: 0,    chars: { C: { id: "elon", expr: "carry-sink", frame: "a", anim: "slide-r" } } },
      { t: 700,  chars: { C: { id: "elon", expr: "carry-sink", frame: "b" } }, stage: ["shake"],
                 fx: [{ id: "dust-puff", x: 38 }, { id: "dust-puff", x: 62, flip: true }], overlay: [{ id: "thud", text: "thud", anim: "pop", y: 52, ms: 900 }] },
      { t: 1000, chars: { C: { id: "elon", expr: "carry-sink", frame: "c" } } },
      { t: 1350, chars: { C: null } },
      { t: 1750, glyph: "x" }
    ] },
    "true.5": { chars: { C: { id: "elon", expr: "surprised" } } },
    "true.6": { chars: { C: { id: "elon", expr: "smile" } } }
  }
};
