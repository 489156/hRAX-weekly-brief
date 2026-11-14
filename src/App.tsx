import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useParams, useSearchParams, ScrollRestoration, useNavigationType } from "react-router";
import { ArrowLeft, ArrowRight, Check, Clock, Copy, Link2 } from "lucide-react";
import { content, formatDate, issueLabel, readMinutes, tone, topics, type Issue as IssueT } from "./content";
import { api } from "./lib/api";
import { downloadCsv, ownerApi, ownerToken, setOwnerToken } from "./lib/admin";
import { BriefingSection } from "./components/BriefingSection";
import { useIssue, useIssues } from "./lib/publication";
const EditorialPanel = lazy(() => import("./components/EditorialPanel").then(m => ({ default: m.EditorialPanel })));

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const delay = (n: number) => ({ "--d": `${n * 80}ms` }) as CSSProperties;

/* ---------- 등장(.reveal): 첫 스크롤 뒤에만 html[data-reveal] 을 달아 숨김을 켜고, 화면에 들어온 칸에 data-seen 을 한 번 단다.
   스크롤 없이 보는 화면과 전체 캡처는 항상 온전하다. 모션 축소를 켠 사용자는 아무것도 숨기지 않는다. */
function useReveal() {
  useEffect(() => {
    if (reduced() || !("IntersectionObserver" in window)) return;
    const html = document.documentElement;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).dataset.seen = ""; io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    const observe = () => { for (const el of document.querySelectorAll<HTMLElement>(".reveal")) if (!("seen" in el.dataset)) io.observe(el); };
    const arm = () => { html.dataset.reveal = ""; observe(); removeEventListener("scroll", arm); };
    addEventListener("scroll", arm, { passive: true });
    const mo = new MutationObserver(() => { if ("reveal" in html.dataset) observe(); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); removeEventListener("scroll", arm); delete html.dataset.reveal; };
  }, []);
}

/* ---------- 구독 폼: 서버가 저장을 확인한 뒤에만 완료를 보여 준다. dark 는 검은 칸 안에서 쓴다 ---------- */
function Subscribe({ id = "subscribe", dark = false, compact = false }: { id?: string; dark?: boolean; compact?: boolean }) {
  const [email, setEmail] = useState(""), [topic, setTopic] = useState("전체"), [consent, setConsent] = useState(false);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [copied, setCopied] = useState(false);
  const emailField = useRef<HTMLInputElement>(null), consentField = useRef<HTMLInputElement>(null);
  const [done, setDone] = useState<{ token?: string; message: string } | null>(null);
  const manage = done?.token ? `${location.origin}/unsubscribe#token=${done.token}` : "";
  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("이메일 주소를 확인해 주세요"); emailField.current?.focus(); return; }
    if (!consent) { setError("이메일 저장에 동의해 주세요"); consentField.current?.focus(); return; }
    setBusy(true);
    try { setDone(await api<{ token?: string; message: string }>("/api/subscribe", { method: "POST", body: JSON.stringify({ email, topic, consent }) })); }
    catch (err) { setError(err instanceof Error ? err.message : "저장하지 못했어요"); }
    finally { setBusy(false); }
  }
  const cls = `sub${dark ? " sub-dark" : ""}${compact ? " sub-compact" : ""}`;
  if (done) return (
    <div className={`${cls} sub-done`} role="status">
      <p className="sub-done-title"><span className="tick"><Check size={16} strokeWidth={3} aria-hidden /></span>{done.message}</p>
      <p>{done.token ? "관심 주제와 이메일을 저장했어요." : "이미 신청한 주소라면 기존 이메일과 관심 주제를 그대로 유지해요."}</p>
      {manage && <>
        <p>구독을 취소할 때 쓰는 링크예요. 복사해 두세요. (다시 보여 드리지 않아요)</p>
        <div className="sub-manage">
          <button type="button" className="pill pill-line" onClick={async () => { try { await navigator.clipboard.writeText(manage); setCopied(true); } catch { setError("복사하지 못했어요. 옆의 링크를 길게 눌러 보관해 주세요."); } }}><Copy size={15} aria-hidden />{copied ? "복사했어요" : "관리 링크 복사"}</button>
          <a className="text-link" href={manage}>구독 관리</a>
        </div>
      </>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
  return (
    <form className={cls} onSubmit={submit} noValidate aria-busy={busy}>
      <div className="sub-row">
        <label className="sub-label" htmlFor={`${id}-email`}>새 글을 받을 이메일 *</label>
        <input ref={emailField} id={`${id}-email`} name="email" type="email" aria-label="이메일" required autoComplete="email" spellCheck={false} maxLength={160} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} placeholder="예: name@example.com…" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} />
        <button className="pill pill-grad" disabled={busy}>{busy ? <><span className="spin" aria-hidden />저장 중…</> : "구독 신청"}</button>
      </div>
      <div className="sub-extra">
        <label className="sub-topic">관심 주제<select name="topic" aria-label="관심 주제" value={topic} onChange={e => setTopic(e.target.value)}>{topics.map(t => <option key={t}>{t}</option>)}</select></label>
        <label className="sub-consent"><input ref={consentField} name="consent" type="checkbox" checked={consent} aria-describedby={error ? `${id}-error` : undefined} onChange={e => { setConsent(e.target.checked); setError(""); }} />이메일·관심 주제 저장에 동의해요. 구독을 취소하면 삭제돼요.</label>
      </div>
      {error && <p id={`${id}-error`} className="error" role="alert">{error}</p>}
    </form>
  );
}

