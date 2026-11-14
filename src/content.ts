// 사이트 문구의 단일 출처. 글은 실제 수집·검증 후 저장한 자료만 게시한다.
import { topics } from "./topics";
import type { Issue } from "../shared/publication";
export type { Source, IssueSection, Issue } from "../shared/publication";
export { topics };

export const content = {
  title: "사이",
  latin: "SAI",
  headline: ["사람을 이해하고,", "일의 변화를 읽다"],
  description: "노동법과 HR의 기준부터 AI를 일에 적용하는 방법까지. 원문을 확인하고, 실무에서 판단할 거리를 모아요.",
  readers: "어떤 소식인지보다, 우리 일에 무엇을 바꿔야 하는지 묻습니다.",
  readersNote: "노동법 · HR · AI · AX · 개발 동향",
  editor: "사이",
  cadence: "매주 화요일",
  sendTime: "오전 10:00 · 대한민국 시간",
  benefits: ["노동법·인사·노무의 변화", "조직과 사람에 관한 HR 인사이트", "AI·AX의 실제 업무 적용", "GitHub에서 살펴보는 도구와 기술", "직접 확인할 수 있는 원문과 발행일", "사실과 해석, 확인하지 못한 부분의 구분"],
  subscribeNote: "이메일과 관심 주제를 저장해요. 관리 링크로 언제든 구독을 취소할 수 있어요.",
  inlineSubscribeTitle: "여기까지 읽으셨다면",
  inlineSubscribeText: "HR과 AI의 다음 변화를 함께 읽어요. 관심 주제를 남겨 주세요.",
};

export const formatDate = (date: string) => new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(`${date.slice(0, 10)}T12:00:00+09:00`));
export const formatShort = (date: string) => new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(`${date.slice(0, 10)}T12:00:00+09:00`));
export const issueLabel = (number: string) => `글 ${Number(number)}`;
export const readMinutes = (issue: Issue) => issue.minutes ?? Math.max(1, Math.ceil([issue.intro, ...issue.sections.map(s => [s.text, ...(s.paragraphs ?? []), ...(s.checklist ?? [])].join(" "))].join(" ").length / 500));
export const tone = (topic: string) => topic === "노동법" || topic === "노무" ? 1 : topic === "AI" || topic === "AX" ? 3 : 2;
