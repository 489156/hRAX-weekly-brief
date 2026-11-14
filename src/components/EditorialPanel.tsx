import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { ownerApi, ownerToken } from "../lib/admin";
import type { EditorialRun, RunDetail } from "../../shared/publication";
import { stateLabel } from "../../shared/publication";

type Status = { runs: EditorialRun[]; sources: { id: string; name: string }[]; schedule: { configured: boolean; repository: string; cadence: string; note: string } };
const displayTime = (value: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

async function streamDraft(path: string, update: (text: string) => void) {
  const response = await fetch(path, { method: "POST", headers: { authorization: `Bearer ${encodeURIComponent(ownerToken())}` } });
  if (!response.ok || !response.body) throw new Error("요약을 시작하지 못했어요. 관리 화면을 다시 열어 주세요.");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", done = false;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      buffer += decoder.decode(part.value, { stream: true });
      const blocks = buffer.replace(/\r\n/g, "\n").split("\n\n"); buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        const raw = block.split("\n").find(x => x.startsWith("data:"))?.slice(5).trim();
        if (!raw) continue;
        const data = JSON.parse(raw) as { stage?: string; characters?: number; error?: string };
        if (/^event: failed/m.test(block)) throw new Error(data.error ?? "요약 기준을 통과하지 못했어요.");
        if (/^event: done/m.test(block)) done = true;
        if (data.stage) update(`${data.stage}${data.characters ? ` (${data.characters.toLocaleString("ko-KR")}자 작성)` : ""}`);
      }
    }
  } finally { reader.releaseLock(); }
  if (!done) throw new Error("진행 표시가 끊겼어요. 이력을 새로고침해 저장 여부를 확인해 주세요.");
}