/* ---------- 호 카드: 주제 색 그라데이션 칸. 사진이 있으면 위에 얹는다 ---------- */
function IssueCard({ issue, photo = false, n = 0 }: { issue: IssueT; photo?: boolean; n?: number }) {
  return (
    <Link to={`/issues/${issue.slug}`} className={`cell card tone-${(n % 3) + 1} reveal`} style={delay(n)} aria-label={`${issueLabel(issue.number)} ${issue.title}`}>
      {photo && (issue.cover
        ? <img className="card-photo" src={issue.cover} alt="" width={1600} height={900} loading="lazy" decoding="async" />
        : <div className="card-photo card-photo-none" aria-hidden><span>{issueLabel(issue.number)}</span></div>)}
      <div className="card-body">
        <p className="kicker"><span className="no">No.{issue.number}</span>{issue.topic}<span className="sample-tag">{issue.sample ? "예시" : "출처 수록"}</span></p>
        <h3>{issue.title}</h3>
        <p className="excerpt">{issue.intro}</p>
        <p className="card-foot"><span><Clock size={14} aria-hidden />{readMinutes(issue)}분 · {formatDate(issue.date)}</span><span className="go">읽기<ArrowRight size={14} aria-hidden /></span></p>
      </div>
    </Link>
  );
}

