import { XMLParser } from "fast-xml-parser";
import type { SourceEntry } from "../shared/sources";

const bot = "SaiNewsletterBot/1.0 (+https://sai-newsletter.baze.cloud/sources)";
export class EditorialError extends Error {}
export class EditorialExclusion extends EditorialError {}
export const plain = (value: string) => value
  .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|amp|lt|gt|quot|apos);/g, e => ({ "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" })[e] ?? e)
  .replace(/&#(x[\da-f]+|\d+);/gi, (_, n: string) => { const c = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n); return c > 0 && c <= 0x10ffff ? String.fromCodePoint(c) : " "; })
  .replace(/\s+/g, " ").trim();

export function canonicalUrl(input: string, base?: string) {
  const u = new URL(input, base);
  if (u.protocol !== "https:" || u.username || u.password || u.port) throw new EditorialError("허용된 공개 주소가 아니에요.");
  u.hash = "";
  for (const key of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref$|source$)/i.test(key)) u.searchParams.delete(key);
  u.searchParams.sort();
  if (u.pathname !== "/") u.pathname = u.pathname.replace(/\/+$/, "");
  return u.href;
}

export function robotsAllows(text: string, path: string) {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let current = { agents: [] as string[], rules: [] as { allow: boolean; path: string }[] };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim(), colon = line.indexOf(":");
    if (colon < 0) continue;
    const name = line.slice(0, colon).toLowerCase(), value = line.slice(colon + 1).trim();
    if (name === "user-agent") {
      if (current.rules.length) { groups.push(current); current = { agents: [], rules: [] }; }
      current.agents.push(value.toLowerCase());
    } else if ((name === "allow" || name === "disallow") && current.agents.length && value) current.rules.push({ allow: name === "allow", path: value });
  }
  groups.push(current);
  const specific = groups.filter(g => g.agents.some(a => a !== "*" && "sainewsletterbot".includes(a)));
  const applicable = specific.length ? specific : groups.filter(g => g.agents.includes("*"));
  let best = -1, allowed = true;
  for (const group of applicable) for (const rule of group.rules) {
    const pattern = rule.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$");
    if (new RegExp(`^${pattern}`).test(path) && (rule.path.length > best || (rule.path.length === best && rule.allow))) { best = rule.path.length; allowed = rule.allow; }
  }
  return allowed;
}

export async function boundedText(response: Response, limit: number) {
  if (Number(response.headers.get("content-length")) > limit) { await response.body?.cancel(); throw new EditorialError("공개 자료가 수집 크기 제한을 넘었어요."); }
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let bytes = 0, text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new EditorialError("공개 자료가 수집 크기 제한을 넘었어요."); }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}

type FetchScope = { robots: Map<string, string>; source: SourceEntry };
function allowedHost(url: URL, source: SourceEntry) {
  const hosts = [source.url, source.feed].filter((x): x is string => !!x).map(x => new URL(x).hostname);
  return url.protocol === "https:" && !url.username && !url.password && !url.port && hosts.includes(url.hostname);
}
async function checkRobots(url: URL, scope: FetchScope) {
  let rules = scope.robots.get(url.origin);
  if (rules === undefined) {
    const r = await fetch(`${url.origin}/robots.txt`, { headers: { "user-agent": bot }, redirect: "manual", signal: AbortSignal.timeout(12000) });
    if (r.status === 404) { await r.body?.cancel(); rules = ""; }
    else if (r.ok) rules = await boundedText(r, 100000);
    else { await r.body?.cancel(); throw new EditorialError("수집 정책을 확인할 수 없어 건너뛰었어요."); }
    scope.robots.set(url.origin, rules);
  }
  if (!robotsAllows(rules, url.pathname + url.search)) throw new EditorialError("발행처의 수집 제한에 따라 건너뛰었어요.");
}
export async function publicDocument(input: string, scope: FetchScope, max = 1600000) {
  let url = new URL(canonicalUrl(input));
  for (let n = 0; n < 4; n++) {
    if (!allowedHost(url, scope.source)) throw new EditorialError("허용된 발행처 밖의 주소는 수집하지 않아요.");
    await checkRobots(url, scope);
    const r = await fetch(url.href, { headers: { "user-agent": bot, accept: "text/html, application/rss+xml, application/atom+xml, application/xml, text/xml" }, redirect: "manual", signal: AbortSignal.timeout(18000) });
    if (r.status >= 300 && r.status < 400) {
      const next = r.headers.get("location"); await r.body?.cancel();
      if (!next) throw new EditorialError("이동된 공개 주소를 확인할 수 없어요.");
      url = new URL(next, url); continue;
    }
    if (!r.ok) { await r.body?.cancel(); throw new EditorialError("공개 본문을 읽을 수 없어 건너뛰었어요. 접근 제한이나 일시적인 응답 오류일 수 있어요."); }
    const type = r.headers.get("content-type") ?? "";
    if (!/html|xml|text\/plain/i.test(type)) { await r.body?.cancel(); throw new EditorialError("웹 본문이 아닌 첨부 자료는 자동으로 읽지 않아요."); }
    return { text: await boundedText(r, max), url: url.href };
  }
  throw new EditorialError("주소 이동이 반복되어 건너뛰었어요.");
}

