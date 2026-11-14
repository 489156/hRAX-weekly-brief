import { Link, useSearchParams } from "react-router";
import { ArrowDownToLine, ArrowUpRight, Check, BookOpen } from "lucide-react";
import { sourceCatalog, sourceReviewDate, modeLabel } from "../../shared/sources";

export function Sources() {
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode") ?? "all", group = params.get("group") ?? "전체", q = params.get("q") ?? "";
  const change = (key: string, value: string) => { const p = new URLSearchParams(params); value && value !== "all" && value !== "전체" ? p.set(key, value) : p.delete(key); setParams(p, { preventScrollReset: true, replace: key === "q" }); };
  const shown = sourceCatalog.filter(s => (mode === "all" || s.mode === mode) && (group === "전체" || s.group === group) && (!q || `${s.name} ${s.topics.join(" ")} ${s.strength}`.toLowerCase().includes(q.toLowerCase())));
  return <div className="frame">
    <section className="cell source-heading">
      <div><p className="eyebrow"><BookOpen size={16} aria-hidden />사이의 읽기 기준</p><h1 className="page-title">어디에서<br />변화를 읽을까</h1><p className="section-lede">많이 모으는 것보다, 무엇을 근거로 읽는지가 중요하니까요. 추천 가치와 자동으로 가져올 수 있는지는 따로 판단했어요.</p><a className="pill pill-line" href="/api/sources.csv" download><ArrowDownToLine size={16} aria-hidden />출처 조사표 내려받기</a></div>
      <aside className="source-principles"><h2>선별의 세 가지 기준</h2><ul>{["노동법은 공식 원문과 전문 해설을 함께", "HR은 제도보다 실행 맥락까지", "AI는 발표 사실과 실제 활용을 구분"].map(t => <li key={t}><Check size={18} aria-hidden /><span>{t}</span></li>)}</ul><p>조사 기준일 {sourceReviewDate}<br />발행처 안내와 최근 공개 목록에 근거한 단면 조사예요. 평가는 편집 판단이며 지속적인 품질 보증은 아니에요.</p></aside>
    </section>
    <div className="source-counts">{[["조사한 출처", sourceCatalog.length], ["정기 수집 대상", sourceCatalog.filter(s => s.mode === "auto").length], ["수동 확인", sourceCatalog.filter(s => s.mode === "manual").length]].map(([label, count], n) => <div className={`cell tone-${n + 1}`} key={label}><span>{label}</span><strong>{count}<small>곳</small></strong></div>)}</div>
    <section className="cell source-filters" aria-label="출처 찾기">
      <div className="chips" role="group" aria-label="수집 방식">{[["all", "전체 출처"], ["auto", "정기 수집 대상"], ["manual", "수동 확인"], ["hold", "수집 보류"]].map(([value, label]) => <button className="chip" key={value} aria-pressed={mode === value} onClick={() => change("mode", value)}>{label}</button>)}</div>
      <div className="source-search"><label>분야<select name="group" aria-label="분야" value={group} onChange={e => change("group", e.target.value)}>{["전체", "노동법", "HR", "AI", "AX", "개발"].map(t => <option key={t}>{t}</option>)}</select></label><label>출처 검색<input type="search" name="source-search" autoComplete="off" placeholder="예: 노동법, AIHR…" value={q} onChange={e => change("q", e.target.value)} /></label></div>
      <p className="sub-note">정기 수집 대상도 매회 접근·날짜·본문을 다시 확인해요. 막히거나 유료인 자료는 건너뛰며, 전체 후보를 매주 무제한으로 수집하지 않아요.</p>
    </section>
    <div className="cell source-result-count" role="status">{shown.length}곳의 출처</div>
    <div className="source-list">{shown.map(s => <article className="cell source-entry" key={s.id}>
      <div className="source-entry-top"><span className="tag">{s.group}</span><span className={`source-mode source-mode-${s.mode}`}>{modeLabel[s.mode]}</span></div>
      <h2><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}<ArrowUpRight size={19} aria-hidden /><span className="sr-only"> (새 창)</span></a></h2>
      <p className="source-kind">{s.kind} · {s.cadence}</p><p>{s.strength}</p>
      <details><summary>선정 이유와 확인 범위<span aria-hidden>＋</span></summary><dl><div><dt>편집 판단</dt><dd>{s.recommendation === "필수" ? "우선 읽을 출처" : s.recommendation === "보완" ? "관점을 넓힐 보완 출처" : "지금은 수집하지 않는 후보"}</dd></div><div><dt>최근 발행 근거</dt><dd>{s.recent}</dd></div><div><dt>접근 범위</dt><dd>{s.access}</dd></div><div><dt>직접 확인한 것</dt><dd>{s.evidence.startsWith("https://") ? <a href={s.evidence} target="_blank" rel="noopener noreferrer">발행처의 간행물 안내 ↗</a> : s.evidence}</dd></div><div><dt>주의할 한계</dt><dd>{s.limitation}</dd></div></dl>{s.feed && <a className="text-link" href={s.feed} target="_blank" rel="noopener noreferrer">{s.id === "github-trending" ? "공식 주간 목록" : "제공된 피드"} 열기<ArrowUpRight size={14} aria-hidden /><span className="sr-only"> (새 창)</span></a>}</details>
    </article>)}</div>
    {!shown.length && <div className="cell empty-cell"><p>조건에 맞는 출처가 없어요.</p><button className="pill pill-line" onClick={() => setParams({})}>전체 출처 보기</button></div>}
    <footer className="cell source-footer"><h2 className="section-title sm">출처는 출발점, 판단은 따로</h2><p>원문의 권리는 발행처에 있어요. 공개 자료의 짧은 요약과 실무 해석만 게시하며, 원문 전체를 재배포하거나 로그인·유료벽·수집 제한을 우회하지 않아요.</p><Link className="text-link" to="/archive">출처와 함께 글 읽기</Link></footer>
  </div>;
}