/* ---------- 홈: 머리 칸(제목 + 독자 + 최신 호 사진) → 구독 띠 → 최근 세 호 → 받는 것 → 편집장 → 검은 구독 칸 ---------- */
export function Home() {
  const [search, setSearch] = useSearchParams();
  const topic = topics.includes(search.get("topic") ?? "") ? search.get("topic")! : "전체";
  const setTopic = (value: string) => setSearch(value === "전체" ? {} : { topic: value }, { preventScrollReset: true });
  const { issues: filtered, total, loading, error, retry, hasMore, loadMore, moreBusy } = useIssues(topic);
  const latest = filtered[0];
  return (
    <div className="frame">
      <div className="hero-grid">
        <section className="cell hero-main" aria-labelledby="hero-title">
          <p className="eyebrow rise" style={delay(0)}><span className="dot" aria-hidden />HR과 AI를 잇는 인사이트</p>
          <h1 id="hero-title" className="hero-title rise" style={delay(1)}>{content.headline.map(l => <span key={l}>{l}</span>)}</h1>
          <p className="hero-lede rise" style={delay(2)}>{content.description}</p>
          <Link to="/archive" className="text-link rise" style={delay(3)}>전체 글 둘러보기<ArrowRight size={16} aria-hidden /></Link>
        </section>
        <div className="hero-side">
          <div className="cell hero-proof rise" style={delay(2)}>
            <p className="proof">{content.readers}</p>
            <p className="proof-note">{content.readersNote}</p>
          </div>
           {latest ? <Link to={`/issues/${latest.slug}`} className={`cell hero-photo${latest.cover ? "" : ` hero-editorial tone-${tone(latest.topic)}`}`} aria-label={`새 글 읽기 · ${latest.title}`}>
             {latest.cover ? <img src={latest.cover} alt="" width={1600} height={900} decoding="async" fetchPriority="high" /> : <span className="hero-editorial-mark" aria-hidden>사이</span>}
            <span className="hero-photo-text">
               <span className="hero-photo-kicker">새 글 읽기 · {latest.topic}</span>
              <span className="hero-photo-title">{latest.title}</span>
            </span>
           </Link> : <div className="cell tone-3"><h2 className="section-title sm">{loading ? "새 글을 불러와요" : "새로운 지면을 준비해요"}</h2><p className="section-lede">원문을 확인한 노동법·HR·AI 콘텐츠를 이곳에 게시해요.</p><Link to="/sources" className="text-link">사이의 출처 모음</Link></div>}
        </div>
      </div>
      <section className="cell sub-band" id="subscribe" aria-label="구독 신청">
        <Subscribe id="hero" />
        <p className="sub-note">{content.subscribeNote}</p>
      </section>
      <section aria-labelledby="recent-title" className="recent">
        <div className="cell archive-intro">
          <div className="archive-heading"><h2 id="recent-title" className="section-title">전체 글</h2><span className="count" aria-live="polite">{loading ? "불러오는 중" : `${total}개의 글`}</span></div>
          <p className="section-lede">지금 관심 있는 주제부터 골라 읽어 보세요.</p>
          <div role="group" aria-label="호별 주제" className="chips">{topics.map(t => <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{t}</button>)}</div>
        </div>
        <div className="card-grid card-grid-2">
          {filtered.map((i, n) => <IssueCard key={i.slug} issue={i} n={n} />)}
        </div>
        {error ? <div className="cell empty-cell" role="alert"><p>{error}</p><button className="pill pill-line" onClick={retry}>다시 불러오기</button></div> : !loading && !filtered.length && <div className="cell empty-cell"><p>이 주제로 게시한 글이 아직 없어요. 검증한 새 콘텐츠를 준비하고 있어요.</p></div>}
        {hasMore && <div className="cell more-cell"><button className="pill pill-line" disabled={moreBusy} onClick={loadMore}>{moreBusy ? "불러오는 중…" : "글 더 보기"}</button></div>}
      </section>
      <section className="cell benefits" aria-labelledby="benefits-title">
        <div>
          <h2 id="benefits-title" className="section-title">사이에서 함께 읽을 것</h2>
          <p className="section-lede">법과 제도의 기준, 사람에 대한 이해, 새로운 도구를 함께 살펴요.</p>
          <Link to="/archive" className="text-link">게시한 글 모두 보기<ArrowRight size={15} aria-hidden /></Link>
        </div>
        <ul className="checks">
          {content.benefits.map((b, n) => <li key={b} className="reveal" style={delay(n)}><span className={`tick tick-${(n % 6) + 1}`}><Check size={15} strokeWidth={3} aria-hidden /></span>{b}</li>)}
        </ul>
      </section>
      <section className="cell cta" aria-labelledby="cta-title">
        <h2 id="cta-title" className="section-title">다음 변화를 함께 읽어요</h2>
        <p className="cta-lede">관심 주제를 남겨 주세요.</p>
        <Subscribe id="cta" dark />
      </section>
      <Colophon />
    </div>
  );
}

/* ---------- 지난 호: 주제 칩으로 거르는 카드 격자 ---------- */
export function Archive() {
  const [search, setSearch] = useSearchParams();
  const topic = topics.includes(search.get("topic") ?? "") ? search.get("topic")! : "전체";
  const setTopic = (value: string) => setSearch(value === "전체" ? {} : { topic: value }, { preventScrollReset: true });
  const { issues: filtered, total, loading, error, retry, hasMore, loadMore, moreBusy } = useIssues(topic);
  return (
    <div className="frame">
      <section className="cell page-head" aria-labelledby="archive-title">
        <div>
          <h1 id="archive-title" className="page-title">전체 글</h1>
          <p className="count" aria-live="polite">{loading ? "불러오는 중…" : `${total}개의 이야기`}</p>
          <p className="sub-note">노동법·HR·AI, 원문에서 확인한 내용을 실무 관점으로 읽어요.</p>
        </div>
        <div role="group" aria-label="호별 주제" className="chips">
          {topics.map(t => <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{t}</button>)}
        </div>
      </section>
      {error ? <div className="cell empty-cell" role="alert"><p>{error}</p><button className="pill pill-line" onClick={retry}>다시 불러오기</button></div> : loading ? <div className="cell empty-cell" role="status">글을 불러오는 중이에요.</div> : filtered.length
        ? <div className="card-grid card-grid-2">
            {filtered.map((i, n) => <IssueCard key={i.slug} issue={i} photo n={n} />)}
          </div>
        : <div className="cell empty-cell"><p>이 주제의 이야기가 아직 없어요.</p><button type="button" className="pill pill-line" onClick={() => setTopic("전체")}>전체 보기</button></div>}
      {hasMore && <div className="cell more-cell"><button className="pill pill-line" disabled={moreBusy} onClick={loadMore}>{moreBusy ? "불러오는 중…" : "글 더 보기"}</button></div>}
      <Colophon />
    </div>
  );
}

