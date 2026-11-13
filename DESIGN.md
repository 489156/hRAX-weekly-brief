# DESIGN.md — 뉴스레터 발행 페이지 「다음 장」 (newsletter-publication)

v3 (2026-11-09, Wave 7). 화면은 Lovable `inkwell-newsletter-landing-page-for-creators` 를 옮겨 왔다
(`notes/lovable-ref/inkwell-newsletter-landing-page-for-creators/`, 읽기 화면 머리·바이라인·뽑은 문장은 그 `src/pages/Post.tsx`).
기능(구독 저장·취소·관리자·CSV)·API·스키마는 v2 그대로다.

## 한 줄

옅은 회색 바탕 위 둥근 검은 틀 하나, 그 안의 칸들이 2px 검은 이음매로 맞붙은 벤토 지면. 큰 한글 제목, 파스텔 호 카드, 복숭아→분홍 알약 버튼.

## 정체성 (template.json 과 같은 값)

| 항목 | 값 |
|---|---|
| grammar / ground | `split-stage` / `light` |
| type_pair | Pretendard(한글 전부) + Montserrat 800/900(라틴 제호 `NEXT PAGE`, `No.006`, 큰 숫자, 첫 글자) |
| signature | 검은 틀 + 2px 이음매(`.frame` 의 `gap`/`padding` 이 틀의 검정을 비춘다). 카드 그라데이션은 자리 순서로 라일락·무지·민트 |
| 같은 「읽을거리」 묶음과의 차이 | `travel-magazine` 은 검정 바탕 Playfair 신문형, `neighborhood-news` 는 흰 바탕 청록 둥근 카드와 동네 고르기. 이 템플릿은 회색 바탕 검은 틀 벤토 + 파스텔 + Montserrat |

## 토큰 — `src/styles.css` 의 `@theme static`

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--color-ground` | `#f3f3f5` | 틀 밖 바탕 |
| `--color-cell` | `#f8f7f6` | 칸 |
| `--color-seam` | `#000` | 틀·이음매 |
| `--grad-cta` | `#f5c6b0 → #f4a5a0 → #e8a0bf` | 주 버튼, 뽑은 문장, 진행 띠, 다음 호 카드 |
| `--grad-1/2/3` | 라일락 / 무지 / 민트 | 호 카드, 관리자 숫자 칸, 사진 없는 읽기 머리 |
| `--seam`, `--radius-frame` | `2px`, `1rem` | 이음매 두께, 틀 모서리 |

색을 바꿀 때는 이 묶음만 고친다. 칸 안에 직접 색값을 쓰지 않는다(체크 아이콘 원 6색만 예외로 CSS 에 있다).

## 타입

- 제목(h1–h3)은 `--font-display`(Montserrat → Pretendard). 한글은 Montserrat 에 글리프가 없어 Pretendard 900 으로 떨어진다. 자간 -0.035~-0.05em.
- 머리 제목은 `content.headline` 두 줄(각 줄 `display:block`), 최대 4.1rem. 읽기 화면 제목 `--step-4`.
- 본문 Pretendard 400, 읽기 화면 `--step-1` / 1.85, 최대 40em.

## 모션

- 첫 화면 칸: `.rise`(흐림 4px → 0, 18px 위로, 0.7s expo-out, 80ms 간격). Lovable 의 framer-motion fade-up 을 CSS 로.
- 아래 칸: `.reveal` — 첫 스크롤 뒤에만 숨김을 켜고 한 번 등장.
- hover: 머리 사진 1.04 확대, 카드 「읽기 →」 간격 벌어짐, 알약 눌림 0.97. 오류 문구는 한 번 흔들린다.
- `prefers-reduced-motion` 이면 전부 끈다(진행 띠는 정보라 남긴다). `scroll-behavior: smooth` 는 쓰지 않는다.

## 상태 · 빈 화면

구독: 형식 오류·동의 누락은 폼 아래 `role=alert`, 저장 중 스피너, 성공은 서버 문구 + 관리 링크(복사). 지난 호: 주제에 글이 없으면 「이 주제의 이야기가 아직 없어요.」 + 전체 보기. 홀수 개면 마지막 자리를 「다음 호」 카드가 채운다(폰에서는 숨김). 관리자: 잠김 / 불러오는 중 / 비어 있음 / 목록.

## 미디어

가로 16:9 사진 6장(`public/images/`, 2048×1152 원본 → WebP). 머리 사진 칸과 읽기 화면 머리는 사진 위에 아래쪽 검은 그라데이션을 깔고 흰 글자. 편집장 사진은 흑백(CSS `grayscale`). 출처는 `docs/ASSETS.md`.

## 폰 (375 / 402)

틀 좌우 여백 12px, 칸 안쪽 24px. 머리 칸은 한 단으로 제목 → 독자 칸 → 사진 칸. 구독 띠는 라벨·입력·버튼이 세로로, 버튼은 가로 꽉 차게. 카드 1단. 가로 넘침 0(`test/checks.mjs` 가 화면마다 `scrollWidth` 를 잰다).

## 바꾸면 안 되는 것

검은 틀 + 2px 이음매, 두 가족, 주 버튼의 그라데이션 알약, 읽기 화면의 진행 띠와 60% 지점 구독.

## 변경 기록

- v3 (2026-11-09): Lovable inkwell 화면으로 다시 지음. 세리프 종이 포스터·표지 책장 → 벤토 틀·파스텔 카드. 리소그래프 표지 3장 → 생성 사진 6장.
- v2 (2026-11-09): 종이 위 세리프 제호 포스터 + 표지 책장(hand-fix).
