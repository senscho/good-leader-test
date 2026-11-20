/* Stage manifest + per-line cues (art-plan-v1.md sections 5, 9).
   Art is authored at 1080x2340; sprites are 900x1700 transparent webp, bottom-anchored.
   `have` lists the art files that actually exist. Anything not listed is never requested and falls back to the text placeholder
   (backgrounds) or is simply not drawn (sprites/props/fx). When Mika delivers a new file: add its name to `have`. */
window.ART = {
  have: {
    bg:  ["meeting-room", "factory-night", "automation-line", "parking-dusk", "tent-line", "true-sky", "title", "bad-lobby", "bad-dark-factory", "bad-robot-museum", "bad-opening"],   // art/bg/bg-<id>.webp
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
      "engineer-worried-b", "engineer-worried-c",
      "crowd-cheer-1", "crowd-cheer-2", "workers-line", "visitors"   // crowds / props drawn as props (kind chr)
    ],
    prop: ["rocket", "sink", "bird", "car", "chart-up", "ai-orb", "cursor-arrow", "tent", "order-boxes", "hourglass", "slide-allgreen", "wall-clock", "home-bubble", "sleeping-bag", "robot-arm", "permit-stack", "mug-star", "chart-down", "calendar-stack", "minutes-pile", "report-stack-1", "report-stack-2", "report-stack-3", "refund-envelopes", "invoice", "shutter", "ticket", "velvet-rope", "stamp", "cobweb", "notice-paper", "q-trust", "q-worklife", "q-giveup", "q-protocol"],   // art/prop/prop-<name>.webp
    fx: ["smoke-trail", "dust-puff", "sparkle", "sweat"],                                             // art/fx/fx-<name>.webp
    logo: ["x", "spacex", "xai", "tesla"]                                                    // art/logo/logo-<name>.svg (official marks, bundled locally)
  },
  /* per-background sprite filter (composed with the speaker dimming): sunset scenes get a warm tint, bright bad-ending scenes get brightness/saturate matching */
  bgFilter: {
    "parking-dusk": "sepia(.15) saturate(1.1) brightness(1.05)", "tent-line": "sepia(.15) saturate(1.1) brightness(1.05)", "true-sky": "sepia(.15) saturate(1.1) brightness(1.05)",
    "bad-lobby": "brightness(1.15) saturate(.9)", "bad-opening": "brightness(1.2) saturate(.95)"
  },
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
  /* props: kind prop|logo|chr|fx, x/y = centre in % of the stage, w = width in % of the stage width, layer back (behind sprites) | front. Only art listed in `have` is ever requested. */
  props: {
    "rocket": { name: "rocket", x: 87, y: 52, w: 12, layer: "front" },
    "car": { name: "car", x: 27, y: 60, w: 40, layer: "back" },
    "chart-up": { name: "chart-up", x: 50, y: 36, w: 54, layer: "back" },
    "sink": { name: "sink", x: 50, y: 62, w: 20, layer: "back" },
    "bird": { name: "bird", x: 82, y: 38, w: 12, layer: "back" },
    "ai-orb": { name: "ai-orb", x: 66, y: 20, w: 18, layer: "back" },
    "cursor": { name: "cursor-arrow", x: 66, y: 22, w: 6, layer: "front" },
    "tent": { name: "tent", x: 74, y: 58, w: 50, layer: "back" },
    "order-boxes": { name: "order-boxes", x: 84, y: 58, w: 14, layer: "back" },
    "hourglass": { name: "hourglass", x: 64, y: 20, w: 12, layer: "back" },
    "slide-allgreen": { name: "slide-allgreen", x: 50, y: 17, w: 50, layer: "back" },
    "wall-clock": { name: "wall-clock", x: 84, y: 16, w: 18, layer: "back" },
    "home-bubble": { name: "home-bubble", x: 20, y: 18, w: 26, layer: "back" },
    "sleeping-bag": { name: "sleeping-bag", x: 76, y: 66, w: 38, layer: "back" },
    "robot-arm": { name: "robot-arm", x: 80, y: 52, w: 24, layer: "front" },
    "workers-line": { kind: "chr", name: "workers-line", x: 50, y: 58, w: 96, layer: "back" },
    "permit-stack": { name: "permit-stack", x: 22, y: 56, w: 26, layer: "back" },
    "mug-star": { name: "mug-star", x: 50, y: 60, w: 22, layer: "back" },
    "chart-down": { name: "chart-down", x: 24, y: 18, w: 34, layer: "back" },
    "calendar-stack": { name: "calendar-stack", x: 50, y: 50, w: 26, layer: "back" },
    "minutes-pile": { name: "minutes-pile", x: 50, y: 52, w: 56, layer: "back" },
    "report-stack-1": { name: "report-stack-1", x: 50, y: 57.5, w: 22, layer: "back" },   // 1-3 share a bottom-aligned canvas: same x/y/w stack up in place
    "report-stack-2": { name: "report-stack-2", x: 50, y: 57.5, w: 22, layer: "back" },
    "report-stack-3": { name: "report-stack-3", x: 50, y: 57.5, w: 22, layer: "back" },
    "refund-envelopes": { name: "refund-envelopes", x: 50, y: 30, w: 50, layer: "back" },
    "invoice": { name: "invoice", x: 74, y: 50, w: 26, layer: "front" },
    "shutter": { name: "shutter", x: 50, y: 33, w: 100, h: 66, layer: "back" },          // covers the top two thirds of the stage
    "visitors": { kind: "chr", name: "visitors", x: 50, y: 56, w: 96, layer: "back" },
    "ticket": { name: "ticket", x: 74, y: 22, w: 26, layer: "back" },
    "velvet-rope": { name: "velvet-rope", x: 50, y: 52, w: 90, layer: "front" },
    "stamp": { name: "stamp", x: 24, y: 44, w: 28, layer: "back" },
    "cobweb": { name: "cobweb", x: 24, y: 50, w: 30, layer: "back" },
    "notice-paper": { name: "notice-paper", x: 50, y: 44, w: 22, layer: "back" },
    "crowd-cheer": { kind: "chr", name: "crowd-cheer-1", alt: "crowd-cheer-2", altMs: 320, x: 50, y: 62, w: 100, layer: "back" },
    "logo-tesla": { kind: "logo", name: "tesla", x: 16, y: 11, w: 12, layer: "back", cls: "glow" },
    "logo-x": { kind: "logo", name: "x", x: 82, y: 38, w: 16, layer: "back", cls: "white glow" },
    "logo-xai": { kind: "logo", name: "xai", x: 66, y: 20, w: 22, layer: "front", cls: "white" },
    "logo-spacex": { kind: "logo", name: "spacex", x: 78, y: 64, w: 40, layer: "back", cls: "white" }
  },
  /* keys: intro.N  sit.I  choice.I  reply.I  bad.I.N  match.N  true.N  end   (I = question index, N = line index)
     cue fields: chars {L|C|R: {id, expr, anim} | null}, add [{id, anim, delay, x, y, w, h, flip, rot, key, op, loop, fly:{x,y,s,ms}}], remove [{id, key, anim}], mod [{id, key, rot, scale, x, y, loop}],
     fx [{id: dust-puff|sparkle|sweat|ring|alarm|confetti|confetti-gray|qmark, x, y, at}], overlay [{id, text, n, anim, x, y, ms, count}], bgfx {dark, grayscale, sat},
     zoom {s, ox, oy}, propDim, launch {from, to, ms}, lines {from, to[]}, stage ["shake"], beat {bg, ms, chars}, seq [{t, ...any of the above}].  A background change clears props/fx/overlay and sprites. */
  cues: {
    /* Logical slots: Elon C, engineer L, board / consultant R (plus Elon R in the match ending); the real x comes from `layouts` by sprite count.
       Speaker: front, full size, bright, talking (a<->c every 130 ms while the line types); the others stay full size, dimmed, behind. Blink: b for 110 ms every 3-5 s.
       A background change clears every sprite, so each scene re-adds who is in it. Expressions follow art-plan-v1.md section 3 (s12 gives the frame sets). */

    /* ---- trust / meeting-room (intro + decision 1) ---- */
    "intro.0": { chars: { C: { id: "elon", expr: "neutral", anim: "fade" } }, overlay: [{ id: "date", text: "date", anim: "slide-l", x: 28, y: 5 }] },
    "intro.1": { chars: { L: { id: "engineer", expr: "worried" } }, add: [{ id: "order-boxes", anim: "drop" }] },
    "intro.2": { chars: { R: { id: "board", expr: "stern" } }, add: [{ id: "hourglass", anim: "pop", loop: "float" }] },
    "sit.1":   { chars: { L: { id: "engineer", expr: "puzzled" }, R: null }, add: [{ id: "slide-allgreen", anim: "pop" }], overlay: [{ id: "allgreen", text: "allGreen", y: 29 }] },
    "reply.1": { chars: { C: { id: "elon", expr: "firm" } }, remove: [{ id: "allgreen", anim: "exit-up" }],
                 seq: [{ t: 0, mod: [{ id: "slide-allgreen", loop: "wobble" }] }, { t: 1500, mod: [{ id: "slide-allgreen", rot: -8 }] }] },

    /* ---- work-life / factory-night (decision 2) ---- */
    "sit.0":   { chars: { L: { id: "engineer", expr: "neutral" } }, add: [{ id: "wall-clock", anim: "pop" }, { id: "home-bubble", anim: "pop", delay: 250, loop: "float" }] },
    "reply.0": { chars: { C: { id: "elon", expr: "firm" } }, remove: [{ id: "home-bubble", anim: "exit-up" }], fx: [{ id: "dust-puff", x: 20, y: 18 }], add: [{ id: "sleeping-bag", anim: "drop" }] },

    /* ---- automation / automation-line (decision 3): starts with a cut of Elon asleep (landscape sleep-1/2 breathing) on the factory-night bg, no dialog, waits for a tap ---- */
    "sit.2":   { beat: { bg: "factory-night", chars: { C: { id: "elon", expr: "sleep", anim: "fade" } } },
                 chars: { L: { id: "engineer", expr: "worried" } }, add: [{ id: "robot-arm", anim: "pop" }], fx: [{ id: "alarm", x: 62, y: 46 }], zoom: { s: 1.08, ox: 62, oy: 46 } },
    "reply.2": { chars: { C: { id: "elon", expr: "regret" } }, remove: [{ id: "robot-arm", anim: "exit-r" }, { id: "alarm" }], zoom: { s: 1, ox: 50, oy: 50 },
                 seq: [{ t: 550, add: [{ id: "workers-line", anim: "slide-l" }] }] },

    /* ---- regulations / parking-dusk (decision 4) ---- */
    "sit.3":   { chars: { L: { id: "engineer", expr: "worried" } }, add: [{ id: "permit-stack", key: "p1", anim: "drop" }], stage: ["shake"], overlay: [{ id: "days", text: "days", y: 15 }] },
    "reply.3": { chars: { C: { id: "elon", expr: "firm" } }, add: [{ id: "tent", anim: "popbig" }], fx: [{ id: "dust-puff", x: 60, y: 64 }, { id: "dust-puff", x: 88, y: 64, flip: true }],
                 remove: [{ id: "days", anim: "exit-up" }] },

    /* ---- bad ending 1 (trust) - bad-dark-factory ---- */
    "bad.1.0": { add: [{ id: "mug-star", anim: "pop" }], fx: [{ id: "sparkle", x: 58, y: 56 }], bgfx: { sat: .7 } },
    "bad.1.1": { chars: { R: { id: "board", expr: "annoyed" } }, overlay: [{ id: "meet", text: "meeting", n: 1, y: 10 }] },
    "bad.1.2": { chars: { L: { id: "engineer", expr: "worried" } }, fx: [{ id: "sweat", at: "L", dx: 9 }], overlay: [{ id: "meet", text: "meeting", n: 2 }] },
    "bad.1.3": { add: [{ id: "chart-down", anim: "wipe" }], bgfx: { dark: .2 } },
    "bad.1.4": { add: [{ id: "calendar-stack", key: "c1", anim: "pop", rot: -12, x: 34, y: 52, w: 26 }, { id: "calendar-stack", key: "c2", anim: "pop", delay: 150, x: 50, y: 50, w: 26 },
                       { id: "calendar-stack", key: "c3", anim: "pop", delay: 300, rot: 12, x: 66, y: 52, w: 26 }], overlay: [{ id: "meet", text: "meeting", n: 3 }] },
    "bad.1.5": { chars: { L: { id: "engineer", expr: "puzzled" } },
                 seq: [{ t: 0, bgfx: { dark: .02 } }, { t: 180, bgfx: { dark: .3 } }, { t: 360, bgfx: { dark: .02 } }, { t: 540, bgfx: { dark: .45 } }] },
    "bad.1.6": { chars: { L: null, R: null }, bgfx: { dark: .75 },
                 seq: [{ t: 0, overlay: [{ id: "meet", text: "meeting", n: 47 }] }, { t: 500, overlay: [{ id: "meet", text: "meeting", n: 48 }] },
                       { t: 1000, overlay: [{ id: "meet", text: "meeting", n: 49 }] }, { t: 1500, overlay: [{ id: "meet", text: "meeting", n: "∞" }] }] },
    "bad.1.7": { add: [{ id: "minutes-pile", anim: "drop" }], stage: ["shake"], bgfx: { grayscale: 1 } },

    /* ---- bad ending 2 (work-life) - bad-lobby: consultant smug/dismissive/smug on R, engineer puzzled L, board stern replaces him on L ---- */
    "bad.0.0": { add: [{ id: "home-bubble", anim: "pop" }], fx: [{ id: "sparkle", x: 36, y: 18 }] },
    "bad.0.1": { chars: { R: { id: "consultant", expr: "smug" } }, add: [{ id: "slide-allgreen", anim: "pop" }], overlay: [{ id: "autook", text: "autoOk", y: 29 }] },
    "bad.0.2": { chars: { L: { id: "engineer", expr: "puzzled" } }, fx: [{ id: "qmark", at: "L", dx: 0, y: 30 }] },
    "bad.0.3": { chars: { R: { id: "consultant", expr: "dismissive" } }, add: [{ id: "report-stack-1", anim: "drop" }] },
    "bad.0.4": { add: [{ id: "chart-down", anim: "wipe", x: 20, y: 18, w: 34 }], seq: [{ t: 0, add: [{ id: "report-stack-2", anim: "fade" }] }, { t: 400, add: [{ id: "report-stack-3", anim: "fade" }] }] },
    "bad.0.5": { chars: { L: { id: "board", expr: "stern" } }, add: [{ id: "refund-envelopes", anim: "fall" }] },
    "bad.0.6": { chars: { R: { id: "consultant", expr: "smug" } }, add: [{ id: "invoice", anim: "slide-r" }], fx: [{ id: "sparkle", x: 50, y: 36 }] },
    "bad.0.7": { chars: { L: null, R: null }, add: [{ id: "shutter", anim: "drop" }], stage: ["shake"], bgfx: { grayscale: 1 } },

    /* ---- bad ending 3 (automation) - bad-robot-museum ---- */
    "bad.2.0": { add: [{ id: "robot-arm", anim: "pop", loop: "spin", x: 30, y: 50, w: 26 }], fx: [{ id: "sparkle", x: 30, y: 40 }] },
    "bad.2.1": { chars: { L: { id: "engineer", expr: "neutral" } }, add: [{ id: "car", anim: "fade", op: .2, cls: "dotted", x: 68, y: 62, w: 40 }] },
    "bad.2.2": { chars: { R: { id: "board", expr: "baffled" } }, fx: [{ id: "qmark", key: "qm1", at: "R", dx: -4, y: 30 }, { id: "qmark", key: "qm2", at: "R", dx: 6, y: 25 }] },
    "bad.2.3": { add: [{ id: "robot-arm", key: "r2", anim: "slide-r", flip: true, loop: "wobble", x: 74, y: 50, w: 26 }], fx: [{ id: "sparkle", x: 52, y: 44 }] },
    "bad.2.4": { chars: { L: null, R: null }, mod: [{ id: "robot-arm", loop: "spin2" }] },
    "bad.2.5": { add: [{ id: "visitors", anim: "slide-l" }, { id: "ticket", anim: "pop" }], zoom: { s: 1.04, ox: 50, oy: 50 } },
    "bad.2.6": { add: [{ id: "velvet-rope", anim: "drop" }], overlay: [{ id: "museum", text: "museum", y: 9, big: false }], zoom: { s: 1, ox: 50, oy: 50 } },

    /* ---- bad ending 4 (regulations): parking-dusk (lines 0-3), then bad-opening ---- */
    "bad.3.0": { add: [{ id: "stamp", anim: "pop" }], stage: ["shake"], bgfx: { sat: .7 } },
    "bad.3.1": { chars: { L: { id: "engineer", expr: "worried" } }, add: [{ id: "permit-stack", key: "p2", anim: "drop", x: 40, y: 58 }], overlay: [{ id: "days", text: "daysPlus" }] },
    "bad.3.2": { chars: { R: { id: "board", expr: "stern" } }, add: [{ id: "hourglass", key: "hg", anim: "pop", x: 78, y: 52, w: 18 }] },
    "bad.3.3": { chars: { L: null, R: null }, add: [{ id: "cobweb", anim: "fade" }], mod: [{ id: "hourglass", key: "hg", rot: 180 }],
                 seq: [{ t: 0, bgfx: { dark: .5 } }, { t: 450, bgfx: { dark: 0 } }, { t: 900, bgfx: { dark: .5 } }, { t: 1350, bgfx: { dark: 0 } }, { t: 1800, bgfx: { dark: .5 } }, { t: 2250, bgfx: { dark: 0 } }] },
    "bad.3.4": { fx: [{ id: "confetti" }] },
    "bad.3.5": { chars: { L: { id: "engineer", expr: "shocked" } }, add: [{ id: "notice-paper", anim: "pop", loop: "wobble" }], zoom: { s: 1.1, ox: 50, oy: 55 } },
    "bad.3.6": { chars: { L: null }, mod: [{ id: "notice-paper", scale: 2.2, x: 50, y: 40 }], fx: [{ id: "confetti-gray" }], bgfx: { grayscale: 1 }, stage: ["shake"] },

    /* ---- success: tent-line, then true-sky ---- */
    "match.0": { add: [{ id: "workers-line", anim: "slide-l" }] },
    "match.1": { add: [{ id: "car", anim: "fade", x: 50, y: 52, w: 44, fly: { x: 64, y: 44, s: .5, op: 0, ms: 900 } }], overlay: [{ id: "count", text: "perWeek", n: 0, y: 12, count: { from: 0, to: 5000, ms: 1400 } }] },
    "match.2": { chars: { L: { id: "engineer", expr: "cheer" }, R: { id: "elon", expr: "smile", anim: "fade" } }, remove: [{ id: "workers-line", anim: "exit-r" }, { id: "count", anim: "exit-up" }],
                 add: [{ id: "crowd-cheer", anim: "slide-r" }], fx: [{ id: "confetti" }] },

    /* true-sky: the skyline builds up line by line. Tesla (line 0) -> stock (1) -> X (2) -> xAI (3) -> SpaceX rocket (4). */
    "true.0": { add: [{ id: "logo-tesla", anim: "pop" }, { id: "car", anim: "none", fly: { x: -25, ms: 800 } }], seq: [{ t: 850, fx: [{ id: "sparkle", x: 40, y: 54 }] }] },
    "true.1": { add: [{ id: "chart-up", anim: "wipe" }] },
    /* true.2 (buys Twitter): Elon walks in carrying the sink (carry-sink a), sets it down with a thud (b: sink prop + shake + dust + THUD chip),
       smirks (c), walks off, a bird flies in and the real X logo pops in its place. */
    "true.2": { seq: [
      { t: 0,    chars: { C: { id: "elon", expr: "carry-sink", frame: "a", anim: "slide-r" } } },
      { t: 700,  chars: { C: { id: "elon", expr: "carry-sink", frame: "b" } }, stage: ["shake"], add: [{ id: "sink", anim: "drop" }],
                 fx: [{ id: "dust-puff", x: 38, y: 70 }, { id: "dust-puff", x: 62, y: 70, flip: true }], overlay: [{ id: "thud", text: "thud", anim: "pop", y: 52, ms: 900, big: true }] },
      { t: 1000, chars: { C: { id: "elon", expr: "carry-sink", frame: "c" } } },
      { t: 1350, chars: { C: null } },
      { t: 1750, add: [{ id: "bird", anim: "none", fly: { x: 112, y: 18, ms: 600 } }] },
      { t: 2450, remove: [{ id: "bird" }], add: [{ id: "logo-x", anim: "pop" }], fx: [{ id: "sparkle", x: 82, y: 38 }] }
    ] },
    "true.3": { add: [{ id: "ai-orb", anim: "pop", loop: "float" }],
                seq: [{ t: 350, add: [{ id: "logo-xai", anim: "pop" }] }, { t: 700, add: [{ id: "cursor", anim: "none", fly: { x: 112, y: 4, ms: 650 } }] }, { t: 1350, fx: [{ id: "ring", x: 67, y: 24 }] }] },
    "true.4": { launch: { from: { x: -8, y: 92 }, to: { x: 87, y: 52 }, ms: 1600 }, seq: [{ t: 1700, add: [{ id: "logo-spacex", anim: "pop" }] }] },
    "true.5": { chars: { C: { id: "elon", expr: "surprised" } }, propDim: 1 },
    "true.6": { chars: { C: { id: "elon", expr: "smile" } }, propDim: 0, add: [{ id: "tent", anim: "pop", x: 50, y: 66, w: 18 }],
                lines: { from: { x: 50, y: 66 }, to: [{ x: 16, y: 11 }, { x: 82, y: 38 }, { x: 66, y: 20 }, { x: 87, y: 52 }] } }
  }
};
