# 좋은 리더 테스트 / The Good Leader Test — prototype

(Repo and URL keep the original name, billionaire-aptitude-test. The public title is deliberately a plain personality-test bait: no Elon/Tesla/billionaire hints on the title screen or in the survey; the reveal starts with the story intro after the survey. No art on title or survey.)

Static, no build step, works offline (no external requests).

## Run
- Open `index.html` directly, or `python3 -m http.server -d . 8000` and visit http://localhost:8000
- Tap anywhere on the dialogue box to advance (first tap completes the typing, next tap advances).

## Files
- `index.html` — shell
- `css/style.css` — mobile-first styles (max width 480px, centered on desktop)
- `js/i18n.js` — ALL text, Korean + English (questions, dialogue, placeholder descriptions)
- `js/app.js` — game logic (title → 4 questions → result → VN ending → replay)

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

## Notes
- The consulting firm is deliberately unnamed.
- Dialogue is satirical fiction except the facts listed in `../facts.md`; unverified items are marked TODO there.
