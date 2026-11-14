import { useEffect, useState } from "react";
import type { Issue } from "../../shared/publication";
import { api } from "./api";

type IssueList = { issues: Issue[]; total: number; hasMore: boolean };
export function useIssues(topic = "전체") {
  const [data, setData] = useState<IssueList>({ issues: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [version, setVersion] = useState(0), [moreBusy, setMoreBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    api<IssueList>(`/api/issues?topic=${encodeURIComponent(topic)}`, { signal: controller.signal }).then(setData).catch(() => { if (!controller.signal.aborted) setError("글 목록을 불러오지 못했어요. 다시 시도해 주세요."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [topic, version]);
  async function loadMore() {
    if (moreBusy) return;
    setMoreBusy(true); setError("");
    try { const next = await api<IssueList>(`/api/issues?topic=${encodeURIComponent(topic)}&offset=${data.issues.length}`); setData(prev => ({ ...next, issues: [...prev.issues, ...next.issues.filter(i => !prev.issues.some(x => x.slug === i.slug))] })); }
    catch { setError("다음 글을 불러오지 못했어요. 다시 눌러 주세요."); }
    finally { setMoreBusy(false); }
  }
  return { ...data, loading, error, retry: () => setVersion(x => x + 1), loadMore, moreBusy };
}
export function useIssue(slug: string | undefined) {
  const [issue, setIssue] = useState<Issue | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setIssue(null); setError("");
    api<{ issue: Issue }>(`/api/issues/${encodeURIComponent(slug ?? "")}`, { signal: controller.signal }).then(r => setIssue(r.issue)).catch((e: unknown) => { if (!controller.signal.aborted && !(e && typeof e === "object" && "status" in e && e.status === 404)) setError("글을 불러오지 못했어요. 다시 시도해 주세요."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug, version]);
  return { issue, loading, error, retry: () => setVersion(x => x + 1) };
}
