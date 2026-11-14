// GitHub Actions에서는 단기 OIDC 증명만 사용한다. 개인 연결 토큰·구독자 명단·AI 키를 읽지 않는다.
const preview = process.argv.includes("--preview");
const base = preview ? "http://localhost:5173/api/admin/editorial" : "https://sai-newsletter.baze.cloud/api/automation";
const audience = "https://sai-newsletter.baze.cloud";
async function authorization() {
  if (preview) {
    if (!process.env.ADMIN_TOKEN) throw new Error("미리보기 관리자 연결이 없어요.");
    return `Bearer ${encodeURIComponent(process.env.ADMIN_TOKEN)}`;
  }
  if (!process.env.ACTIONS_ID_TOKEN_REQUEST_URL || !process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) throw new Error("허용한 예약 작업에서만 실행할 수 있어요.");
  const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL); url.searchParams.set("audience", audience);
  const response = await fetch(url, { headers: { authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("예약 실행 증명을 받지 못했어요.");
  const { value } = await response.json();
  if (typeof value !== "string") throw new Error("예약 실행 증명의 형식을 확인해 주세요.");
  return `Bearer ${value}`;
}
async function call(path, body) {
  const response = await fetch(base + path, { method: body ? "POST" : "GET", headers: { authorization: await authorization(), "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(200000) });
  if (!response.ok) throw new Error(`발행 요청을 끝내지 못했어요. 처리 단계 ${path.split("/").filter(Boolean).at(-1)}, 응답 ${response.status}`);
  return response.json();
}
async function draft(runId, candidateId) {
  const response = await fetch(`${base}/runs/${runId}/draft/${candidateId}`, { method: "POST", headers: { authorization: await authorization() }, signal: AbortSignal.timeout(200000) });
  if (!response.ok || !response.body) throw new Error("요약 요청을 시작하지 못했어요.");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", done = false;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      buffer += decoder.decode(part.value, { stream: true });
      const blocks = buffer.replace(/\r\n/g, "\n").split("\n\n"); buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        if (/^event: failed/m.test(block)) throw new Error("본문·요약 확인 기준을 통과하지 못해 제외했어요.");
        if (/^event: done/m.test(block)) done = true;
      }
    }
  } finally { reader.releaseLock(); }
  if (!done) throw new Error("요약 완료 기록을 받지 못했어요. 같은 회차로 다시 실행해 주세요.");
}
try {
  if (!preview && process.env.VERIFY_ONLY !== "true" && process.env.PUBLICATION_ENABLED !== "true") throw new Error("자동 게시가 꺼져 있어요. 연결 검사만 실행할 수 있어요.");
  const status = await call("/status");
  if (process.env.VERIFY_ONLY === "true") { console.log(`${preview ? "미리보기의" : "예약 작업의"} 접근 권한과 발행 이력 조회에 성공했어요. 새 글은 만들지 않았어요.`); process.exit(0); }
  const { run } = await call("/start", { kind: preview && process.argv.includes("--trial") ? "trial" : "weekly", target: 5 });
  if (run.state === "published") { console.log(`이미 게시한 회차예요. ${run.published_count}개를 유지하며 AI를 다시 호출하지 않았어요.`); process.exit(0); }
  for (const source of status.sources) {
    const result = await call(`/runs/${run.id}/collect/${source.id}`, {});
    console.log(`${source.name}: ${result.state} · 새 후보 ${result.accepted ?? 0}건`);
  }
  const selected = await call(`/runs/${run.id}/select`, {});
  for (const candidate of selected.candidates.filter(c => c.selected && !["drafted", "published"].includes(c.state))) {
    try { await draft(run.id, candidate.id); console.log(`${candidate.topic}: 요약 확인 완료`); }
    catch (error) { console.log(`${candidate.topic}: ${error.message}`); }
  }
  const result = await call(`/runs/${run.id}/publish`, {});
  console.log(`${result.run.message} 게시 ${result.run.published_count}개`);
  if (result.run.state !== "published") process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