export type FeedItem = { title: string; url: string; date: string; dateLabel: string; score: number; topic: string };
const scalar = (v: unknown): string => typeof v === "string" ? v : v && typeof v === "object" && "#text" in v ? String(v["#text"]) : "";
const list = (v: unknown): unknown[] => Array.isArray(v) ? v : v ? [v] : [];
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" ? v as Record<string, unknown> : {};
function feedDate(input: string, source: SourceEntry) {
  const raw = input.trim();
  const date = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw) ? raw.replace(" ", "T") + (source.id.startsWith("moel") ? "+09:00" : "Z") : raw;
  const parsed = new Date(date);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : "";
}
export function rankTitle(title: string, source: SourceEntry) {
  if (/webinar|private session|sponsor|discount|초대합니다|행사 안내|세미나 안내|이벤트|프로모션|출범|공개채용|채용공고/i.test(title)) return -1;
  let score = source.priority ?? 50;
  if (source.group === "노동법") {
    if (/근로기준|노동조합|임금|산업안전보건법|근로시간|감독관|육아|중대재해/.test(title)) score += 22;
    if (/직제|수수료|기관의 지정|건설근로자/.test(title)) score -= 25;
  }
  if (source.id === "flex") {
    if (!/조직|인사|HR|목표|성과|AI|인력|평가|보상|리더|사업계획/.test(title)) return -1;
    if (/조직|인사|성과/.test(title)) score += 12;
  }
  if (source.group === "AI" || source.group === "개발") {
    if (!/AI|LLM|agent|claude|gpt|gemini|인공지능|에이전트|skills|Copilot|모델|프롬프트|인공 지능/i.test(title) && source.id !== "import-ai" && source.id !== "github-trending") return -1;
  }
  return score;
}
export function parseFeed(xml: string, source: SourceEntry, now = Date.now()): FeedItem[] {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ""))) throw new EditorialError("외부 문서 선언이 있는 피드는 읽지 않아요.");
  const parsed = record(new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", parseTagValue: false, processEntities: true, htmlEntities: true }).parse(xml));
  const channel = record(record(parsed.rss).channel), feed = record(parsed.feed);
  const entries = list(channel.item ?? feed.entry ?? record(parsed["rdf:RDF"]).item);
  if (!entries.length) throw new EditorialError("정상적인 최신 글 목록을 받지 못했어요.");
  const items: FeedItem[] = [];
  for (const value of entries.slice(0, 50)) {
    const entry = record(value), title = plain(scalar(entry.title)).slice(0, 240);
    const links = list(entry.link).map(record);
    const link = scalar(entry.link) || String((links.find(x => !x["@rel"] || x["@rel"] === "alternate") ?? links[0])?.["@href"] ?? "");
    const rawDate = scalar(entry.pubDate ?? entry.published ?? entry.updated ?? entry["dc:date"] ?? entry.date ?? entry.regDate);
    const date = feedDate(rawDate, source), score = rankTitle(title, source);
    if (!title || !date || score < 0 || Date.parse(date) > now + 300000 || Date.parse(date) < now - (source.lookback ?? 14) * 86400000) continue;
    try {
      const url = canonicalUrl(link, source.url);
      if (!allowedHost(new URL(url), source)) continue;
      items.push({ title, url, date, dateLabel: entry.published || entry.pubDate || entry["dc:date"] ? "원문 발행일 · 피드 표기" : "원문 표기일 · 갱신일일 수 있어요", score, topic: source.group === "노동법" ? "노동법" : source.group === "HR" || source.id === "flex" ? "HR" : "AI" });
    } catch { /* 발행처 밖 링크나 잘못된 주소는 후보가 아니다. */ }
  }
  return items.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date)).slice(0, 4);
}

