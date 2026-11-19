# Billionaire Aptitude Test — prototype (no art)

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
Title (only [한국어] [English], tapping starts in that language) → Q1–Q4 (option order is shuffled each play) →
- all 4 Elon answers: "Elon match" + [엔딩 보기] → scene-2018 → "당신의 선택은?" (shows all 4 answers) → match → true-ending → [다시 플레이]
- otherwise: "No match found out of 1 database" → auto-advance (~2.6s) → scene-2018 → situation for the FIRST wrong question → "당신의 선택은?" (shows that answer) → bad-N → [다시 플레이]

## Art placeholder slots (for Mika)
Each slot is a full-width box above the dialogue (mobile ratio ≈ 390 × ~480 px visible; draw taller than wide). The slot id is printed in the box's top-left corner and is in `data-slot`. Scene descriptions live in `js/i18n.js` → `placeholders`.

| slot id | used when | ko description (en in i18n.js) |
|---|---|---|
| `scene-2018` | intro + choice screen (all endings) | 2018 프리몬트 공장, 새벽 3시, 라인 옆 책상 밑에서 자는 일론 |
| `bad-1` | BAD 1 컨설팅 파산 (Q1 wrong) | 텅 빈 공장 로비, 보고서 더미, "자동화 순조" 슬라이드, 팔짱 낀 컨설턴트들 |
| `bad-2` | BAD 2 회의 무한 루프 (Q2 wrong) | 불 꺼진 공장 위로 "회의 #∞" 회의실 유리창만 환하게 |
| `bad-3` | BAD 3 로봇 박물관 (Q3 wrong) | 반짝이는 로봇 팔 전시장, 차는 한 대도 없음 |
| `bad-4` | BAD 4 완공 파산 (Q4 wrong) | 새 공장 개장식, 정문에 붙은 파산 공고 |
| `match` | Elon-match ending (Elon's real choices → 5,000/week) | 주차장 텐트 조립 라인, 막 나오는 Model 3, 환호하는 직원들 |
| `true-ending` | true ending chain | 노을 하늘, 로켓·X 로고·전기차가 하나의 스카이라인으로 |

To swap in art later: in `setBg()` of `js/app.js`, render `<img src="img/<slot-id>.png">` instead of the placeholder box.

## Notes
- The consulting firm is deliberately unnamed.
- Dialogue is satirical fiction except the facts listed in `../facts.md`; unverified items are marked TODO there.
