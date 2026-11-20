/* Audio manifest + per-line audio cues (art-plan-v1.md section 18). Keys match js/cues.js (intro.N sit.I choice.I reply.I bad.I.N match.N true.N end),
   I = question index (1 trust, 0 work-life, 2 automation, 3 regulations), so bad.1.* is bad ending 1 and bad.0.* is bad ending 2.
   `have` lists the audio FILES that exist (only those are ever requested); anything else is silently skipped. Synth sounds live in js/sfx.js.
   cue fields (all optional, also usable inside seq [{t, ...}]):
     sfx: [name | {id, t, rate, gain, pan: n | [from, to, ms], loop, key, n, gap, ramp: [from, to] (gain, pitch for count-tick), pitchRamp, big, lp}]   sfxStop: [key | {key, fade}]
     bgm: {play, fade, at: "bar"|ms, after, oldFade, stop, cut, then, duck: {to, ms}, drop: {lp, gain, ms} | false, vol: [v, ms], stem: {name: v, fade}, stems: {name: v | [v, delayMs]}, swell: {to, ms}, final}
     autoOff: ["add" | "fx" | "stage"]  -> do not use the automatic mapping (below) for that kind in this cue.   manual: true -> no automatic sounds at all. */
var AUDIO_DEFAULT_MUTED = false;   // true = the sound starts muted (the mute button still toggles it)
window.AUDIO = {
  defaultMuted: AUDIO_DEFAULT_MUTED,
  storageKey: "glt-muted",
  have: {
    bgm: ["pastel", "tension-a", "tension-b", "wry", "wry-end", "tent", "true-piano", "true-strings", "true-drive", "true-choir", "true-final"],   // audio/bgm-<name>.mp3
    sfx: ["cheer", "rocket", "kaching", "shutter-slam", "popper", "car-pass", "crowd-murmur", "conveyor-loop"]                                   // audio/sfx-<name>.mp3
  },
  /* loops: true = seamless; len = exact loop length in seconds (bars * 4 * 60 / bpm); bpm is used for "next bar" starts */
  bgm: {
    "pastel":     { files: ["pastel"],    loop: true,  gain: .55, bpm: 112, len: 16 * 4 * 60 / 112 },
    "tension-a":  { files: ["tension-a"], loop: true,  gain: .45, bpm: 100, len: 16 * 4 * 60 / 100 },
    "tension-b":  { files: ["tension-b"], loop: true,  gain: .55, bpm: 120, len: 16 * 4 * 60 / 120 },
    "wry":        { files: ["wry"],       loop: true,  gain: .50, bpm: 88,  len: 8 * 4 * 60 / 88 },
    "wry-end":    { files: ["wry-end"],   loop: false, gain: .55 },
    "tent":       { files: ["tent"],      loop: true,  gain: .55, bpm: 124, len: 8 * 4 * 60 / 124 },
    "true":       { files: ["true-piano", "true-strings", "true-drive", "true-choir"], stems: ["piano", "strings", "drive", "choir"], loop: true, gain: .55, bpm: 84, len: 8 * 4 * 60 / 84 },
    "true-final": { files: ["true-final"], loop: false, gain: .60 }
  },
  /* synth = recipe in js/sfx.js, file = audio/sfx-<file>.mp3. duck: lowers the music while it plays. */
  sfx: {
    "cheer":        { file: "cheer",        gain: .8, duck: { to: .35, ms: 3200 } },
    "rocket":       { file: "rocket",       gain: .8, duck: { to: .3, ms: 3500 } },
    "kaching":      { file: "kaching",      gain: .8 },
    "shutter-slam": { file: "shutter-slam", gain: .9 },
    "popper":       { file: "popper",       gain: .7 },
    "car-pass":     { file: "car-pass",     gain: .6 },
    "crowd-murmur": { file: "crowd-murmur", gain: .5 },
    "conveyor-loop": { file: "conveyor-loop", gain: .5 },
    "sink-thud":    { synth: "sink-thud", gain: .85, duck: { to: .2, ms: 500 }, vibrate: 40 },
    "riser":        { synth: "riser", gain: 1, duck: { to: .35, ms: 2400 } },
    "drop":         { synth: "drop", gain: 1, vibrate: 15 },
    "lights-off":   { synth: "lights-off", gain: 1, stops: [{ key: "hum", fade: 400 }] },
    "bad-sting":    { synth: "bad-sting", gain: 1 },
    /* level trims measured by rendering each recipe offline (quiet noise-based ones up, hot ones down) */
    "ui-swipe":     { synth: "ui-swipe", gain: 3.5 },
    "clock-tick":   { synth: "clock-tick", gain: 2 },
    "puff":         { synth: "puff", gain: 1.8 },
    "sand":         { synth: "sand", gain: 2.2 },
    "hush":         { synth: "hush", gain: 3 },
    "snore-loop":   { synth: "snore-loop", gain: 5 },
    "stamp":        { synth: "stamp", gain: .8 },
    "rope-clink":   { synth: "rope-clink", gain: .6 }
  },
  tick: { minGapMs: 55, maxPerSec: 14, everyNthChar: 2, bgmTypingDuck: .73 },
  /* sounds that play without a cue entry, by what the stage does (hooked from app.js apply()). Prop ids override the animation default. */
  auto: {
    anim: { "pop": "pop", "popbig": "tent-pop", "drop": "drop", "slide-l": "whoosh", "slide-r": "whoosh", "wipe": "whoosh", "fall": "envelopes" },
    prop: { "home-bubble": "bubble", "robot-arm": "servo", "sleeping-bag": { id: "drop", lp: 600, gain: .6 }, "sink": null, "ai-orb": "orb-up",
            "logo-tesla": "logo-pop", "logo-x": "logo-pop", "logo-xai": "logo-pop", "logo-spacex": "logo-pop" },
    fx: { "dust-puff": "puff", "sparkle": "sparkle", "sweat": "plink", "qmark": "qmark", "alarm": { id: "alarm-loop", gain: .12, loop: true, key: "alarm" }, "confetti": "popper" },
    stage: { "shake": { id: "drop", big: true } }
  },
  /* virtual events fired by app.js */
  events: {
    "title.start":     { sfx: ["ui-start"] },
    "survey.select":   { sfx: ["ui-select"] },
    "survey.next":     { sfx: [{ id: "ui-swipe", t: 60 }] },
    "survey.flash":    { sfx: ["ui-flash"], bgm: { play: "tension-a", fade: 1200 } },
    "ui.choicePress":  { sfx: ["ui-choice-press"] },
    "ui.click":        { sfx: ["ui-click"] }
  },
  cues: {
    /* ---- intro + decision 1 (trust, meeting room) ---- */
    "intro.0": { sfx: ["whoosh", { id: "ui-click", rate: .6, t: 200 }], bgm: { vol: [.55, 14000] } },
    "intro.2": { sfx: ["sand"] },
    "sit.1":   { sfx: [{ id: "ding", t: 200 }] },
    "choice.1": { bgm: { drop: { lp: 350, gain: .25, ms: 250 } }, sfx: [{ id: "ui-choice-sting", rate: 1.0 }] },
    "reply.1": { bgm: { drop: false }, sfx: ["ui-reply-hit", "paper", { id: "paper", t: 1500, gain: .5 }] },
    /* ---- decision 2 (work-life, factory night) ---- */
    "sit.0":   { sfx: ["clock-tick"] },
    "choice.0": { bgm: { drop: { lp: 350, gain: .25, ms: 250 } }, sfx: [{ id: "ui-choice-sting", rate: 1.06 }] },
    "reply.0": { bgm: { drop: false }, sfx: ["ui-reply-hit", { id: "whoosh", gain: .35 }] },
    /* ---- decision 3 (automation): the sleep beat, then the line ---- */
    "sit.2.beat":    { bgm: { stop: 600 }, sfx: [{ id: "hum-loop", gain: .25, loop: true, key: "hum" }, { id: "snore-loop", gain: .4, loop: true, key: "snore" }] },
    "sit.2.beatEnd": { sfxStop: [{ key: "snore", fade: 400 }] },
    "sit.2":   { bgm: { play: "tension-b", fade: 800 }, sfxStop: [{ key: "hum", fade: 600 }], sfx: [{ id: "whoosh", gain: .5, rate: .7, t: 100 }] },
    "choice.2": { bgm: { drop: { lp: 350, gain: .25, ms: 250 } }, sfx: [{ id: "ui-choice-sting", rate: 1.12 }] },
    "reply.2": { bgm: { drop: false }, sfx: ["ui-reply-hit", "whoosh", { id: "crowd-murmur", t: 550, gain: .6 }] },
    /* ---- decision 4 (regulations, parking lot) ---- */
    "sit.3":   { autoOff: ["add"], sfx: [{ id: "ding", rate: .8, t: 150, gain: .7 }] },     // the shake gives the big thud
    "choice.3": { bgm: { drop: { lp: 350, gain: .25, ms: 250 } }, sfx: [{ id: "ui-choice-sting", rate: 1.19 }] },
    "reply.3": { bgm: { drop: false }, sfx: ["ui-reply-hit"] },

    /* ---- bad ending 1 (trust) ---- */
    "bad.1.0": { bgm: { cut: 150, then: { play: "wry", after: 2200, fade: 600 } }, sfx: [{ id: "bad-sting", t: 850 }] },
    "bad.1.1": { sfx: [{ id: "ding", rate: .75 }] },
    "bad.1.2": { sfx: [{ id: "ding", rate: .8 }] },
    "bad.1.3": { sfx: ["slide-down"] },
    "bad.1.4": { sfx: [{ id: "ding", rate: .85, t: 350 }] },
    "bad.1.5": { sfx: ["flicker", { id: "flicker", t: 180 }, { id: "flicker", t: 360 }, { id: "flicker", t: 540 }] },
    "bad.1.6": { bgm: { drop: { lp: 500, gain: .15, ms: 1500 } },
                 sfx: [{ id: "ding", rate: .75 }, { id: "ding", rate: .85, t: 500 }, { id: "ding", rate: .95, t: 1000 }, { id: "ding", rate: 1.2, t: 1500 }, { id: "lights-off", t: 2000 }] },
    "bad.1.7": { autoOff: ["add"], bgm: { stop: 2500, play: "wry-end", fade: 200 }, sfx: ["paper", { id: "bad-final", t: 150 }] },
    /* ---- bad ending 2 (work-life) ---- */
    "bad.0.0": { bgm: { cut: 150, then: { play: "wry", after: 2200, fade: 600 } }, sfx: [{ id: "bad-sting", t: 850 }] },
    "bad.0.1": { sfx: [{ id: "ding", rate: 1.15, t: 150 }] },
    "bad.0.3": { },
    "bad.0.4": { autoOff: ["add"], sfx: ["slide-down", "paper", { id: "paper", t: 400 }, { id: "drop", t: 0, gain: .35 }, { id: "drop", t: 400, gain: .5 }] },
    "bad.0.6": { sfx: [{ id: "kaching", t: 150 }] },
    "bad.0.7": { manual: true, bgm: { stop: 2500, play: "wry-end", fade: 200 }, sfx: ["shutter-slam", { id: "bad-final", t: 500 }] },
    /* ---- bad ending 3 (automation) ---- */
    "bad.2.0": { autoOff: ["add"], bgm: { cut: 150, then: { play: "wry", after: 2200, fade: 600 } }, sfx: [{ id: "bad-sting", t: 850 }, { id: "servo", n: 3, gap: 400, t: 900, key: "servo" }] },
    "bad.2.1": { sfx: [{ id: "whoosh", gain: .15 }] },
    "bad.2.2": { autoOff: ["fx"], sfx: ["qmark", { id: "qmark", rate: 1.06, t: 120 }] },
    "bad.2.3": { sfx: [{ id: "whoosh", gain: .8 }] },
    "bad.2.4": { sfx: [{ id: "servo", rate: 1.8, n: 6, gap: 230, key: "servo" }] },
    "bad.2.5": { sfx: [{ id: "crowd-murmur", gain: .8 }] },
    "bad.2.6": { manual: true, bgm: { stop: 2500, play: "wry-end", fade: 200 }, sfx: ["rope-clink", { id: "bad-final", t: 300 }, { id: "servo", rate: 1, pitchRamp: [1, .3], gain: .8, n: 4, gap: 450 }] },
    /* ---- bad ending 4 (regulations) ---- */
    "bad.3.0": { manual: true, bgm: { cut: 150, then: { play: "wry", after: 2200, fade: 600 } }, sfx: [{ id: "bad-sting", t: 850 }, { id: "stamp", t: 0 }] },
    "bad.3.1": { sfx: [{ id: "ding", rate: .8, t: 150 }] },
    "bad.3.2": { sfx: ["sand"] },
    "bad.3.3": { sfx: ["glass-tink", "sand", "flicker", { id: "flicker", t: 450 }, { id: "flicker", t: 900 }, { id: "flicker", t: 1350 }, { id: "flicker", t: 1800 }, { id: "flicker", t: 2250 }] },
    "bad.3.4": { bgm: { duck: { to: .2, ms: 1500 } }, sfx: ["fanfare-wonky"] },
    "bad.3.5": { sfx: ["sting-shock"] },
    "bad.3.6": { bgm: { stop: 2500, play: "wry-end", fade: 200 }, sfx: [{ id: "bad-final", t: 100 }, { id: "popper", rate: .7, t: 100 }] },

    /* ---- tent success ---- */
    "match.0": { bgm: { play: "tent", fade: 1500, at: "bar" }, sfx: [{ id: "crowd-murmur", gain: .6 }, { id: "conveyor-loop", gain: .4, loop: true, key: "line" }] },
    "match.1": { sfx: [{ id: "car-pass", t: 0 }, { id: "count-tick", n: 14, gap: 100, pitchRamp: [.7, 2.2] }, { id: "ding", t: 1400, gain: 1 }] },
    "match.2": { sfxStop: [{ key: "line", fade: 800 }], bgm: { vol: [.7, 800] }, sfx: ["cheer"] },
    /* ---- true ending ---- */
    "true.0": { bgm: { play: "true", stems: { piano: 1 }, fade: 1500 }, sfx: [{ id: "car-pass", t: 0 }] },
    "true.1": { bgm: { stems: { strings: 1 }, fade: 900 }, sfx: ["chart-up"] },
    "true.2": { autoOff: ["stage", "fx"],
                sfx: [{ id: "footsteps", n: 3, gap: 250, ramp: "up" }],
                seq: [
                  { t: 700,  sfx: ["sink-thud", "pop", { id: "puff", pan: -.5 }, { id: "puff", pan: .5, t: 40 }], bgm: { duck: { to: .2, ms: 500 } } },
                  { t: 1350, sfx: [{ id: "footsteps", n: 3, gap: 250, ramp: "down", gain: .6 }] },
                  { t: 1750, sfx: [{ id: "bird-chirp", pan: [.8, -.2, 600] }, { id: "whoosh", gain: .3, rate: 1.5 }] },
                  { t: 2450, sfx: ["puff", "glitch"], bgm: { stem: { drive: 1, fade: 400 } } }
                ] },
    "true.3": { bgm: { stems: { choir: 1 }, fade: 1200 },
                seq: [{ t: 700, sfx: [{ id: "cursor-ping", pan: [.8, 0, 650] }] }, { t: 1350, sfx: ["ring-ping"] }] },
    "true.4": { bgm: { swell: { to: 1.2, ms: 1500 } }, sfx: [{ id: "rocket", pan: [-.8, .8, 1600] }] },
    "true.5": { bgm: { stems: { strings: 0, drive: 0, choir: 0, piano: .5 }, fade: 350 }, sfx: ["hush"] },
    "true.6": { sfx: [{ id: "riser" },
                      { id: "line-draw", rate: 1.0, t: 500 }, { id: "line-draw", rate: 1.26, t: 950 }, { id: "line-draw", rate: 1.5, t: 1400 }, { id: "line-draw", rate: 2.0, t: 1850 }],
                bgm: { stems: { strings: [1, 0], drive: [1, 600], choir: [1, 1200] }, fade: 500,
                       final: { play: "true-final", at: "bar", after: 2300, stems: { piano: .4, strings: .4, drive: .4, choir: .4 }, then: { afterMs: 5200, stems: { piano: .6, strings: 0, drive: 0, choir: .6 }, fade: 2000 } } } },
    "end": { }
  }
};
