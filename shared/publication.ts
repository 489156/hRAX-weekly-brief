export type Source = { id: string; publisher: string; title: string; url: string; date: string; kind: string };
export type IssueSection = {
  title: string; text: string; category?: string; status?: string; paragraphs?: string[];
  flow?: { caption: string; steps: { title: string; detail: string }[] };
  matrix?: { caption: string; columns: string[]; rows: string[][] };
  checklist?: string[]; prompt?: string; interpretation?: string; limit?: string; sourceIds?: string[];
};
export type Issue = {
  slug: string; number: string; title: string; topic: string; date: string; intro: string;
  cover?: string; coverAlt?: string; sample?: boolean; tags?: string[]; author?: string;
  checkedAt?: string; sources?: Source[]; minutes?: number; originalDateLabel?: string;
  highlights?: { category: string; status: string; text: string }[];
  pull?: string; pullAfter?: number; sections: IssueSection[];
};
export type EditorialRun = {
  id: string; run_key: string; kind: string; state: string; target: number;
  created_at: string; finished_at: string | null; message: string; published_count: number;
};
export type Candidate = {
  id: string; run_id: string; source_id: string; url: string; url_hash: string; title_hash: string;
  original_title: string; original_date: string; date_label: string; topic: string;
  score: number; state: string; reason: string; selected: number; lease_until: number;
  draft_json: string | null; evidence_json: string | null;
};
export type SourceResult = { source_id: string; state: string; found: number; accepted: number; message: string };
export type RunDetail = {
  run: EditorialRun; sources: SourceResult[];
  candidates: Omit<Candidate, "draft_json" | "evidence_json" | "lease_until" | "url_hash" | "title_hash">[];
};
export const stateLabel: Record<string, string> = {
  collecting: "수집 중", ready: "수집 완료", drafting: "요약 중", drafted: "요약 검증 통과",
  published: "게시 완료", held: "발행 보류", failed: "다시 확인 필요", skipped: "제외",
  duplicate: "이미 게시한 원문", candidate: "수집 후보", selected: "선별 완료", fetching: "확인 중",
};