/* ---------- 읽기 화면: 고정 진행 띠, 사진 머리, 목차, 뽑은 문장, 60% 지점의 구독 ---------- */
function useReadingProgress(article: React.RefObject<HTMLElement | null>, key: string | undefined) {
  const [pct, setPct] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = article.current; if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = el.getBoundingClientRect().top + window.scrollY, h = el.offsetHeight, vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / Math.max(1, h - vh)));
      document.documentElement.style.setProperty("--progress", p.toFixed(4));
      setPct(Math.round(p * 100));
      setStarted(window.scrollY > top + 120);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => { removeEventListener("scroll", schedule); removeEventListener("resize", schedule); if (frame) cancelAnimationFrame(frame); document.documentElement.style.removeProperty("--progress"); };
  }, [article, key]);
  return { pct, started };
}

export function Issue() {
  const { slug } = useParams();
  const { issue: i, loading, error, retry } = useIssue(slug);
  const { issues } = useIssues();
  const article = useRef<HTMLElement>(null);
  const { pct, started } = useReadingProgress(article, i?.slug);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (i) document.title = `${i.title} | 사이`; }, [i]);
  if (loading) return <div className="frame"><div className="cell empty-cell" role="status">글을 불러오는 중이에요.</div></div>;
  if (error) return <div className="frame"><div className="cell empty-cell" role="alert"><p>{error}</p><button className="pill pill-line" onClick={retry}>다시 불러오기</button></div></div>;
  if (!i) return <div className="frame"><div className="cell empty-cell"><h1 className="page-title">글을 찾을 수 없어요.</h1><p>기존 글은 정리되었거나 공개되지 않은 글이에요.</p><Link className="pill pill-line" to="/archive">전체 글 보기</Link></div><Colophon /></div>;
  const cut = Math.max(1, Math.round(i.sections.length * 0.6)); // 60% 지점: 이 수만큼 읽은 뒤 구독이 끼어든다
  const others = issues.filter(x => x.slug !== i.slug).slice(0, 2);
  const copy = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* 복사 권한이 없으면 주소창을 쓰면 된다 */ } };
  return (
    <>
      <div className="reader-bar" data-started={started ? "" : undefined}>
        <div className="reader-in">
          <Link className="crumb" to="/archive"><ArrowLeft size={15} aria-hidden />전체 글</Link>
          <span className="now" aria-hidden>{i.title}</span>
          <span className="pct" aria-label={`읽기 진행 ${pct}%`}>{pct}%</span>
        </div>
        <div className="reader-progress" aria-hidden />
      </div>
      <article className="frame frame-read" ref={article} aria-labelledby="issue-title">
        <header className={`cell read-hero tone-${tone(i.topic)}${i.cover ? " has-photo" : ""}${i.highlights ? " read-briefing" : ""}`}>
          {i.cover && <img src={i.cover} alt={i.coverAlt ?? ""} width={1600} height={900} decoding="async" fetchPriority="high" />}
          <div className="read-hero-text">
            <p className="kicker rise" style={delay(0)}><span className="no">No.{i.number}</span>{i.topic} · 약 {readMinutes(i)}분<span className="sample-tag">{i.sample ? "예시" : "출처 수록"}</span></p>
            <h1 id="issue-title" className="read-title rise" style={delay(1)}>{i.title}</h1>
          </div>
        </header>
        <div className="cell byline">
          <div className="by-person">
            <p><b>{i.author ?? content.editor}</b><span>{formatDate(i.date)}{i.checkedAt && ` · 자료 확인 ${i.checkedAt}`}</span></p>
          </div>
          <button type="button" className="pill pill-soft" onClick={copy}><Link2 size={15} aria-hidden />{copied ? "주소를 복사했어요" : "링크 복사"}</button>
        </div>
        <div className="cell read-body">
          <p className="sample-notice">자료 확인 {i.checkedAt} · AI가 공개 원문을 요약하고 근거 문장을 대조했어요. 의미 해석의 오류는 남을 수 있어요. ‘실무 해석’과 ‘점검할 일’은 편집 제안이며 법률 자문이 아니에요.</p>
          <p className="dropcap">{i.intro}</p>
          {i.highlights && <section className="brief-overview" aria-labelledby="overview-title"><h2 id="overview-title">이번 호 한눈에</h2><div>{i.highlights.map((x, n) => <a href={`#part-${n}`} className={`tone-${n % 3 + 1}`} key={x.status}><span>{x.category}</span><strong>{x.status}</strong><p>{x.text}</p></a>)}</div></section>}
          <nav className="toc" aria-label="목차">
            <strong>이 글의 목차</strong>
            <ol>{i.sections.map((s, n) => <li key={s.title}><a href={`#part-${n}`}><span aria-hidden>{String(n + 1).padStart(2, "0")}</span>{s.title}</a></li>)}</ol>
          </nav>
          {i.sections.map((s, n) => (
            <div key={s.title}>
              <BriefingSection section={s} index={n} sources={i.sources} />
              {i.pull && (i.pullAfter ?? 0) === n && <blockquote className="pull reveal"><p>{i.pull}</p><cite>{issueLabel(i.number)}에서</cite></blockquote>}
              {n + 1 === cut && n + 1 < i.sections.length && (
                <aside className="inline-sub" aria-labelledby="inline-sub-title">
                  <h2 id="inline-sub-title">{content.inlineSubscribeTitle}</h2>
                  <p>{content.inlineSubscribeText}</p>
                  <Subscribe id="inline" dark compact />
                </aside>
              )}
            </div>
          ))}
          {i.sources && <section className="brief-sources" aria-labelledby="sources-title"><h2 id="sources-title">원문 출처와 확인 기록</h2><p>{i.originalDateLabel}예요. 아래 원문의 시각은 UTC로 표시했어요. 사이트 게시일과 원문 날짜는 다를 수 있어요.</p><ol>{i.sources.map(source => <li id={`source-${source.id}`} key={source.id}><span>{source.kind} · {source.date}</span><strong>{source.publisher}</strong><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span className="sr-only"> (새 창)</span> ↗</a></li>)}</ol><p>법령과 제품 안내는 이후 변경될 수 있어요. 업무에 적용하기 전에 해당 시점의 공식 원문을 다시 확인해 주세요.</p><Link to="/sources" className="text-link">출처의 선정 이유와 한계 보기</Link></section>}
          <p className="read-end">{issueLabel(i.number)} 끝 · {i.author ?? content.editor}</p>
        </div>
      </article>
      <div className="frame">
        <section aria-labelledby="related-title">
          <h2 id="related-title" className="cell related-head">다른 글 읽기</h2>
          <div className="card-grid card-grid-2">{others.map((x, n) => <IssueCard key={x.slug} issue={x} n={n} />)}</div>
        </section>
        <Colophon />
      </div>
    </>
  );
}

