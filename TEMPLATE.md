# 뉴스레터 제작 지침

코드보다 `DESIGN.md` 를 먼저 읽는다. 이 템플릿의 정체성은 **회색 바탕 위 검은 틀 하나에 2px 이음매로 맞붙은 칸들(벤토), 파스텔 호 카드, 진행 띠가 있는 읽기 화면**이다.

## 먼저 물을 것

1. 발행물 이름(국/영문)과 무엇을 보내는 레터인지 한두 문장, 발행 주기와 시각(「격주 월요일 오전 7시」) — `content.title` `latin` `headline`(두 줄) `description` `cadence` `sendTime`
2. 누가 읽는지 한 문장 — `content.readers`. 구독자 수·열람률을 모르면 숫자를 쓰지 않는다
3. 편집실 이름, 편집장 이름·소개·사진, 연락 이메일 — `content.editor` `person` `email`
4. 실제 글: 호 번호·제목·주제·발행일(ISO)·소개·본문 절, 크게 뽑을 문장이 있으면 `pull`/`pullAfter` — `issues[]`. 글을 지어내 고객 발행 실적으로 주장하지 않는다
5. 호마다 가로 사진이 있는지. 있으면 16:9 WebP 로 `public/images/` 에 두고 `cover`/`coverAlt`. 없으면 비워 둔다 — 주제 색 그라데이션이 대신한다
6. 구독하면 받는 것 다섯~여섯 줄 — `content.benefits`
7. 다음 호 예정일 — `content.nextIssue`

## 고칠 곳

- 문구·데이터는 `src/content.ts` 하나. 주제 목록은 `src/topics.ts` — Worker 도 검증에 쓰므로 화면과 서버가 같은 배열을 읽는다. 첫 칸 「전체」는 지우지 않는다.
- 머리 사진은 `public/images/hero.webp`(최신 호로 가는 칸). 바꿀 때 같은 이름으로 두거나 `App.tsx` 의 `Home` 에서 경로를 고친다.
- 색은 `src/styles.css` 의 `@theme static` 에서 `--color-*` 와 `--grad-*` 만. 칸에 직접 색을 쓰지 않는다.
- 견본 표기(`content.sample`, 콜로폰 한 줄)는 실제 글·사진으로 바꿀 때 함께 고친다.

## 항목 하나 더하기 (예: 구독 신청에 「이름」)

1. `schema.sql`: 새 앱이면 `CREATE TABLE ... subscriber(...)` 에 `name TEXT NOT NULL DEFAULT ''` 를 더한다. 이미 배포된 앱은 표가 있어서 `CREATE TABLE IF NOT EXISTS` 로는 칸이 생기지 않는다 — `ALTER TABLE subscriber ADD COLUMN name TEXT NOT NULL DEFAULT ''` 를 한 번 실행해야 하니 운영자에게 먼저 묻는다. 칸을 지우거나 이름을 바꾸지 않는다.
2. `worker/index.ts` 의 `/subscribe`: `clean(b.name, 40)` 으로 받아 `INSERT` 에 넣고, `/admin/subscribers` 와 CSV 의 `SELECT`·머리줄에 더한다.
3. `src/App.tsx` 의 `Subscribe`: 상태 하나와 `<input aria-label="이름">` 을 `.sub-row` 의 이메일 앞에 넣고 `body` 에 싣는다. 관리자 목록 `li` 에 한 칸.
4. `test/checks.mjs` 의 `api()` 에 저장 확인 한 줄.

## 변형

- **팀 레터**: `topics` 를 팀 이름으로, `content.editor` 를 팀으로. 구독은 그대로.
- **주제별 큐레이션**: 호마다 절(`sections`) 대신 링크 묶음을 쓰려면 `Issue` 의 `.prose` 를 목록으로 바꾸되 진행 띠·60% 지점 구독은 유지한다.

## 지킬 것

- 서버에 구독 신청만 저장하는 버전이다. 발송은 운영자가 `/admin` 의 CSV 를 스티비·메일리 같은 발송 서비스로 옮겨서 한다(그 안내는 관리자 화면에만 둔다 — 구독자 화면에 「운영자가 별도로 발송」 같은 문장을 쓰지 않는다). `content.subscribeNote` 는 운영자의 발행 약속이다. 발행 주기를 바꾸면 `cadence`·`sendTime`·`benefits` 첫 줄을 함께 고친다.
- 견본 발행일은 `content.ts` 의 `issueDate(주 수)` 로 오늘 기준 계산된다. 실제 발행물로 바꿀 때는 `"2026-11-02"` 같은 날짜 문자열로 적는다. Worker 는 `content.ts` 를 import 하지 않는다(Worker 안에서는 모듈을 읽을 때 시계가 0 이다) — 서버가 쓸 값은 `topics.ts` 처럼 날짜 계산이 없는 파일에 둔다.
- 관리 링크를 잃은 구독자는 문의 메일로 요청하고, 운영자가 `/admin` 의 「삭제」로 지운다(`DELETE /api/admin/subscribers/:id`).
- 관리자 토큰을 환경 비밀로 설정한다. 구독 취소는 본인에게 발급된 임의 링크로만 가능하며 이메일 조회/취소 엔드포인트를 추가하지 않는다. 해시와 관리 토큰을 CSV 에 포함하지 않는다.
- 두 가족(Pretendard + Montserrat)을 넘지 않는다. 한글 제목은 Pretendard 900 으로 떨어지는 것이 맞다.
- 구독자 수·열람률 같은 숫자는 실제 값을 받았을 때만 쓴다.
- 모션은 첫 화면 떠오름, 첫 스크롤 뒤 칸 등장, hover 와 읽기 진행 띠뿐. `html { scroll-behavior: smooth }` 를 넣지 않는다.

## 확인

`npm run check` 는 실제 D1 저장/삭제, 중복 신청의 토큰 비노출, 관리자 접근 보호와 375·402·1440 의 주요 UI 흐름(홈 → 이번 호 읽기 → 목차·진행 띠·중간 구독, 주제 거르기 → 카드 열기, 구독 오류/성공, 관리자 찾기, 취소)과 화면마다 가로 넘침을 확인한다.
