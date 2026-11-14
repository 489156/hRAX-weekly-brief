export class ChatStreamError extends Error {}

// 전송 봉투는 토큰마다 반복되므로 실제 답변보다 훨씬 크다. 두 크기를 따로 제한한다.
export async function readChatStream(response: Response, progress: (characters: number) => Promise<void>) {
  if (!response.body) throw new ChatStreamError("AI 응답을 받지 못했어요. 다시 시도해 주세요.");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", answer = "", bytes = 0, notified = 0, completed = false, truncated = false;
  function line(value: string) {
    if (!value.startsWith("data:")) return;
    const raw = value.slice(5).trim();
    if (!raw || raw === "[DONE]") return;
    const data = JSON.parse(raw) as { choices?: { delta?: { content?: string }; finish_reason?: string }[]; error?: unknown };
    if (data.error) throw new ChatStreamError("AI 요약을 끝내지 못했어요. 같은 작업을 다시 실행해 주세요.");
    const choice = data.choices?.[0];
    answer += choice?.delta?.content ?? "";
    if (answer.length > 24000) throw new ChatStreamError("요약이 허용된 길이를 넘었어요. 이번 글은 게시하지 않아요.");
    if (choice?.finish_reason === "stop") completed = true;
    if (choice?.finish_reason === "length") truncated = true;
  }
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 4000000) throw new ChatStreamError("AI 응답이 전송 한도를 넘었어요. 이번 글은 게시하지 않아요.");
      buffer += decoder.decode(part.value, { stream: true });
      const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
      for (const value of lines) line(value.trimEnd());
      if (answer.length - notified >= 180) { notified = answer.length; await progress(answer.length); }
    }
    buffer += decoder.decode();
    if (buffer.trim()) line(buffer.trimEnd());
    if (!completed || truncated || !answer) throw new ChatStreamError("요약을 완성하지 못했어요. 이번 글은 게시하지 않아요.");
    return answer;
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
}