export function SubscribePage() {
  return (
    <div className="frame">
      <div className="split">
        <section className="cell split-main" aria-labelledby="subscribe-title">
          <h1 id="subscribe-title" className="page-title rise" style={delay(0)}>「{content.title}」, 메일로 받아 보세요</h1>
          <p className="section-lede rise" style={delay(1)}>{content.description}</p>
          <Subscribe id="page" />
          <p className="sub-note">{content.subscribeNote}</p>
        </section>
        <aside className="cell split-side" aria-label="구독하면 받는 것">
          <ul className="checks">{content.benefits.map((b, n) => <li key={b}><span className={`tick tick-${(n % 6) + 1}`}><Check size={15} strokeWidth={3} aria-hidden /></span>{b}</li>)}</ul>
        </aside>
      </div>
      <Colophon />
    </div>
  );
}

export function Unsubscribe() {
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get("token") || "");
  const [done, setDone] = useState(false), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function cancel() {
    setBusy(true);
    try { await api("/api/unsubscribe", { method: "POST", body: JSON.stringify({ token }) }); setDone(true); history.replaceState(null, "", "/unsubscribe"); }
    catch (e) { setError(e instanceof Error ? e.message : "취소하지 못했어요"); }
    finally { setBusy(false); }
  }
  return (
    <div className="frame">
      <section className="cell narrow-cell">
        <h1 className="page-title">{done ? "구독 신청을 취소했어요." : "구독 관리"}</h1>
        {done ? <p role="status" className="section-lede">저장된 이메일과 관심 주제를 삭제했어요.</p>
          : token ? <><p className="section-lede">구독을 취소하면 저장된 이메일과 관심 주제가 삭제돼요.</p><button type="button" className="pill pill-ink" onClick={cancel} disabled={busy}>{busy ? "처리 중…" : "구독 취소"}</button></>
          : <p className="section-lede">신청 완료 화면에서 복사해 둔 구독 관리 링크로 열어 주세요. 링크를 잃어버렸다면 사이트 운영자에게 신청한 이메일을 알려 삭제를 요청해 주세요.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <Link to="/archive" className="text-link">전체 글 계속 읽기<ArrowRight size={15} aria-hidden /></Link>
      </section>
      <Colophon />
    </div>
  );
}

