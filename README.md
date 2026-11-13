# 뉴스레터 발행 페이지 — 다음 장

회색 바탕 위 검은 틀 하나에 칸들이 2px 이음매로 맞붙은 벤토 지면(Lovable inkwell 화면 이식): 큰 제목과 최신 호 사진 칸, 구독 띠,
파스텔 호 카드, 진행 띠와 60% 지점 구독이 있는 읽기 화면, 실제 D1 구독 신청 저장, 구독 취소와 관리자 CSV 내보내기.
디자인 결정은 `DESIGN.md`, 시각 판정은 `design-qa.md`, 자산·Lovable 출처는 `docs/ASSETS.md`.

| 파일 | 무엇을 고치나 |
|---|---|
| `src/content.ts` | 이름(국/영문)·머리 제목·소개·독자·편집장·이메일·발행 주기와 시각·받는 것·다음 호·모든 호(제목·주제·ISO 날짜·사진·본문·뽑은 문장) |
| `src/topics.ts` | 관심 주제(화면과 Worker 가 같이 읽는다) |
| `src/App.tsx` | 껍데기(머리줄)와 모든 화면: `Home`, `Archive`, `Issue`, `SubscribePage`, `Unsubscribe`, `Admin`, 콜로폰 |
| `src/routes.tsx` | 유일한 라우트 표. 새 페이지는 이 배열에 더한다 |
| `src/styles.css` | `@theme static` 색·그라데이션 토큰, 틀·칸·카드·읽기 화면 CSS |
| `index.html` | 제목·설명·서체 `<link>`(Pretendard + Montserrat 800/900) |
| `public/images/*.webp` | 머리 사진, 호 사진, 편집장 사진. 출처는 `docs/ASSETS.md` |
| `schema.sql` | 구독자와 요청 제한 저장소(더하기만) |
| `worker/index.ts` | 저장·취소·관리자 API(`/api/*`) |
| `test/checks.mjs` | API 14건 + 세 뷰포트 UI 흐름 |
| `ADMIN_TOKEN` | 관리자 보호용 비밀, `/admin#k=<token>` 으로 접근 |

`npm run dev`, `npm run build`, `npm run check`.

| 경로 | 화면 |
|---|---|
| `/` | 머리 칸(제목 · 독자 · 최신 호 사진) → 구독 띠 → 최근 세 호 → 받는 것 → 편집장 → 검은 구독 칸 → 콜로폰 |
| `/archive` | 주제 칩 + 사진 카드 격자(홀수면 다음 호 카드) |
| `/issues/:slug` | 읽기 화면: 고정 진행 띠, 사진 머리, 바이라인·링크 복사, 목차, 뽑은 문장, 60% 지점 구독, 다른 호 |
| `/subscribe` | 구독 신청 + 받는 것 |
| `/unsubscribe#token=…` | 본인 링크로 구독 취소 |
| `/admin#k=<ADMIN_TOKEN>` | 주제별 신청 수, 이메일 찾기, 삭제, CSV |

신청 완료는 D1 저장만 뜻합니다. 이메일 발송/이메일 소유 확인은 구현하지 않았으며 UI도 발송했다고 주장하지 않습니다. 실제 발행 전 발송 사업자와 확인 절차를 연결해야 합니다.