export function EditorialPanel() {
  const [status, setStatus] = useState<Status | null>(null), [detail, setDetail] = useState<RunDetail | null>(null);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [notice, setNotice] = useState("");
  const [progress, setProgress] = useState(""), [target, setTarget] = useState(5);
  const [step, setStep] = useState(0), [steps, setSteps] = useState(1);
  async function refresh(id?: string) {
    const result = await ownerApi<Status>("/api/admin/editorial/status"); setStatus(result);
    const selected = id ?? detail?.run.id ?? result.runs[0]?.id;
    if (selected) setDetail(await ownerApi<RunDetail>(`/api/admin/editorial/runs/${selected}`));
  }
  useEffect(() => { let active = true; ownerApi<Status>("/api/admin/editorial/status").then(async result => { if (!active) return; setStatus(result); if (result.runs[0]) { const data = await ownerApi<RunDetail>(`/api/admin/editorial/runs/${result.runs[0].id}`); if (active) setDetail(data); } }).catch(() => { if (active) setNotice("발행 이력을 불러오지 못했어요. 새로고침해 주세요."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  async function exclude(id: string) {
    if (!detail || busy || !confirm("이번 회차에서 이 후보를 제외할까요? 아직 공개하지 않은 요약도 함께 지워요.")) return;
    try { await ownerApi(`/api/admin/editorial/runs/${detail.run.id}/exclude/${id}`, { method: "POST", body: "{}" }); await refresh(detail.run.id); }
    catch { setNotice("후보를 제외하지 못했어요. 이력을 새로고침해 다시 확인해 주세요."); }
  }
  async function execute(kind: "weekly" | "trial") {
    if (busy || !status) return;
    setBusy(true); setNotice(""); setStep(0); setSteps(status.sources.length + target + 2); setProgress("같은 회차의 이전 작업부터 확인해요.");
    let runId = "";
    try {
      const { run } = await ownerApi<{ run: EditorialRun }>("/api/admin/editorial/start", { method: "POST", body: JSON.stringify({ kind, target }) }); runId = run.id;
      if (run.state === "published") { setNotice("이미 게시한 회차예요. AI를 다시 부르거나 글을 추가하지 않았어요."); return; }
      for (const [n, source] of status.sources.entries()) {
        setProgress(`${source.name}의 공개 목록을 확인해요.`); setStep(n);
        await ownerApi(`/api/admin/editorial/runs/${run.id}/collect/${source.id}`, { method: "POST" });
      }
      const selected = await ownerApi<RunDetail>(`/api/admin/editorial/runs/${run.id}/select`, { method: "POST" }); setDetail(selected);
      const candidates = selected.candidates.filter(c => c.selected && c.state !== "published" && c.state !== "drafted");
      setSteps(status.sources.length + candidates.length + 2); setStep(status.sources.length + 1);
      let failed = 0;
      for (const [n, candidate] of candidates.entries()) {
        setProgress(`${n + 1}/${candidates.length} · ${candidate.original_title}`);
        try { await streamDraft(`/api/admin/editorial/runs/${run.id}/draft/${candidate.id}`, text => setProgress(`${n + 1}/${candidates.length} · ${text}`)); }
        catch { failed++; }
        setStep(status.sources.length + n + 2);
      }
      const result = await ownerApi<{ run: EditorialRun }>(`/api/admin/editorial/runs/${run.id}/publish`, { method: "POST" });
      setNotice(`${result.run.message}${failed ? ` ${failed}건은 확인 기준을 통과하지 못했으며 아래에 사유를 남겼어요.` : ""}`);
    } catch (e) { setNotice(e instanceof Error ? e.message : "작업을 마치지 못했어요. 같은 회차를 다시 실행하면 완료된 단계는 유지해요."); }
    finally { setBusy(false); setProgress(""); if (runId) await refresh(runId).catch(() => setNotice("이력을 새로고침해 결과를 확인해 주세요.")); }
  }
  return <section id="editorial" className="editorial-panel" aria-labelledby="editorial-title">
    <div className="cell editorial-heading"><div><h2 id="editorial-title" className="section-title">수집과 발행</h2><p className="section-lede">공개 원문을 읽고, 확인 사실과 편집 제안을 나눈 뒤 한 회차로 게시해요.</p></div><Link className="pill pill-line" to="/sources">출처 모음<ArrowUpRight size={15} aria-hidden /></Link></div>
    <div className="editorial-split">
      <div className="cell tone-1 editorial-schedule"><h3>화요일의 읽을거리</h3><strong>{status?.schedule.cadence ?? "매주 화요일 오전 10:00 · 대한민국 시간"}</strong><p>{status?.schedule.configured ? "허용할 저장소 정보가 준비됐어요. 자동 게시 활성화와 실제 실행 성공은 별도로 확인해 주세요." : "예약 실행은 아직 연결 전이에요. 저장소 선택과 게시 후 실행 확인이 남아 있어요."}</p><p className="sub-note">{status?.schedule.note} 이메일 자동 발송이 아니라 웹사이트의 새 글 게시예요.</p></div>
      <div className="cell editorial-controls"><h3>관리자가 직접 실행</h3><p>AI 요약을 만들고 검증된 새 글을 바로 게시해요. 같은 주간 회차와 원문은 다시 게시하지 않아요.</p><label htmlFor="publication-target">목표 글 수<select id="publication-target" value={target} onChange={e => setTarget(Number(e.target.value))} disabled={busy}>{Array.from({ length: 9 }, (_, n) => n + 2).map(n => <option key={n} value={n}>{n}개</option>)}</select></label><div className="admin-actions"><button className="pill pill-ink" onClick={() => execute("weekly")} disabled={busy || !status}>이번 주 수집·게시</button><button className="pill pill-line" onClick={() => execute("trial")} disabled={busy || !status}>오늘 시험 수집·게시</button></div><p className="sub-note">기본 5개 · 최소 2개, 최대 10개 · 같은 회차의 목표 수는 최초 실행값을 유지해요. 2개 미만이면 보류해요.</p></div>
    </div>
    {busy && <div className="cell editorial-progress" role="status" aria-live="polite"><strong>수집·요약을 진행하고 있어요</strong><progress max={steps} value={step} aria-label="발행 작업 진행" /><p>{progress}</p><p className="sub-note">이 탭을 유지해 주세요. 중단돼도 완료한 단계는 남고, 같은 작업으로 이어갈 수 있어요.</p></div>}
    {notice && <div className="cell editorial-notice" role="status">{notice}</div>}
    <div className="cell editorial-history"><div className="editorial-history-head"><h3>회차별 실행 이력</h3><button className="text-link" disabled={busy} onClick={() => refresh().catch(() => setNotice("이력을 불러오지 못했어요."))}><RefreshCw size={14} aria-hidden />이력 새로고침</button></div>
      {loading ? <p>이력을 불러오는 중이에요.</p> : !status?.runs.length ? <p>아직 실행한 발행 작업이 없어요.</p> : <div className="run-tabs" role="group" aria-label="발행 회차">{status.runs.map(r => <button key={r.id} aria-pressed={detail?.run.id === r.id} onClick={() => ownerApi<RunDetail>(`/api/admin/editorial/runs/${r.id}`).then(setDetail).catch(() => setNotice("회차를 열지 못했어요."))}><span>{r.kind === "trial" ? "시험" : "주간"} · {displayTime(r.created_at)}</span><strong>{stateLabel[r.state] ?? r.state} · {r.published_count}개</strong></button>)}</div>}
      {detail && <div className="run-detail"><div className="run-summary"><strong>{stateLabel[detail.run.state]} · 목표 {detail.run.target}개 / 게시 {detail.run.published_count}개</strong><p>{detail.run.message}</p>{detail.run.state === "published" && <Link className="text-link" to="/archive">게시한 글 보기</Link>}</div><details open><summary>출처별 수집 결과 · {detail.sources.length}곳</summary><ul className="source-results">{detail.sources.map(s => <li key={s.source_id}><div><strong>{status?.sources.find(x => x.id === s.source_id)?.name ?? s.source_id}</strong><span>{stateLabel[s.state]} · 새 후보 {s.accepted}건</span></div><p>{s.message}</p></li>)}</ul></details><details><summary>글 후보와 제외 사유 · {detail.candidates.length}건</summary><ul className="candidate-results">{detail.candidates.map(c => <li key={c.id}><span className="tag">{c.topic} · {stateLabel[c.state]}</span><a href={c.url} target="_blank" rel="noopener noreferrer">{c.original_title}<span className="sr-only"> (새 창)</span> ↗</a><p>{c.reason}</p><small>{c.date_label} · {displayTime(c.original_date)}</small>{detail.run.state !== "published" && !["skipped", "published", "drafting"].includes(c.state) && <button type="button" className="text-link danger" disabled={busy} onClick={() => exclude(c.id)}>이번 회차에서 제외</button>}</li>)}</ul></details></div>}
    </div>
  </section>;
}
