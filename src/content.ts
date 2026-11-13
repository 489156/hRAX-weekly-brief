// 문구·데이터의 단일 출처. 발행물·글·편집장·사진은 전부 견본이다 — 실제 발행물 정보를 여기에 넣는다.
// 날짜는 ISO(YYYY-MM-DD)로 적고 화면은 formatDate() 로 「2026년 10월 12일 (월)」 로 보여 준다.
// cover 는 public/images/ 의 가로 사진(16:9 WebP). 없으면 주제 색 그라데이션이 그 자리를 채운다.
import { topics } from "./topics";
export { topics };

// 발행일은 오늘 기준으로 계산한다(견본이 지난 소식처럼 보이지 않게): 최신 호 = 가장 최근 월요일,
// 그 앞 호는 2주씩 앞, 다음 호 = 최신 호 + 2주. 실제 발행물로 바꿀 때는 "2026-11-02" 같은 문자열로 적는다.
const lastMonday = (() => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
})();
const issueDate = (weeksBack: number) => {
  const d = new Date(lastMonday);
  d.setDate(d.getDate() - weeksBack * 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const content = {
  title: "다음 장",
  latin: "NEXT PAGE",
  headline: ["작은 팀이 일하는 법,", "격주 월요일에 한 편씩"],
  description: "작은 팀이 실제로 바꾼 회의·회고·도구 이야기. 한 편은 10분이면 읽어요.",
  readers: "스타트업, 디자인 스튜디오, 동네 가게를 꾸리는 사람들이 월요일 출근길에 읽어요.",
  readersNote: "한 편 10분 · 광고 없음",
  email: "hello@nextpage-letter.example.com",
  editor: "다음 장 편집실",
  person: {
    name: "윤서진",
    role: "편집장",
    photo: "/images/editor.webp",
    bio: "디자인 스튜디오와 스타트업 두 곳에서 8년 동안 팀 운영을 맡았어요. 회의를 줄이고, 회고를 남기고, 도구를 고르면서 써 본 방법을 동료 편집자 두 명과 함께 정리해 보내고 있어요.",
  },
  cadence: "격주 월요일",
  sendTime: "오전 7시",
  nextIssue: { number: "007", date: issueDate(-2) },
  benefits: [
    "격주 월요일 오전 7시에 도착해요",
    "10분 안에 읽는 글 한 편",
    "이번 주 팀에서 써 볼 질문 하나",
    "편집실이 직접 써 본 도구 이야기",
    "광고·제휴 글은 싣지 않아요",
    "링크 하나로 언제든 구독 취소",
  ],
  sample: "발행물·글·편집장은 견본이고, 사진은 생성 도구로 만든 견본 이미지예요.",
  subscribeNote: "신청한 주소로 격주 월요일 아침에 보내 드려요.",
  inlineSubscribeTitle: "여기까지 읽으셨다면",
  inlineSubscribeText: "다음 호도 받아 보세요. 격주 월요일 아침, 글 한 편이에요.",
};

export type Issue = {
  slug: string;
  number: string;
  title: string;
  topic: string;
  date: string;
  intro: string;
  cover?: string;
  coverAlt?: string;
  /** 본문에서 한 문장을 크게 뽑아 보여 준다(선택). pullAfter 번째 절 뒤에 놓인다. */
  pull?: string;
  pullAfter?: number;
  sections: { title: string; text: string }[];
};

export const issues: Issue[] = [
  {
    slug: "small-teams",
    number: "006",
    title: "작게 시작하는 팀의 기술",
    topic: "팀과 문화",
    date: issueDate(0),
    intro: "열 명이 안 되는 팀이 계획 문서 없이도 같은 방향을 보는 세 가지 습관을 모았어요. 회의 첫 문장, 진행 공유, 금요일 십 분 회고예요.",
    cover: "/images/issue-006.webp",
    coverAlt: "회의 탁자 위 화분 세 개와 빈 메모지, 아침 햇빛",
    pull: "회의를 시작하기 전에 오늘 결정할 질문을 한 문장으로 적어 두면, 논의가 옆길로 샐 때 돌아올 곳이 생겨요.",
    pullAfter: 1,
    sections: [
      { title: "이번 호에서 함께 볼 것", text: "새로운 일을 시작할 때 우리는 완벽한 계획부터 만들려고 해요. 하지만 작은 팀에 필요한 것은 모든 경우를 예측하는 문서보다, 다음 한 걸음을 함께 이해하는 일이에요. 이번 호에서는 작게 시도하고 빨리 배우는 팀의 세 가지 습관을 살펴봐요." },
      { title: "한 문장으로 합의하기", text: "회의를 시작하기 전에 오늘 결정할 질문을 한 문장으로 적어 보세요. ‘앞으로 무엇을 할까’보다 ‘이번 주에 누구에게 무엇을 보여 줄까’처럼 범위가 분명한 질문이 좋아요. 성수동의 6인 브랜딩 스튜디오는 이 문장을 회의실 화이트보드 맨 위에 적어 두고, 회의가 30분을 넘기면 그 문장부터 다시 읽어요." },
      { title: "완료보다 관찰을 공유하기", text: "진행 상황을 이야기할 때 끝낸 작업만 나열하면 서로 배우기 어려워요. 무엇을 예상했고 실제로 무엇을 보았는지 함께 적어 보세요. 빗나간 예상도 팀의 다음 선택에 도움이 되는 정보예요. 작은 관찰을 자주 나누면 큰 보고서를 기다릴 필요가 없어요." },
      { title: "작은 회고를 남기기", text: "금요일 오후 십 분을 정해 다음 주에도 이어 갈 일과 멈출 일을 하나씩 골라요. 반성을 많이 하는 것보다 실제로 바꿀 수 있는 작은 행동을 정하는 게 중요해요. 다음 회고에서는 그 행동을 해 보았는지부터 확인하세요." },
      { title: "이번 주의 질문", text: "우리 팀이 더 작게 시작할 수 있는 일은 무엇인가요? 결과물의 크기를 줄여도 배우려던 질문은 그대로 남을 수 있어요. 이번 주에는 그 질문을 함께 적어 보세요." },
    ],
  },
  {
    slug: "loose-structure",
    number: "005",
    title: "일정표에 빈칸을 남기는 팀",
    topic: "팀과 문화",
    date: issueDate(2),
    intro: "한 주를 회의로 꽉 채운 팀은 급한 일이 생길 때마다 다른 일을 밀어내요. 일부러 비워 둔 시간과, 이유를 잊은 규칙을 다시 보는 법이에요.",
    cover: "/images/issue-005.webp",
    coverAlt: "거의 빈 화이트보드 벽에 붉은 실 한 가닥이 느슨하게 걸린 회의실",
    sections: [
      { title: "계획표에 없는 시간", text: "모든 시간을 일정으로 채운 팀은 예상하지 못한 문제가 나타날 때마다 다른 일을 밀어내야 해요. 수요일 오후 두 시간을 아무 회의도 잡지 않는 시간으로 정해 두면, 급한 문의나 밀린 검토가 그 칸으로 들어가요. 한 달만 해 보고 무엇이 그 칸을 채웠는지 적어 보세요." },
      { title: "규칙의 목적을 기억하기", text: "규칙이 많아질수록 일은 안전해 보이지만 판단은 느려질 수 있어요. 지금의 규칙이 어떤 문제를 해결하려고 만들어졌는지 다시 확인해 보세요. 문제가 달라졌다면 규칙도 달라질 수 있어요." },
      { title: "이번 주의 질문", text: "반복하고 있지만 이유를 설명하기 어려운 회의나 보고가 있나요? 바로 없애기보다 한 번 쉬어 보고 무엇이 달라지는지 관찰해 보세요." },
    ],
  },
  {
    slug: "better-tools",
    number: "004",
    title: "도구를 바꾸기 전에 일을 먼저 본다",
    topic: "도구와 일",
    date: issueDate(4),
    intro: "새 협업 도구를 들이기 전에 지금 불편한 순간부터 적어 보는 법이에요. 한 프로젝트에서 2주만 써 보고 줄어든 시간을 재요.",
    cover: "/images/issue-004.webp",
    coverAlt: "나무 책상 위에서 내려다본 연필, 놋쇠 자, 종이학, 닫힌 공책",
    pull: "‘협업이 어렵다’보다 ‘최신 파일이 무엇인지 매번 물어본다’가 더 좋은 출발점이에요.",
    pullAfter: 0,
    sections: [
      { title: "새 도구를 고르기 전에", text: "새로운 도구를 도입하면 오래된 문제가 저절로 해결될 것처럼 느껴져요. 하지만 먼저 지금 불편한 순간을 구체적으로 적어 보아야 해요. ‘협업이 어렵다’보다 ‘최신 파일이 무엇인지 매번 물어본다’가 더 좋은 출발점이에요." },
      { title: "작은 범위에서 써 보기", text: "팀 전체의 방식을 한 번에 바꾸는 대신 하나의 프로젝트에서 2주만 시험해 보세요. 도구를 익히는 데 든 시간과 실제로 줄어든 시간을 함께 기록해요. 기능이 많은 것보다 반복되는 마찰을 줄이는 게 중요해요." },
      { title: "이번 주의 질문", text: "지금 쓰는 도구에서 한 가지 기능만 남긴다면 무엇을 고르겠나요? 그 답이 우리 팀에서 가장 중요한 흐름을 보여 줘요." },
    ],
  },
  {
    slug: "mindful-work",
    number: "003",
    title: "퇴근 전 5분, 일을 닫는 법",
    topic: "읽고 생각하기",
    date: issueDate(6),
    cover: "/images/issue-003.webp",
    coverAlt: "해 질 녘 창가 책상에서 공책을 덮는 손과 보리차 한 잔, 켜진 스탠드",
    intro: "몸은 퇴근했는데 머리는 계속 일하는 날이 있어요. 오늘 한 일과 내일 시작할 일을 적어 일을 닫는 방법, 쉬는 방식을 찾는 방법이에요.",
    sections: [
      { title: "마무리하는 시간", text: "퇴근 시간을 정하는 것과 일을 마무리하는 것은 조금 달라요. 끝내지 못한 일이 머릿속을 계속 맴돌면 몸은 쉬어도 마음은 일해요. 오늘 한 일과 내일 시작할 일을 짧게 적는 것으로 경계를 만들어 볼 수 있어요." },
      { title: "쉬는 방식도 다르다", text: "누군가에게는 운동이, 다른 누군가에게는 혼자 책을 읽는 시간이 회복이 돼요. 좋은 휴식의 정답을 찾기보다 어떤 활동 뒤에 마음이 조금 가벼워지는지 관찰해 보세요." },
      { title: "이번 주의 질문", text: "이번 주에 일을 잘하기 위해서가 아니라 나를 위해 남겨 둔 시간이 있었나요? 작은 시간이라도 달력에 먼저 적어 두어도 좋아요." },
    ],
  },
];

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-10-12" → "2026년 10월 12일 (월)". 파싱이 안 되면 원문 그대로. */
export function formatDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일 (${WEEKDAY[d.getDay()]})`;
}

/** "2026-11-23" → "11월 23일 월요일". 문장 속에 넣을 때 쓴다. */
export function formatShort(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${Number(m[2])}월 ${Number(m[3])}일 ${WEEKDAY[d.getDay()]}요일`;
}

/** "006" → "제6호" */
export const issueLabel = (number: string) => `제${Number(number) || number}호`;

/** 본문 글자 수로 어림한 읽는 시간(분). 한국어 1분 500자 기준. */
export const readMinutes = (i: Issue) => Math.max(1, Math.round([i.intro, ...i.sections.map(s => s.text)].join("").length / 500) + 2);

/** 주제 → 색(1~3 반복). 사진 없는 읽기 화면 머리에 쓴다. 카드 격자는 자리 순서로 라일락·무지·민트를 돌린다. */
export const tone = (topic: string) => (Math.max(0, topics.indexOf(topic) - 1) % 3) + 1;
