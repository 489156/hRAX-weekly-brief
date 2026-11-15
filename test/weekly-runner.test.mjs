import test from "node:test";
import assert from "node:assert/strict";
import { runWeekly, readStep, publicationOrigin } from "../scripts/run-weekly.mjs";

const env = { GITHUB_ACTIONS: "true", GITHUB_REPOSITORY: "489156/hRAX-weekly-brief", GITHUB_REF: "refs/heads/main", REPOSITORY_VISIBILITY: "public", GITHUB_EVENT_NAME: "workflow_dispatch", VERIFY_ONLY: "true", PUBLICATION_ENABLED: "false", ACTIONS_ID_TOKEN_REQUEST_URL: "https://example.org/isolated-oidc", ACTIONS_ID_TOKEN_REQUEST_TOKEN: "isolated-not-a-real-token" };
const sse = result => new Response(`event: ping\ndata: {}\n\nevent: done\ndata: ${JSON.stringify(result)}\n\n`, { headers: { "content-type": "text/event-stream" } });
function mock(options = {}) {
  const calls = [], logs = [];
  return { calls, logs, async request(url, init = {}) {
    const path = new URL(url).pathname; calls.push({ path, method: init.method ?? "GET" });
    if (path === "/api/health") return Response.json({ ok: true, ...(options.legacy ? {} : { editorialVersion: "weekly-v1" }) });
    if (path === "/isolated-oidc") return Response.json({ value: "test-only-oidc-not-a-secret" });
    if (path === "/api/automation/status") return Response.json({ contract: "weekly-v1", paused: false });
    if (path === "/api/automation/start") return Response.json({ id: "a".repeat(32), state: "running", more: true });
    if (path.endsWith("/step")) return sse({ state: options.terminal ?? "partial", more: false, fulfilled: 3, action: "원고나 임의 메시지는 공개 로그로 전달하지 않아요." });
    throw new Error("unexpected request");
  }, log: text => logs.push(text), summary: async text => logs.push(text) };
}
test("공개 반영 전에는 기존 발행 처리를 호출하지 않고 연결 확인 보류를 표시", async () => {
  const m = mock({ legacy: true }), result = await runWeekly({ env, ...m });
  assert.equal(result.state, "awaiting_publication"); assert.equal(result.verified, false);
  assert.deepEqual(m.calls.map(c => c.path), ["/api/health"]);
});
test("읽기 전용 연결 확인은 시작·게시·AI를 호출하지 않음", async () => {
  const m = mock(), result = await runWeekly({ env, ...m });
  assert.equal(result.state, "verified"); assert.ok(m.calls.every(c => c.method === "GET"));
  assert.ok(m.logs.every(s => !s.includes("test-only-oidc") && !s.includes("isolated-not-a-real-token")));
});
test("허용 설정이 false이면 입력만 바꿔 발행을 시작할 수 없음", async () => {
  const m = mock(); await runWeekly({ env: { ...env, VERIFY_ONLY: "false" }, ...m });
  assert.equal(m.calls.some(c => c.method === "POST"), false);
});
test("공개·기본 브랜치가 아니면 연결도 시작하지 않음", async () => {
  for (const override of [{ REPOSITORY_VISIBILITY: "private" }, { GITHUB_REF: "refs/heads/other" }, { GITHUB_EVENT_NAME: "pull_request" }, { GITHUB_ACTIONS: "false" }]) { const m = mock(); await assert.rejects(runWeekly({ env: { ...env, ...override }, ...m })); assert.equal(m.calls.length, 0); }
});
test("허용된 발행은 단계마다 증명을 갱신하며 원고·임의 메시지를 출력하지 않음", async () => {
  const m = mock(), result = await runWeekly({ env: { ...env, VERIFY_ONLY: "false", PUBLICATION_ENABLED: "true" }, ...m });
  assert.equal(result.fulfilled, 3); assert.equal(m.calls.filter(c => c.path === "/isolated-oidc").length, 3);
  assert.ok(m.logs.every(s => !s.includes("임의 메시지") && !s.includes("test-only-oidc")));
  assert.equal(publicationOrigin, "https://sai-newsletter.baze.cloud");
});
test("크레딧 중단·불완전 응답을 자동으로 반복 요청하지 않음", async () => {
  const m = mock({ terminal: "credit_stopped" });
  await assert.rejects(runWeekly({ env: { ...env, VERIFY_ONLY: "false", PUBLICATION_ENABLED: "true" }, ...m }));
  assert.equal(m.calls.filter(c => c.path.endsWith("/step")).length, 1);
  await assert.rejects(readStep(new Response("event: ping\ndata: {}\n\n", { headers: { "content-type": "text/event-stream" } })));
});
