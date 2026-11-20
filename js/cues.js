/* Stage manifest + per-line cues (art-plan-v1.md sections 5, 9).
   Art is authored at 1080x2340; sprites are 900x1700 transparent webp, bottom-anchored.
   `have` lists the art files that actually exist. Anything not listed is never requested and falls back to the text placeholder
   (backgrounds) or is simply not drawn (sprites/props/fx). When Mika delivers a new file: add its name to `have`. */
window.ART = {
  have: {
    bg:  ["meeting-room"],                 // art/bg/bg-<id>.webp
    chr: ["elon-neutral-a"],               // art/chr/<char>-<expr>-<frame>.webp
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
    /* trust / meeting-room scene: Elon stands at x 540 from the first line through decision 1 */
    "intro.0": { chars: { C: { id: "elon", expr: "neutral", anim: "fade" } } }
  }
};
