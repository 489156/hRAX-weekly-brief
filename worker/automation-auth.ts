import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import type { MiddlewareHandler } from "hono";
import type { Bindings } from "./lib";

type AutomationPolicy = Pick<Bindings, "AUTOMATION_REPOSITORY" | "AUTOMATION_REPOSITORY_ID" | "AUTOMATION_OWNER_ID" | "AUTOMATION_BRANCH" | "PUBLIC_ORIGIN">;

// 검증키 인자는 로컬 서명 검사용이다. 요청으로는 받을 수 없으며 실제 요청은 고정 GitHub 공개키만 읽는다.
export async function verifyAutomationToken(token: string, policy: AutomationPolicy, keySet?: JWTVerifyGetKey) {
  const { AUTOMATION_REPOSITORY: repo, AUTOMATION_REPOSITORY_ID: repoId, AUTOMATION_OWNER_ID: ownerId, AUTOMATION_BRANCH: branch } = policy;
  if (!repo || !repoId || !ownerId || !branch || !token || token.length > 12000) throw new Error("configuration");
  const keys = keySet ?? createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"), { timeoutDuration: 10000 });
  const { payload } = await jwtVerify(token, keys, {
    issuer: "https://token.actions.githubusercontent.com", audience: policy.PUBLIC_ORIGIN,
    algorithms: ["RS256"], maxTokenAge: "10 minutes", clockTolerance: 10,
    requiredClaims: ["exp", "iat", "sub", "repository", "repository_id", "repository_owner_id", "workflow_ref", "ref", "run_id", "event_name", "repository_visibility"],
  });
  // 새 저장소의 불변 subject 형식에 의존하지 않고 이름과 고유번호를 함께 대조한다.
  if (payload.repository !== repo || payload.repository_id !== repoId || payload.repository_owner_id !== ownerId || payload.ref !== `refs/heads/${branch}` || payload.workflow_ref !== `${repo}/.github/workflows/newsletter.yml@refs/heads/${branch}` || !["schedule", "workflow_dispatch"].includes(String(payload.event_name)) || payload.repository_visibility !== "private") throw new Error("claims");
}

export const automationOnly: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const token = c.req.header("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  try { await verifyAutomationToken(token, c.env); }
  catch { return c.json({ error: "예약 실행 권한을 확인하지 못했어요." }, 403); }
  await next();
};