type Subscriber = { id: number; email: string; topic: string; created_at: string };
export function Admin() {
  const [rows, setRows] = useState<Subscriber[]>([]), [state, setState] = useState("loading"), [notice, setNotice] = useState("");
  const [q, setQ] = useState(""), [password, setPassword] = useState(""), [unlocking, setUnlocking] = useState(false);
  useEffect(() => {
    const load = () => {
      if (!ownerToken()) { setState("locked"); return; }
      ownerApi<{ rows: Subscriber[] }>("/api/admin/subscribers").then(r => { setRows(r.rows); setState("ready"); }).catch(() => setState("locked"));
    };
    load();
    addEventListener("hashchange", load);
    return () => removeEventListener("hashchange", load);
  }, []);
  async function unlock(e: FormEvent) {
    e.preventDefault();
    if (!password) { setNotice("관리자 비밀번호를 입력해 주세요."); return; }
    setUnlocking(true); setNotice(""); setOwnerToken(password);
    try {
      const result = await ownerApi<{ rows: Subscriber[] }>("/api/admin/subscribers");
      setRows(result.rows); setState("ready"); setPassword("");
    } catch {
      setOwnerToken(""); setNotice("관리자 비밀번호를 확인해 주세요. 아직 설정하지 않았다면 운영자가 먼저 설정해야 해요.");
    } finally { setUnlocking(false); }
  }
  async function remove(r: Subscriber) {
    if (!confirm(`${r.email} 의 구독 신청을 삭제할까요?`)) return;
    try { await ownerApi(`/api/admin/subscribers/${r.id}`, { method: "DELETE" }); setRows(x => x.filter(y => y.id !== r.id)); setNotice(`${r.email} 을(를) 삭제했어요.`); }
    catch { setNotice("삭제하지 못했어요. 다시 시도해 주세요."); }
  }
  const byTopic = topics.map(t => [t, rows.filter(r => r.topic === t).length] as const);
  const shown = rows.filter(r => !q || r.email.includes(q.trim().toLowerCase()));
  return (
    <div className="frame">
      <section className="cell page-head" aria-labelledby="admin-title">
        <div>
          <h1 id="admin-title" className="page-title">운영 관리</h1>
          {state === "ready" && <p className="count">저장된 신청 {rows.length}건</p>}
        </div>
        {state === "ready" && <div className="admin-actions"><button type="button" className="pill pill-line" onClick={() => { setOwnerToken(""); setRows([]); setState("locked"); setNotice(""); }}>관리 화면 잠그기</button><button type="button" className="pill pill-ink" onClick={() => downloadCsv("/api/admin/subscribers.csv", "subscribers.csv").catch(() => setNotice("내려받지 못했어요. 다시 시도해 주세요."))}>CSV 내려받기</button></div>}
      </section>
      {state === "loading" ? <div className="cell narrow-cell"><p className="section-lede">불러오는 중…</p></div>
         : state === "locked" ? <div className="cell narrow-cell"><h2 className="section-title sm">운영 관리는 관리자만 할 수 있어요</h2><p className="section-lede">수집·발행 이력과 구독 신청을 확인하고, 새 글을 게시할 수 있어요.</p><form className="admin-unlock" onSubmit={unlock}><label htmlFor="admin-password">관리자 비밀번호</label><input id="admin-password" name="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /><button className="pill pill-ink" disabled={unlocking}>{unlocking ? "여는 중…" : "운영 관리 열기"}</button>{notice && <p className="error" role="alert">{notice}</p>}</form></div> : <>
           <Suspense fallback={<div className="cell" role="status">발행 이력을 불러오는 중…</div>}><EditorialPanel /></Suspense>
           <div className="cell"><h2 className="section-title sm">구독 신청 관리</h2><p className="sub-note">아래 명단은 기존 구독 신청을 그대로 유지해요.</p></div>
           <div className="stat-grid">{byTopic.map(([t, c], n) => <div key={t} className={`cell stat tone-${(n % 3) + 1}`}><span>{t === "전체" ? "주제 상관없이" : t}</span><b>{c}</b></div>)}</div>
          <section className="cell admin-list" aria-label="구독 신청 목록">
            <p className="admin-note">발송은 CSV 를 스티비·메일리 같은 발송 서비스로 옮겨서 해요. 구독자가 메일로 취소를 요청하면 아래에서 삭제하세요.</p>
            {notice && <p className="admin-note" role="status">{notice}</p>}
             {rows.length > 0 && <input className="search" name="subscriber-search" autoComplete="off" spellCheck={false} type="search" aria-label="이메일 찾기" placeholder="예: name@example.com…" value={q} onChange={e => setQ(e.target.value)} />}
             {rows.length
               ? <ul className="subscriber-list">{shown.map(r => <li key={r.id}><strong>{r.email}</strong><span className="tag">{r.topic}</span><time>{r.created_at.slice(0, 16)}</time><button type="button" className="text-link danger" onClick={() => remove(r)} aria-label={`${r.email} 삭제`}>삭제</button></li>)}</ul>
               : <p className="empty-note">아직 구독 신청이 없어요.</p>}
             {rows.length > 0 && !shown.length && <p className="empty-note">일치하는 이메일이 없어요. 검색어를 바꿔 보세요.</p>}
          </section>
        </>}
      <Colophon />
    </div>
  );
}