async function trending(text: string, source: SourceEntry) {
  const found: { title: string; url: string; description: string }[] = [];
  let row: typeof found[number] | undefined;
  await new HTMLRewriter().on("article.Box-row", { element() { row = { title: "", url: "", description: "" }; found.push(row); } })
    .on("article.Box-row h2 a", { element(e) { if (row) row.url = e.getAttribute("href") ?? ""; }, text(t) { if (row) row.title += t.text; } })
    .on("article.Box-row p", { text(t) { if (row) row.description += t.text; } }).transform(new Response(text, { headers: { "content-type": "text/html; charset=utf-8" } })).arrayBuffer();
  return found.filter(x => /AI|LLM|agent|claude|GPT|RAG|machine learning|artificial intelligence/i.test(x.title + " " + x.description)).slice(0, 3).map(x => ({
    title: `${plain(x.title)} — ${plain(x.description).slice(0, 140)}`, url: canonicalUrl(x.url, source.url), date: new Date().toISOString(),
    dateLabel: "주간 Trending 목록 확인일 · 저장소 발행일 아님", score: source.priority ?? 50, topic: "GitHub Trending",
  }));
}
export async function collectSource(source: SourceEntry) {
  const scope = { source, robots: new Map<string, string>() };
  const doc = await publicDocument(source.feed!, scope);
  return source.id === "github-trending" ? trending(doc.text, source) : parseFeed(doc.text, source);
}
export async function readMaterial(source: SourceEntry, item: Pick<FeedItem, "url" | "title" | "date" | "dateLabel">) {
  const doc = await publicDocument(item.url, { source, robots: new Map<string, string>() });
  const html = doc.text.replace(/<(script|style|noscript|nav|footer)\b[\s\S]*?<\/\1>/gi, " ");
  let text = "", matched = 0, restricted = false;
  const selector = source.id === "github-trending" ? ".markdown-body" : source.selector ?? "article";
  await new HTMLRewriter().on(selector, {
    element() { matched++; }, text(t) { if (text.length < 22000) text += t.text + (t.lastInTextNode ? " " : ""); },
  }).on('[class*="paywall"], [class*="premium-lock"], form[action*="login"]', { element() { restricted = true; } })
    .transform(new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } })).arrayBuffer();
  const body = plain(text).slice(0, 16000);
  if (restricted || /Just a moment|Access Denied|접근이 제한|권한이 없습니다/.test(body)) throw new EditorialError("접근 제한이 있는 본문은 요약하지 않아요.");
  if (!matched || body.length < (source.group === "노동법" ? 90 : 170)) throw new EditorialError("검증할 수 있는 본문을 충분히 읽지 못했어요. 첨부 파일은 읽지 않아요.");
  if (source.id === "flex" && /세미나|웨비나|webinar/i.test(body) && /일시\s*:|장소\s*:|참가\s*신청|등록하기|register now/i.test(body)) throw new EditorialExclusion("실무 분석보다 행사 신청을 위한 안내에 가까워 홍보성 제외 기준을 적용했어요.");
  const scope = `공개 웹 본문 중 최대 16,000자만 확인했어요. 첨부 파일·유료 내용·연결된 하위 자료·실제 제품 성능은 확인하지 않았어요.${text.length > 16000 ? " 긴 원문의 앞부분에 한정된 요약이에요." : ""}`;
  return { material: `원문 제목: ${item.title}\n${item.dateLabel}: ${item.date}\n발행처: ${source.name}\n자료 성격: ${source.kind}\n\n${body}`, scope, actualUrl: doc.url };
}
