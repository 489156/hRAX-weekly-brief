// 공개 페이지·RSS를 직접 확인한 단면 조사. 평가 문구는 사이의 편집 판단이다.
export const sourceReviewDate = "2026-11-14";
export type SourceGroup = "노동법" | "HR" | "AI" | "AX" | "개발";
export type SourceEntry = {
  id: string; name: string; url: string; group: SourceGroup; topics: string[];
  kind: string; cadence: string; recent: string; evidence: string;
  access: string; mode: "auto" | "manual" | "hold";
  recommendation: "필수" | "보완" | "보류"; strength: string; limitation: string;
  feed?: string; selector?: string; priority?: number; lookback?: number;
};

export const sourceCatalog: SourceEntry[] = [
  {
    id: "moel-law", name: "고용노동부 · 입법·행정예고", group: "노동법", topics: ["노동법", "노무"],
    url: "https://www.moel.go.kr/site/rss/rssList.do", feed: "https://www.moel.go.kr/rss/lawinfo.do", selector: ".b_content", priority: 100, lookback: 28,
    kind: "공식 원문", cadence: "수시 · 공식 RSS", recent: "2026-11-13 게시물 확인", evidence: "기관 안내와 RSS의 제목·등록일·원문 주소 확인",
    access: "공개", mode: "auto", recommendation: "필수", strength: "개정 움직임을 공식 공고에서 먼저 확인할 수 있어요. 법적 단계의 기준 출처로 삼아요.",
    limitation: "예고는 시행 확정이 아니에요. 첨부 개정안을 읽지 못하면 구체적인 개정 내용은 요약하지 않아요.",
  },
  {
    id: "moel-policy", name: "고용노동부 · 정책자료", group: "노동법", topics: ["노동법", "인사", "노무"],
    url: "https://www.moel.go.kr/rss/policy.do", kind: "공식 원문", cadence: "수시 · RSS 제공 안내", recent: "확인일에는 정상 목록을 받지 못함", evidence: "RSS 안내는 있으나 실제 응답은 서비스 오류 안내 HTML",
    access: "일시 오류", mode: "hold", recommendation: "보류", strength: "고용노동 정책의 원자료를 확인할 중요한 경로예요.", limitation: "정상 RSS로 복구되는지 다시 확인한 뒤 자동 수집에 넣어요. 오류 응답을 글로 처리하지 않아요.",
  },
  {
    id: "moel-notice", name: "고용노동부 · 공지사항", group: "노동법", topics: ["인사", "노무"],
    url: "https://www.moel.go.kr/rss/notice.do", kind: "공식 원문", cadence: "수시 · 공식 RSS", recent: "2026-11-13 게시물 확인", evidence: "RSS에서 모집·훈련 심사 공고 등 최근 목록 확인",
    access: "공개", mode: "manual", recommendation: "보완", strength: "지원사업·훈련·행정 공고를 찾는 데 유용해요.", limitation: "채용·기관 행정 공고 비중이 있어 일반 기업 HR에 필요한 항목만 수동으로 골라요.",
  },
  {
    id: "kli-review", name: "한국노동연구원 · 노동리뷰", group: "노동법", topics: ["HR", "노동법", "노무"],
    url: "https://www.kli.re.kr/menu.es?mid=a10103010000", kind: "연구·분석", cadence: "월간 · 기관 안내", recent: "목록에 2026년 10월호 · 2026-10-10 표기", evidence: "정기간행물 소개의 월간 안내와 노동리뷰 목록 확인",
    access: "공개 목록·원문 연결", mode: "manual", recommendation: "필수", strength: "고용·임금·노사관계의 맥락을 속보보다 깊게 보완해요.", limitation: "월간 분석은 주간 속보와 시차가 있어요. PDF와 개별 논문의 범위는 별도로 확인해요.",
  },
  {
    id: "kli-international", name: "한국노동연구원 · 국제노동브리프", group: "HR", topics: ["HR", "노무"],
    url: "https://www.kli.re.kr/menu.es?mid=a10103030000", kind: "연구·분석", cadence: "월간 · 기관 안내", recent: "발간 주기 확인 · 최신 개별 호는 미검증", evidence: "https://www.kli.re.kr/menu.es?mid=a10503020000",
    access: "공개 목록·원문 연결", mode: "manual", recommendation: "보완", strength: "해외 노동제도와 국내 실무를 비교할 때 참고해요.", limitation: "해외 제도는 국내에 직접 적용할 수 없어요. 이번 조사에서는 최신 호 본문까지 읽지 않았어요.",
  },
  {
    id: "kli-cases", name: "한국노동연구원 · 노동판례리뷰", group: "노동법", topics: ["노동법", "노무"],
    url: "https://www.kli.re.kr/menu.es?mid=a10202000000", kind: "판례 해설", cadence: "게시 시 갱신 · 고정 요일 미확인", recent: "판례 검색 목록과 RSS 표시 확인", evidence: "사건명·법원·선고일별 검색이 가능한 공식 목록 확인",
    access: "공개", mode: "manual", recommendation: "필수", strength: "판결의 쟁점과 적용 범위를 전문 해설로 보완해요.", limitation: "해설과 판결문은 달라요. 개별 사건을 적용하기 전에 판결문·사실관계를 함께 읽어요.",
  },
  {
    id: "law-center", name: "국가법령정보센터", group: "노동법", topics: ["노동법", "노무"],
    url: "https://www.law.go.kr/", kind: "공식 법령", cadence: "법령 변경 시", recent: "확인 시 시스템 점검 안내", evidence: "2026-11-13~14 서비스 점검 안내 응답 확인",
    access: "점검 안내", mode: "manual", recommendation: "필수", strength: "현행 조문·시행일·연혁을 대조하는 기준 출처예요.", limitation: "이번 접속에서는 개별 현행 조문을 검증하지 못했어요. 최신 법령을 확인한 것처럼 주장하지 않아요.",
  },
  {
    id: "supreme-court", name: "대법원 · 판례속보", group: "노동법", topics: ["노동법", "노무"],
    url: "https://www.scourt.go.kr/portal/news/NewsListAction.work?gubun=4", kind: "공식 판결 자료", cadence: "판례 게시 시", recent: "목록 응답과 2026-11-05 날짜 표기 확인", evidence: "공식 판례속보 목록에 접속 · 자동 한글 추출은 깨짐",
    access: "공개 · 문자 해석 주의", mode: "manual", recommendation: "필수", strength: "기사나 해설에 앞서 판결의 실제 취지를 확인하는 출처예요.", limitation: "노동 사건만 있는 목록이 아니며, 판결 확정 여부와 사건의 구체적 사정을 별도로 확인해요.",
  },
  {
    id: "kni", name: "K&I 노동법 연구소", group: "노동법", topics: ["노동법", "인사", "노무"],
    url: "https://laborlab.stibee.com/", kind: "노무사 해설", cadence: "주간 · 발행처 안내", recent: "2026-11-11·11-04·10-28 발행 목록", evidence: "스티비 아카이브 및 https://nosaplus.com/newsletter 확인",
    access: "공개 아카이브", mode: "manual", recommendation: "필수", strength: "질문형 쟁점과 사례가 있어 사업장 점검 항목으로 바꾸기 쉬워요.", limitation: "전문가의 해석이며 공식 행정해석·판결 그 자체는 아니에요. 두 아카이브는 같은 발행물로 중복 계산하지 않아요.",
  },
  {
    id: "ian", name: "노무법인 이안 · 뉴스레터", group: "노동법", topics: ["노동법", "노무"],
    url: "https://ianlabor.com/newsletter", kind: "전문 큐레이션", cadence: "주간 · 발행처 안내", recent: "2026-11-09·11-02·10-26 목록", evidence: "주차별 발행일과 원문 보기 연결 확인",
    access: "공개 목록", mode: "manual", recommendation: "보완", strength: "한 주의 노동 이슈를 빠르게 훑고 공식 자료로 이동할 출발점이에요.", limitation: "기사 묶음은 원보도와 중복될 수 있어요. 뉴스레터를 독립적인 추가 근거로 세지 않아요.",
  },
  {
    id: "worklaw", name: "월간 노동법률", group: "노동법", topics: ["노동법", "인사", "노무"],
    url: "https://www.worklaw.co.kr/main2022/list/list.asp?in_cate=122&in_cate2=0", kind: "노동 전문 매체", cadence: "월간 지면·수시 기사", recent: "목록 응답 확인 · 자동 한글 추출 깨짐", evidence: "제공 주소의 기사 목록과 중앙경제 구독 안내 확인",
    access: "일부 유료·회원", mode: "manual", recommendation: "필수", strength: "판례·정책과 현장 해설을 함께 살필 전문 매체로 추천해요.", limitation: "결제·로그인 제한을 우회하지 않아요. 이번 자동 추출 결과만으로 개별 기사를 요약하지 않아요.",
  },
  {
    id: "hrinsight", name: "월간 HR Insight", group: "HR", topics: ["HR", "인사", "AX"],
    url: "https://www.hrinsight.co.kr/", kind: "HR 전문지", cadence: "월간 지면·수시 웹 게시", recent: "2026년 11월호 AI·성과관리 특집 표기", evidence: "홈 특집 목록과 구독 안내 확인 · 한글 인코딩 주의",
    access: "일부 유료·회원", mode: "manual", recommendation: "필수", strength: "성과관리·육성·조직문화의 현장 사례와 깊이 있는 특집을 보완해요.", limitation: "특집 제목만 읽고 본문을 읽은 것처럼 작성하지 않아요. 이용 가능한 공개 기사만 따로 확인해요.",
  },
  {
    id: "insabank", name: "한국인사관리협회 · 월간인사관리", group: "HR", topics: ["HR", "인사"],
    url: "https://www.insabank.com/", kind: "HR 전문지", cadence: "월간 · 발행물 명칭·안내", recent: "월간인사관리와 전체 월호 안내 확인", evidence: "홈의 국내외 HR 동향·정보·사례 제공 안내 확인",
    access: "구독·회원 자료 병존", mode: "manual", recommendation: "필수", strength: "국내 인사제도와 기업 운영 사례를 비교하기 위한 읽기 출처예요.", limitation: "이번 조사에서 최신 개별 호와 뉴스레터의 정확한 발송 요일까지 확인하지는 못했어요.",
  },
  {
    id: "imhr", name: "IMHR · 전문가 뉴스레터", group: "HR", topics: ["HR", "노무", "인사"],
    url: "https://www.imhr.work/brand/hr-newsletter/", kind: "HR·노무 실무 해설", cadence: "정확한 주기 미확인", recent: "구독 안내 확인 · 공개 RSS 최신은 2025-11-19", evidence: "뉴스레터 소개와 /brand/feed/의 갱신 날짜를 따로 확인",
    access: "공개 소개·멤버십 병존", mode: "manual", recommendation: "보완", strength: "한줄 자문·노동법 이슈·HR 아이디어를 실무 질문 관점에서 살필 수 있어요.", limitation: "뉴스레터와 오래된 공개 블로그 RSS의 최신성은 같지 않아요. RSS를 최신 뉴스레터라고 수집하지 않아요.",
  },
  {
    id: "hrbulletin", name: "HR 블레틴", group: "HR", topics: ["HR", "인사"],
    url: "https://www.hrbulletin.net/", kind: "조직·리더십 해설", cadence: "수시 · 고정 주기 미확인", recent: "RSS 최신 글 2026-10-26", evidence: "홈과 /feed/ 확인 · robots.txt는 접근 제한 응답",
    access: "공개 글·수집 접근 제한", mode: "manual", recommendation: "보완", strength: "리더십·직원몰입·성과관리의 행동과 조직 맥락을 다뤄요.", limitation: "공개 글이 열려도 수집 정책을 확인할 수 없으면 자동으로 가져오지 않아요. 최근 발행 간격도 일정하지 않았어요.",
  },
  {
    id: "flex", name: "flex · 공식 블로그", group: "AX", topics: ["HR", "인사", "AX"],
    url: "https://flex.team/blog/", feed: "https://flex.team/blog/rss.xml", selector: "main", priority: 76, lookback: 21,
    kind: "기업 실무·제품 관점", cadence: "수시 · 공개 RSS", recent: "2026-11-13·11-10·11-05 게시", evidence: "공식 RSS와 본문 공개 접근·수집 정책 확인",
    access: "공개", mode: "auto", recommendation: "보완", strength: "조직 운영과 HR 데이터에 AI를 연결하는 국내 실무 관점을 보완해요.", limitation: "자사 홍보·행사·제품 업데이트는 우선 제외해요. 판매자의 주장을 독립적 효과 검증으로 해석하지 않아요.",
  },
  {
    id: "aihr", name: "AIHR · HR 실무 블로그", group: "HR", topics: ["HR", "인사", "AX"],
    url: "https://www.aihr.com/blog/", feed: "https://www.aihr.com/feed/", selector: "#main-article-content", priority: 92, lookback: 14,
    kind: "HR 실무 가이드", cadence: "수시 · 공개 RSS", recent: "2026-11-13·11-12·11-10 게시", evidence: "RSS·직무분석 공개 글·수집 정책 확인",
    access: "공개 글·교육 상품 병존", mode: "auto", recommendation: "필수", strength: "직무분석·인력계획·HR 역량을 실행 절차와 양식 관점으로 읽을 수 있어요.", limitation: "교육 상품 홍보를 걸러요. 해외 관행은 국내 노동법 기준과 별개이며 원문 갱신일과 최초 발행일이 다를 수 있어요.",
  },
  {
    id: "hrdive", name: "HR Dive", group: "HR", topics: ["HR", "인사"],
    url: "https://www.hrdive.com/feeds/news/", kind: "HR 전문 보도", cadence: "수시 · 공개 RSS", recent: "2026-11-13 기사 목록", evidence: "RSS는 열렸으나 확인한 기사 본문은 접근 제한 응답",
    access: "RSS 공개·본문 접근 제한", mode: "manual", recommendation: "보완", strength: "해외 채용·보상·인사 이슈를 넓게 찾는 보조 출처예요.", limitation: "짧은 RSS 설명만으로 본문을 읽었다고 주장하지 않아요. 접근 제한을 우회하지 않아요.",
  },
  {
    id: "shrm", name: "SHRM · Workplace News", group: "HR", topics: ["HR", "인사"],
    url: "https://www.shrm.org/topics-tools/news", kind: "HR 전문 단체", cadence: "평일 일간 레터 안내·수시 뉴스", recent: "목록에 2026-11-13·11-12 표기", evidence: "공개 뉴스 목록과 HR Daily Newsletter 안내 확인",
    access: "공개·회원 자료 병존", mode: "manual", recommendation: "보완", strength: "인사정책과 HR 리더의 판단 쟁점을 넓게 보완해요.", limitation: "미국 제도를 국내 의무로 소개하지 않아요. 회원 전용 원문은 수집 대상이 아니에요.",
  },
  {
    id: "cipd", name: "CIPD · Knowledge", group: "HR", topics: ["HR", "인사"],
    url: "https://www.cipd.org/en/knowledge/", kind: "HR 전문 단체", cadence: "이번 접속에서 검증 불가", recent: "자동 접속 확인 화면으로 제한", evidence: "지식 자료실 요청에서 접근 제한 응답 확인",
    access: "접근 제한", mode: "manual", recommendation: "보완", strength: "HR 연구·실무 자료의 수동 확인 후보로 남겨요.", limitation: "이번 조사에서 최근 글 본문·발행 간격을 확인하지 못했어요. 내용 품질의 실증 평가까지 완료한 것은 아니에요.",
  },
  {
    id: "aitimes", name: "AI타임스", group: "AI", topics: ["AI", "AX"],
    url: "https://www.aitimes.com/news/articleList.html?sc_section_code=S1N24&view_type=sm", feed: "https://cdn.aitimes.com/rss/gn_rss_allArticle.xml", selector: "#article-view-content-div", priority: 74, lookback: 10,
    kind: "AI 전문 보도", cadence: "수시 · 공개 RSS", recent: "2026-11-14·11-13 기사", evidence: "AI기술 목록·공식 RSS·수집 정책 확인",
    access: "공개", mode: "auto", recommendation: "보완", strength: "해외 발표를 한국어로 빠르게 살피고 추가로 확인할 단서를 얻어요.", limitation: "발표사 주장을 검증된 성능으로 바꾸지 않아요. 보도 내용과 원발표는 같은 근거일 수 있어요.",
  },
  {
    id: "korben", name: "Korben · AI 뉴스", group: "AI", topics: ["AI", "AX"],
    url: "https://korben.info/ko/categories/inggongjineung/ai-nyuseu/", feed: "https://korben.info/ko/categories/inggongjineung/ai-nyuseu/feed.xml", selector: ".post-content", priority: 69, lookback: 10,
    kind: "기술 해설·한국어판", cadence: "수시 · 공개 RSS", recent: "2026-11-13·11-12 게시", evidence: "카테고리에 명시된 feed.xml·최근 글·수집 정책 확인",
    access: "공개", mode: "auto", recommendation: "보완", strength: "AI 도구의 실제 쓰임과 기술 이슈를 비교적 쉽게 읽을 보조 출처예요.", limitation: "번역·편집 관점과 원발표를 구분해요. 학습용 수집이 아니라 소량의 출처 표시 요약만 만들어요.",
  },
  {
    id: "the-batch", name: "DeepLearning.AI · The Batch", group: "AI", topics: ["AI", "AX"],
    url: "https://www.deeplearning.ai/the-batch/", kind: "주간 AI 해설", cadence: "주간 · 발행처 안내", recent: "2026-11-13 지면 확인", evidence: "홈의 weekly 안내·최근 호 제목 확인 · 추정 RSS 주소는 정상 작동하지 않음",
    access: "공개 웹 지면", mode: "manual", recommendation: "필수", strength: "한 주의 주요 AI 쟁점을 연구·산업 맥락과 함께 읽기 좋아요.", limitation: "확인하지 않은 RSS 주소를 만들어 연결하지 않아요. 이번 버전에서는 수동 읽기 대상으로 추천해요.",
  },
  {
    id: "import-ai", name: "Import AI", group: "AI", topics: ["AI", "AX"],
    url: "https://importai.substack.com/", feed: "https://importai.substack.com/feed", selector: ".available-content", priority: 79, lookback: 14,
    kind: "연구·정책 해설", cadence: "주간 · 발행처 안내", recent: "2026-11-09·11-02 발행", evidence: "소개와 RSS의 연속 발행 날짜 확인",
    access: "공개 글·구독 안내", mode: "auto", recommendation: "필수", strength: "논문·정책·안전의 긴 흐름을 보완해 단순 제품 소식에 치우치지 않게 해요.", limitation: "저자의 관점과 원연구의 실험 범위를 구분해요. 긴 호의 일부만 확인하면 그 범위를 명시해요.",
  },
  {
    id: "simon", name: "Simon Willison · Weblog", group: "AI", topics: ["AI", "AX", "GitHub Trending"],
    url: "https://simonwillison.net/", feed: "https://simonwillison.net/atom/everything/", selector: ".entryPage", priority: 85, lookback: 10,
    kind: "개발자 실험·해설", cadence: "수시 · 공개 Atom", recent: "2026-11-13 게시물 확인", evidence: "Atom의 발행일·본문과 수집 정책 확인",
    access: "공개", mode: "auto", recommendation: "필수", strength: "도구를 직접 써 본 기록과 재현 단서를 바탕으로 AI 활용을 판단해요.", limitation: "개인 실험을 일반 성능으로 확대하지 않아요. AI와 무관한 플러그인 릴리스는 제외해요.",
  },
  {
    id: "latent", name: "Latent Space", group: "AI", topics: ["AI", "AX"],
    url: "https://www.latent.space/", kind: "AI 엔지니어링 해설·대담", cadence: "주 2~3회 안내·별도 일간 지면", recent: "2026-11-13·11-12 게시", evidence: "홈의 발행 안내와 /feeds/all.xml 연결 확인",
    access: "공개·구독 자료 병존", mode: "manual", recommendation: "보완", strength: "구현과 제품 운영의 맥락을 깊이 읽을 수 있는 보완 출처예요.", limitation: "대담·의견·속보의 성격이 달라요. 이번 조사에서는 전체 피드의 안정 수집까지 검증하지 않았어요.",
  },
  {
    id: "tldr", name: "TLDR AI", group: "AI", topics: ["AI", "AX"],
    url: "https://tldr.tech/ai", kind: "단문 큐레이션", cadence: "평일 일간 · 발행처 안내", recent: "공식 구독·발행 주기 안내 확인", evidence: "FAQ의 every weekday·무료 안내 확인",
    access: "무료 안내", mode: "manual", recommendation: "보완", strength: "많은 후보를 빠르게 찾는 탐색 경로로 활용해요.", limitation: "큐레이션의 짧은 요약을 다시 요약하기보다 연결된 원자료를 우선해요. 최신 개별 호 본문은 미검증이에요.",
  },
  {
    id: "anthropic", name: "Anthropic · Newsroom", group: "AI", topics: ["AI", "AX"],
    url: "https://www.anthropic.com/news", kind: "기업 공식 발표", cadence: "발표 시", recent: "확인일의 최신 발표 목록 확인", evidence: "공식 뉴스룸의 제목·날짜·설명 확인",
    access: "공개", mode: "manual", recommendation: "필수", strength: "제품 제공 범위와 회사의 설명을 직접 대조할 공식 출처예요.", limitation: "회사의 성능·효과 주장은 독립적인 검증과 달라요. 이 버전에서는 개별 글을 수동 확인해요.",
  },
  {
    id: "openai", name: "OpenAI · News", group: "AI", topics: ["AI", "AX"],
    url: "https://openai.com/news/rss.xml", kind: "기업 공식 발표", cadence: "발표 시 · 공개 RSS", recent: "2026-11-13 RSS 항목", evidence: "RSS는 열렸으나 확인한 발표 본문은 접근 제한 응답",
    access: "RSS 공개·본문 접근 제한", mode: "manual", recommendation: "필수", strength: "발표 사실과 제품의 공식 안내를 대조하는 기준 출처예요.", limitation: "제목·RSS 설명만으로 세부 기능·가격을 확정하지 않아요. 본문 차단을 우회하지 않아요.",
  },
  {
    id: "google-ai", name: "Google · AI Blog", group: "AI", topics: ["AI", "AX"],
    url: "https://blog.google/technology/ai/", feed: "https://blog.google/technology/ai/rss/", selector: "[data-component=uni-article-body]", priority: 91, lookback: 10,
    kind: "기업 공식 발표", cadence: "발표 시 · 공개 RSS", recent: "2026-11-12·11-11 게시", evidence: "AI RSS·공개 본문·수집 정책 확인",
    access: "공개", mode: "auto", recommendation: "필수", strength: "공식 제품·연구 발표의 범위와 적용 조건을 직접 읽어요.", limitation: "벤치마크와 홍보 문구는 발표사 주장으로 표시해요. 지역·계정·요금제별 제공 차이를 추정하지 않아요.",
  },
  {
    id: "worklab", name: "Microsoft · WorkLab", group: "AX", topics: ["HR", "AI", "AX"],
    url: "https://www.microsoft.com/en-us/worklab/", kind: "기업 연구·일하는 방식", cadence: "이번 접속에서 검증 불가", recent: "확인 시 접속 제한 안내", evidence: "원주소에서 정상 본문을 받지 못함",
    access: "접근 제한", mode: "manual", recommendation: "보완", strength: "AI와 조직·일의 관계를 수동으로 확인할 후보에 남겨요.", limitation: "이번 접속만으로 최신 연구 수치나 발행 주기를 검증했다고 말하지 않아요.",
  },
  {
    id: "github-trending", name: "GitHub · Trending", group: "개발", topics: ["GitHub Trending", "AI", "AX"],
    url: "https://github.com/trending?since=weekly", feed: "https://github.com/trending?since=weekly", selector: "article.Box-row", priority: 65, lookback: 7,
    kind: "공식 공개 목록 관측", cadence: "상시 변동 · 주간 보기", recent: "2026-11-14 주간 목록 확인", evidence: "공식 주간 Trending 목록과 저장소 설명 확인",
    access: "공개 목록·자동 수집 정책상 제한", mode: "manual", recommendation: "보완", strength: "관심이 모이는 공개 도구를 발견하는 신호로 수동 확인해요.", limitation: "목록은 열리지만 자동 수집 시 발행처의 수집 제한을 확인해 정기 대상에서 제외했어요. 공식 RSS나 Trending 전용 API가 아니며, 별 수·순위는 품질·보안의 증거가 아니에요.",
  },
  {
    id: "github-blog", name: "GitHub · The GitHub Blog", group: "개발", topics: ["AI", "AX", "GitHub Trending"],
    url: "https://github.blog/", feed: "https://github.blog/feed/", selector: ".post__content", priority: 88, lookback: 10,
    kind: "기업 공식 가이드", cadence: "수시 · 공개 RSS", recent: "2026-11-13·11-12 게시", evidence: "RSS와 2026-11-12 agent skills 가이드 본문 확인",
    access: "공개", mode: "auto", recommendation: "필수", strength: "AI 개발·도구 사용의 구체적인 절차와 권한 경계를 확인해요.", limitation: "공식 가이드와 Trending 순위는 다른 자료예요. 자사 제품 관점이 포함돼요.",
  },
  {
    id: "geeknews", name: "GeekNews", group: "개발", topics: ["AI", "AX", "GitHub Trending"],
    url: "https://news.hada.io/", kind: "커뮤니티 큐레이션", cadence: "수시 · 공개 RSS", recent: "2026-11-14 게시 목록", evidence: "홈과 https://news.hada.io/rss/news 확인",
    access: "공개", mode: "manual", recommendation: "보완", strength: "한국어로 도구·개발 이슈를 폭넓게 발견할 수 있어요.", limitation: "커뮤니티 요약·의견과 원문을 구분해요. 이번 자동 발행은 2차 요약의 재요약보다 직접 원문을 우선해요.",
  },
  {
    id: "gittrend", name: "GitTrend · Weekly", group: "개발", topics: ["GitHub Trending"],
    url: "https://gittrend.io/weekly", kind: "비공식 주간 집계", cadence: "주차별 아카이브", recent: "2026년 45·44·43주 지면 확인", evidence: "주간 아카이브의 연속 주차 확인",
    access: "공개", mode: "manual", recommendation: "보완", strength: "공식 목록과 다른 큐레이션 관점을 비교할 후보예요.", limitation: "집계 방식과 수치의 정확성은 별도 검증이 필요해요. 공식 GitHub 서비스라고 표시하지 않아요.",
  },
  {
    id: "gh-trends", name: "mhadidg/gh-trends", group: "개발", topics: ["GitHub Trending"],
    url: "https://github.com/mhadidg/gh-trends", kind: "비공식 뉴스레터 프로젝트", cadence: "주간 설계·운영 중단 가능성 안내", recent: "README에 2026-06-30 이후 별 이벤트 수집 문제 경고", evidence: "저장소 README의 CAUTION과 제공 채널 안내 확인",
    access: "공개", mode: "hold", recommendation: "보류", strength: "자동 뉴스레터의 구현 방식은 참고할 수 있어요.", limitation: "발행 지속성을 전제로 채택하지 않아요. 운영자가 명시한 수집 장애를 무시하지 않아요.",
  },
  {
    id: "ghtrends-dev", name: "GhTrends.dev · News", group: "개발", topics: ["GitHub Trending", "AI"],
    url: "https://ghtrends.dev/news/", kind: "비공식 동향 해설", cadence: "일간·주간 지면 안내", recent: "일간 2026-11-14·주간 2026-11-02 표시", evidence: "뉴스 목록의 날짜와 지면 구분 확인",
    access: "공개", mode: "manual", recommendation: "보완", strength: "저장소의 주제 흐름을 비교할 보조 읽기 후보예요.", limitation: "공식 집계가 아니며 최신 일간·주간의 시점이 달라요. 수치·라이선스는 원저장소에서 다시 확인해요.",
  },
  {
    id: "changelog", name: "Changelog · News", group: "개발", topics: ["GitHub Trending", "AI", "AX"],
    url: "https://changelog.com/news/archive", kind: "개발 뉴스 큐레이션", cadence: "주간 안내·현재 RSS 갱신은 확인 필요", recent: "확인한 /news/feed 최신 항목은 2026-04-29", evidence: "주간 소개와 RSS 실제 날짜의 차이 확인",
    access: "공개", mode: "hold", recommendation: "보류", strength: "오픈소스 운영과 유지보수 관점을 읽는 후보예요.", limitation: "주간이라는 소개만으로 현재 정상 발행 중이라고 판정하지 않아요. 이번 정기 수집에서는 제외해요.",
  },
];

export const automaticSources = sourceCatalog.filter(s => s.mode === "auto" && s.feed);
export const modeLabel = { auto: "정기 수집 대상", manual: "수동 확인", hold: "수집 보류" } as const;