/* ---------- 콜로폰: 모든 화면의 마지막 칸 ---------- */
function Colophon() {
  return (
    <footer className="cell colophon">
      <div className="colophon-top">
        <div>
          <p className="wordmark">{content.title}<small>{content.latin}</small></p>
          <p className="colophon-sub">HR·AI 인사이트 · 확인된 사실과 실무 해석</p>
        </div>
        <dl>
          <div><dt>편집</dt><dd>{content.editor}</dd></div>
          <div><dt>주제</dt><dd>노동법 · HR · AI</dd></div>
        </dl>
      </div>
      <div className="colophon-foot">
        <p>원문의 권리는 각 발행처에 있어요. 요약과 실무 해석을 구분해 읽어 주세요.</p>
         <nav aria-label="보조"><Link to="/archive">전체 글</Link><Link to="/sources">출처 모음</Link><Link to="/unsubscribe">구독 관리</Link><Link to="/admin">운영 관리</Link></nav>
      </div>
    </footer>
  );
}

/* ---------- 껍데기: 머리줄 + 페이지 ---------- */
export default function App() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  useReveal();
  useEffect(() => {
    if (pathname.startsWith("/issues/")) return;
    const names: Record<string, string> = { "/archive": "전체 글", "/sources": "출처 모음", "/subscribe": "구독 신청", "/unsubscribe": "구독 관리", "/admin": "운영 관리" };
    document.title = `${names[pathname] ?? "노동법·HR·AI, 일의 변화를 읽다"} | 사이`;
  }, [pathname]);
  // 페이지 이동의 맨 위·뒤로 가기 복원은 <ScrollRestoration /> 이, #앵커로 부드럽게 내려가는 것만 여기서.
  useEffect(() => {
    if (!hash || navType === "POP" || hash.startsWith("#k=") || hash.startsWith("#token=")) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }));
  }, [pathname, hash, navType]);
  return (
    <>
      <a className="skip-link" href="#main-content">본문 바로가기</a>
      <header className="topbar">
        <Link className="wordmark" to="/">{content.title}<small>{content.latin}</small></Link>
        <nav aria-label="주요">
          <NavLink to="/archive" className="nav-link">전체 글</NavLink>
          <NavLink to="/sources" className="nav-link">출처 모음</NavLink>
          <NavLink to="/subscribe" className="pill pill-ink nav-cta">구독하기</NavLink>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}><Outlet /></main>
      <ScrollRestoration />
    </>
  );
}
