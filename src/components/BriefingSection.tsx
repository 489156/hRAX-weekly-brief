import { useState, type CSSProperties } from "react";
import { Check, Copy } from "lucide-react";
import type { IssueSection, Source } from "../content";

export function BriefingSection({ section: s, index, sources = [] }: { section: IssueSection; index: number; sources?: Source[] }) {
  const [copyState, setCopyState] = useState("");
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(s.prompt ?? ""); setCopyState("요청문을 복사했어요."); }
    catch { setCopyState("복사하지 못했어요. 아래 요청문을 선택해 복사해 주세요."); }
  }
  return <section className={`prose${s.category ? " briefing-section" : ""}`} id={`part-${index}`}>
    {s.category && <div className="brief-category">{s.category}<span>{s.status}</span></div>}
    <h2>{s.title}</h2>
    <p>{s.text}</p>
    {s.paragraphs?.map(p => <p key={p}>{p}</p>)}
    {s.flow && <figure className="brief-flow">
      <figcaption>{s.flow.caption}</figcaption>
      <ol style={{ "--steps": s.flow.steps.length } as CSSProperties}>{s.flow.steps.map((step, n) => <li key={step.title}>
        <span className="flow-order" aria-hidden>{n + 1}</span><strong>{step.title}</strong><span>{step.detail}</span>
      </li>)}</ol>
    </figure>}
    {s.prompt && <aside className="brief-prompt" aria-label="회의에서 사용할 요청문 예시">
      <div><h3>바로 써 볼 요청문</h3><button type="button" className="pill pill-line" onClick={copyPrompt}><Copy size={14} aria-hidden />요청문 복사</button></div>
      <p>{s.prompt}</p><p className="brief-copy-status" role="status">{copyState}</p>
    </aside>}
    {s.matrix && <figure className="brief-matrix">
      <figcaption>{s.matrix.caption}</figcaption>
      <div className="brief-table-wrap" tabIndex={0} role="region" aria-label={`${s.title} 비교표, 좁은 화면에서는 좌우로 이동할 수 있어요`}>
        <table><thead><tr>{s.matrix.columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
          <tbody>{s.matrix.rows.map(row => <tr key={row[0]}>{row.map((cell, n) => n === 0 ? <th key={n} scope="row">{cell}</th> : <td key={n}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div><span className="table-scroll-hint">표가 잘리면 좌우로 움직여 읽어 보세요.</span>
    </figure>}
    {s.checklist && <aside className="brief-actions" aria-label="실무 점검 제안"><h3>지금 점검할 일 <span>편집실 제안</span></h3><ul>{s.checklist.map(item => <li key={item}><Check size={17} aria-hidden /><span>{item}</span></li>)}</ul></aside>}
    {s.interpretation && <div className="brief-note"><strong>실무 해석</strong><p>{s.interpretation}</p></div>}
    {s.limit && <div className="brief-limit"><strong>확인 범위와 한계</strong><p>{s.limit}</p></div>}
    {s.sourceIds && <nav className="brief-refs" aria-label={`${s.title} 근거`}>근거 {s.sourceIds.map(id => { const n = sources.findIndex(x => x.id === id); return n < 0 ? null : <a key={id} href={`#source-${id}`}>[{n + 1}] {sources[n].publisher}</a>; })}</nav>}
  </section>;
}
