// GitHub의 공개 표준 실행 전용. 관리자 비밀번호·AI 키·원문·원고를 전달하거나 출력하지 않는다.
import { appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const publicationOrigin = "https://sai-newsletter.baze.cloud";
const contract = "weekly-v1";
const states = new Set(["running", "completed", "partial", "paused", "skipped", "interrupted", "credit_stopped", "failed"]);

async function json(response, limit = 32000) {
  if (!response.ok || !response.body) throw new Error("요청을 완료하지 못했어요. 사이트의 실행 이력을 확인해 주세요.");
  const reader = response.body.getReader(), decoder = new TextDecoder(); let text = "";
  try {
    while (true) { const chunk = await reader.read(); if (chunk.done) break; text += decoder.decode(chunk.value, { stream: true }); if (text.length > limit) throw new Error("응답 확인 한도를 넘었어요."); }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
export async function readStep(response) {
  if (!response.ok || !response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw new Error("실행 연결을 확인하지 못했어요.");
  const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = "", bytes = 0, result;
  const block = value => {
    const data = value.split("\n").find(line => line.startsWith("data:"))?.slice(5).trim();
    if (!data) return;
    if (/^event: failed/m.test(value)) throw new Error("이번 단계를 마치지 못했어요. 사이트의 실제 실행 이력을 확인해 주세요.");
    if (/^event: done/m.test(value)) result = JSON.parse(data);
  };
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      bytes += chunk.value.byteLength; if (bytes > 2000000) throw new Error("진행 응답 한도를 넘었어요.");
      buffer += decoder.decode(chunk.value, { stream: true });
      const blocks = buffer.replace(/\r\n/g, "\n").split("\n\n"); buffer = blocks.pop() ?? "";
      for (const value of blocks) block(value);
    }
    buffer += decoder.decode(); if (buffer.trim()) block(buffer);
    if (!result || typeof result.more !== "boolean" || !states.has(result.state)) throw new Error("완료 응답을 확인하지 못했어요. 자동으로 다시 요청하지 않아요.");
    return { more: result.more, state: result.state, ...(Number.isInteger(result.fulfilled) && result.fulfilled >= 0 && result.fulfilled <= 7 ? { fulfilled: result.fulfilled } : {}) };
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
export async function runWeekly({ env = process.env, request = fetch, log = console.log, now = Date.now, summary = async () => {} } = {}) {
  if (env.GITHUB_ACTIONS !== "true" || env.GITHUB_REPOSITORY !== "489156/hRAX-weekly-brief" || env.GITHUB_REF !== "refs/heads/main" || env.REPOSITORY_VISIBILITY !== "public" || !["schedule", "workflow_dispatch"].includes(env.GITHUB_EVENT_NAME)) throw new Error("지정한 공개 저장소의 기본 브랜치에서만 실행할 수 있어요.");
  const verifyOnly = env.VERIFY_ONLY !== "false" || env.PUBLICATION_ENABLED !== "true";
  const health = await json(await request(`${publicationOrigin}/api/health`, { redirect: "error", signal: AbortSignal.timeout(20000) }));
  if (health.editorialVersion !== contract) {
    const message = "공개 사이트의 새 주간 발행 반영 전이에요. 연결 검증을 보류했으며 수집·AI·게시를 요청하지 않았어요.";
    await summary(message); log(message);
    if (!verifyOnly) throw new Error("공개 사이트 반영 후 다시 실행해 주세요.");
    return { state: "awaiting_publication", verified: false };
  }
  async function call(path, method = "GET") {
    // 각 단계마다 짧게 유효한 실행 증명을 새로 받는다. 증명값은 로그에 쓰지 않는다.
    if (!env.ACTIONS_ID_TOKEN_REQUEST_URL || !env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) throw new Error("GitHub 실행 증명을 요청할 수 없어요.");
    const url = new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL); if (url.protocol !== "https:") throw new Error("실행 증명 주소가 올바르지 않아요.");
    url.searchParams.set("audience", publicationOrigin);
    const identity = await json(await request(url, { headers: { authorization: `Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` }, redirect: "error", signal: AbortSignal.timeout(20000) }));
    if (typeof identity.value !== "string" || !identity.value || identity.value.length > 12000) throw new Error("실행 증명을 확인하지 못했어요.");
    return request(`${publicationOrigin}/api/automation${path}`, { method, headers: { authorization: `Bearer ${identity.value}`, accept: path.endsWith("/step") ? "text/event-stream" : "application/json" }, redirect: "error", signal: AbortSignal.timeout(path.endsWith("/step") ? 19 * 60000 : 30000) });
  }
  const status = await json(await call("/status"));
  if (status.contract !== contract || typeof status.paused !== "boolean") throw new Error("주간 발행 연결 규칙을 확인하지 못했어요.");
  if (verifyOnly) {
    const message = `읽기 전용 연결을 확인했어요. 예약 요청은 ${status.paused ? "일시중지" : "허용"} 상태이며 수집·AI·게시를 요청하지 않았어요.`;
    log(message); await summary(message); return { state: "verified", verified: true, paused: status.paused };
  }
  const execution = await json(await call("/start", "POST"));
  if (!/^[a-f0-9]{32}$/.test(execution.id) || !states.has(execution.state) || typeof execution.more !== "boolean") throw new Error("시작 응답을 확인하지 못했어요.");
  if (!execution.more) { const message = `이번 요청 상태: ${execution.state}. 새 AI 단계를 시작하지 않았어요.`; log(message); await summary(message); return { state: execution.state }; }
  const started = now();
  for (let step = 0; step < 100 && now() - started < 195 * 60000; step++) {
    const result = await readStep(await call(`/executions/${execution.id}/step`, "POST"));
    log(`주간 처리 ${step + 1}단계 · ${result.state}${result.fulfilled === undefined ? "" : ` · ${result.fulfilled}/7개 주제`}`);
    if (!result.more) {
      await summary(`실제 실행 결과: ${result.state}${result.fulfilled === undefined ? "" : ` · ${result.fulfilled}/7개 주제 충족`}. 자세한 수집·보류 사유는 사이트 운영 관리에서 확인해 주세요.`);
      if (["failed", "credit_stopped", "interrupted"].includes(result.state)) throw new Error("실행이 중단됐어요. 완료한 작업과 호출 횟수는 사이트에 남아 있어요.");
      return result;
    }
  }
  throw new Error("이번 실행의 시간·단계 한도에 도달했어요. 완료한 작업을 보존하고 중단해요.");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWeekly({ summary: text => process.env.GITHUB_STEP_SUMMARY ? appendFile(process.env.GITHUB_STEP_SUMMARY, `## 랙스 주간 발행\n\n${text}\n`) : Promise.resolve() })
    .catch(() => { console.error("랙스 주간 실행을 끝내지 못했어요. 공개 사이트 반영 상태와 운영 관리의 실제 이력을 확인해 주세요. 비밀·원문·원고는 출력하지 않아요."); process.exitCode = 1; });
}
