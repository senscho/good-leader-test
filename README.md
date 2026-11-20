# 좋은 리더 테스트 / The Good Leader Test — prototype

(Repo: good-leader-test. The public title is deliberately a plain personality-test bait: no Elon/Tesla/billionaire hints on the title screen or in the survey; the reveal starts with the story intro after the survey. No art on title or survey.)

Static, no build step, no external requests. Audio needs http(s) (`python3 -m http.server`); opening `index.html` from `file://` still plays, just without sound, because browsers block `fetch` of local files.

## Run
- Open `index.html` directly, or `python3 -m http.server -d . 8000` and visit http://localhost:8000
- Tap anywhere on the dialogue box to advance (first tap completes the typing, next tap advances).

## Files
- `index.html` — shell
- `css/style.css` — mobile-first styles (max width 480px, centered on desktop)
- `js/i18n.js` — ALL text, Korean + English (questions, dialogue, placeholder descriptions)
- `js/app.js` — game logic (title → 4 questions → result → VN ending → replay)
- `js/audio-cues.js` — audio manifest (`AUDIO.have`, track/sfx table, automatic sound mapping, virtual events) and the per-line audio cues
- `js/sfx.js` — the 50 synthesized sound effects (WebAudio recipes)
- `js/audio.js` — audio engine (WebAudio only, mute button, ducking, stems)
- `audio/` — 11 music files + 8 CC0 effect files (`LICENSES.md` has sources and licenses)

## Flow
Title → 4-question survey (shuffled options) → one linear story. Each decision: situation line → "당신의 선택" with a single button (the survey answer) →
wrong answer: its bad ending plays right there; right answer: Elon's reaction, next decision. All right: tent-line → true-sky → [다시 플레이].
Decision order: 1 trust, 2 work-life, 3 automation, 4 regulations/tent. Bad endings are numbered in that order.

## Stage layer system (art-plan-v1.md sections 5, 9, 10)
Stage = the whole `#app` (max 480px wide; on desktop the sides show a darkened, blurred copy of the current background). Art is authored at 1080x2340.
Layers bottom-up: background (object-fit cover, also behind the dialog), bg-fx, props-back, sprites, props-front, fx, overlay text, dialog.
- Sprites: 900x1700 transparent webp, bottom-anchored, centred at x 27.8 / 50 / 72.2 % (slots L / C / R), height = 1700/2340 of stage height.
- Dialog: floating HTML overlay, ~26% of stage height, 3% inset left/right/bottom (+ safe-area), dark 85% with backdrop blur.
- Animation: idle bob, blink (frame b) and talk (a<->c) when those frames exist, enter/exit fade-slide, expression hop.
- `js/cues.js` is the manifest: `have` (files that exist), slots, chars, props, and per-line cues keyed `intro.N / sit.I / choice.I / reply.I / bad.I.N / match.N / true.N / end`.
- Missing art falls back gracefully: a background that is not in `have` (or fails to load) shows the text placeholder box from `i18n.js` → `placeholders`; missing sprites/props/fx are simply not drawn.
- To add art: drop the webp into `art/bg|chr|prop|fx/` (naming in the plan), add its name to `ART.have` in `js/cues.js`, then add cues.

## Background / art slot ids (= `art/bg/bg-<id>.webp`)
`meeting-room` (intro + trust), `factory-night` (work-life), `automation-line`, `parking-dusk` (regulations), `bad-dark-factory` (BAD 1 trust), `bad-lobby` (BAD 2 work-life), `bad-robot-museum` (BAD 3), `bad-opening` (BAD 4), `tent-line`, `true-sky`.
Wired with art so far: `meeting-room` + sprite `elon-neutral-a` (Elon at x 540 through intro and decision 1).

## Logos (true ending)
Official marks, bundled locally in `art/logo/` (no runtime external requests). They are trademarks of their owners, used here only in a fan-made parody (see the disclaimer on the ending screen).
| file | source | licence note |
|---|---|---|
| `logo-x.svg` | https://commons.wikimedia.org/wiki/File:X_logo_2023.svg | public domain (Wikimedia Commons) |
| `logo-spacex.svg` | https://commons.wikimedia.org/wiki/File:SpaceX_logo_black.svg | public domain (Wikimedia Commons) |
| `logo-xai.svg` | https://commons.wikimedia.org/wiki/File:XAI_Logo.svg | CC BY-SA 4.0 on Commons; attribution: file uploaded to Wikimedia Commons (see the file page for the author) |
| `logo-tesla.svg` | https://commons.wikimedia.org/wiki/File:Tesla_T_symbol.svg | public domain (Wikimedia Commons) |
Direct files: `https://upload.wikimedia.org/wikipedia/commons/{c/ce/X_logo_2023.svg, 2/2e/SpaceX_logo_black.svg, 9/93/XAI_Logo.svg, b/bb/Tesla_T_symbol.svg}`. The black marks are shown white on the dark sky with a CSS filter; Tesla keeps its red.

## Notes
- The consulting firm is deliberately unnamed.
- Dialogue is satirical fiction except the facts listed in `../facts.md`; unverified items are marked TODO there.

## Audio (art-plan-v1.md section 18)
- 7 music tracks + 4 true-ending stems (`audio/bgm-*.mp3`, original synthesized music, stereo 32 kHz MP3), 8 CC0 effect files (`audio/sfx-*.mp3`, mono), 50 effects synthesized in the browser (`js/sfx.js`). About 1.5 MB (1.47 MB of audio files) for a full playthrough, nothing is requested at runtime from other sites.
- Everything plays through WebAudio. The AudioContext is created in the tap on a language button (or the first tap anywhere); nothing plays before that, so there are no autoplay errors. The page pauses audio when the tab is hidden.
- Mute button: top right, always visible. Default is sound ON: change `AUDIO_DEFAULT_MUTED` at the top of `js/audio-cues.js`. The choice is saved in `localStorage` (`glt-muted`).
- Cue keys are the same as `js/cues.js`. In `AUDIO.cues[key]` use `bgm`, `sfx`, `sfxStop` (and `seq: [{t, ...}]`); `AUDIO.events` holds the virtual keys (`title.start`, `survey.select`, `survey.next`, `survey.flash`, `ui.choicePress`, `ui.click`). `AUDIO.auto` plays default sounds for stage actions (prop pop/drop/slide, dust, sparkle, shake...). A sound whose file is missing or not listed in `AUDIO.have` is skipped silently.
- BGM loops are sample-exact (decoder gapless playback; the engine also sets `loopEnd`). Stems share one start time.
- Tests used: headless Chromium, all 4 bad endings + the true ending in ko and en, no console errors or 404s.

### Audio credits
See `audio/LICENSES.md` (the 8 effect files are CC0 from Freesound; the music and the other effects are original).
