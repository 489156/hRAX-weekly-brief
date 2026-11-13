# design-qa — newsletter-publication v3 (2026-11-09)

Wave 7: Lovable `inkwell-newsletter-landing-page-for-creators` 화면 이식. 기능 검사(`docs/check-report.json`)와 이 시각 판정은 별개다.

| 기준 | 결정 | 증거 |
|---|---|---|
| Lovable 외형 유지 | 회색 바탕 검은 틀, 2px 이음매 칸, Montserrat 900 제목, 파스텔 카드, 그라데이션 알약, 사진 칸 위 흰 글자, 흑백 저자 사진, 검은 구독 칸, 읽기 화면 사진 머리·바이라인·드롭캡·뽑은 문장 | `docs/screens/desktop-home.jpg`, `desktop-page-issues_small_teams.jpg` |
| Lovable 보다 나아진 것 | 숫자 자랑(12,847명·열람률) 대신 독자 설명, 가짜 소셜 링크 삭제, 폰에서도 사진 칸을 보임, 주제 칩 거르기·홀수 칸을 채우는 다음 호 카드, 읽기 진행 띠·목차·60% 구독, 관리자 화면 | 같은 캡처 + `*-archive-topic.jpg`, `*-admin-subscriber.jpg` |
| 한국어·견본 규칙 | 해요체 하나, 개발 용어 없음, 견본 표기는 콜로폰 한 줄, 발행일은 오늘 기준 계산 | `src/content.ts` |
| 375·402·1440 넘침·콘솔 오류 | 0 | `check-report.json` |
