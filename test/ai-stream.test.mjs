import test from "node:test";
import assert from "node:assert/strict";
import { readChatStream } from "../worker/ai-stream.ts";

const chunk = (content = "", finish_reason = null) => `data: ${JSON.stringify({ id: "검증용-반복-전송-메타데이터".repeat(5), choices: [{ delta: { content }, finish_reason }] })}\n\n`;
const done = chunk("", "stop") + "data: [DONE]\n\n";
const progress = async () => {};
test("전송 봉투가 180KB를 넘어도 짧은 요약은 정상적으로 읽음", async () => {
  const text = chunk("가").repeat(1200) + done;
  assert.ok(new TextEncoder().encode(text).length > 180000);
  assert.equal(await readChatStream(new Response(text), progress), "가".repeat(1200));
});
test("UTF-8 글자와 줄 경계가 잘려도 원래 한국어 문장 복원", async () => {
  const bytes = new TextEncoder().encode(chunk("원문을 확인했어요.") + done);
  const stream = new ReadableStream({ start(c) { for (let n = 0; n < bytes.length; n += 7) c.enqueue(bytes.slice(n, n + 7)); c.close(); } });
  assert.equal(await readChatStream(new Response(stream), progress), "원문을 확인했어요.");
});
test("정상 종료 신호 없는 응답과 토큰 한도 종료는 거부", async () => {
  await assert.rejects(readChatStream(new Response(chunk('{"ok":true}') + "data: [DONE]\n\n"), progress));
  await assert.rejects(readChatStream(new Response(chunk('{"ok":true}') + chunk("", "length")), progress));
});
test("스트림 오류·과도한 답변·과도한 전송은 게시 전에 차단", async () => {
  await assert.rejects(readChatStream(new Response('data: {"error":{"message":"검증용"}}\n\n'), progress));
  await assert.rejects(readChatStream(new Response(chunk("가".repeat(24001)) + done), progress));
  await assert.rejects(readChatStream(new Response(" ".repeat(4000001)), progress));
});
