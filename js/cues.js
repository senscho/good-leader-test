/* Stage manifest + per-line cues (art-plan-v1.md sections 5, 9).
   Art is authored at 1080x2340; sprites are 900x1700 transparent webp, bottom-anchored.
   `have` lists the art files that actually exist. Anything not listed is never requested and falls back to the text placeholder
   (backgrounds) or is simply not drawn (sprites/props/fx). When Mika delivers a new file: add its name to `have`. */
window.ART = {
  have: {
    bg:  ["meeting-room"],                 // art/bg/bg-<id>.webp
    chr: ["elon-neutral-a", "engineer-neutral-a", "board-stern-a", "consultant-smug-a"],   // art/chr/<char>-<expr>-<frame>.webp
    prop: [],                              // art/prop/prop-<name>[-<n>].webp
    fx: []                                 // art/fx/fx-<name>.webp
  },
  stage: { w: 1080, h: 2340, spriteW: 900, spriteH: 1700 },
  slots: { L: { x: 300 / 1080 * 100 }, C: { x: 50 }, R: { x: 780 / 1080 * 100 } },   // % of stage width (27.8 / 50 / 72.2)
  chars: {   // exprs and frame letters: a = base, b = blink (eyes closed), c = talk (mouth open); special poses use numeric frames
    elon:       { exprs: ["neutral", "firm", "regret", "surprised", "smile"], frames: ["a", "b", "c"], special: { sleep: ["1", "2"] } },
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
    /* Layout: Elon C (x 540), engineer L (x 300), board / consultant R (x 780). The speaker is drawn in front and bright, the others dim.
       A background change clears every sprite, so each scene re-adds who is in it. Only the "neutral/stern/smug" a-frames exist so far. */
    /* trust / meeting-room: Elon at C from the first line; engineer joins on his first line, board on hers and leaves before decision 1 */
    "intro.0": { chars: { C: { id: "elon", expr: "neutral", anim: "fade" } } },
    "intro.1": { chars: { L: { id: "engineer", expr: "neutral" } } },
    "intro.2": { chars: { R: { id: "board", expr: "stern" } } },
    "sit.1":   { chars: { R: null } },
    /* decision situation lines are all spoken by the engineer */
    "sit.0": { chars: { L: { id: "engineer", expr: "neutral" } } },
    "sit.2": { chars: { L: { id: "engineer", expr: "neutral" } } },
    "sit.3": { chars: { L: { id: "engineer", expr: "neutral" } } },
    /* bad ending 1 (trust) - bad-dark-factory */
    "bad.1.1": { chars: { R: { id: "board", expr: "stern" } } },
    "bad.1.2": { chars: { L: { id: "engineer", expr: "neutral" } } },
    "bad.1.6": { chars: { L: null, R: null } },
    /* bad ending 2 (work-life) - bad-lobby: consultant R, engineer L, then the board replaces the engineer on L */
    "bad.0.1": { chars: { R: { id: "consultant", expr: "smug" } } },
    "bad.0.2": { chars: { L: { id: "engineer", expr: "neutral" } } },
    "bad.0.5": { chars: { L: { id: "board", expr: "stern" } } },
    /* bad ending 3 (automation) - bad-robot-museum */
    "bad.2.1": { chars: { L: { id: "engineer", expr: "neutral" } } },
    "bad.2.2": { chars: { R: { id: "board", expr: "stern" } } },
    /* bad ending 4 (regulations) - bad-opening */
    "bad.3.1": { chars: { L: { id: "engineer", expr: "neutral" } } },
    "bad.3.2": { chars: { R: { id: "board", expr: "stern" } } }
  }
};
