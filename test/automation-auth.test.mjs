import test from "node:test";
import assert from "node:assert/strict";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyAutomationToken } from "../worker/automation-auth.ts";

// 이 검사에서 생성하는 키는 메모리에만 있으며 실제 GitHub 증명이나 앱 비밀이 아니다.
const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = { ...await exportJWK(publicKey), kid: "local-check", alg: "RS256", use: "sig" };
const keys = createLocalJWKSet({ keys: [jwk] });
const policy = {
  AUTOMATION_REPOSITORY: "example-owner/example-letter", AUTOMATION_REPOSITORY_ID: "1234",
  AUTOMATION_OWNER_ID: "5678", AUTOMATION_BRANCH: "main", PUBLIC_ORIGIN: "https://example.org",
};
const claims = {
  repository: policy.AUTOMATION_REPOSITORY, repository_id: "1234", repository_owner_id: "5678",
  ref: "refs/heads/main", workflow_ref: "example-owner/example-letter/.github/workflows/newsletter.yml@refs/heads/main",
  run_id: "local-run", event_name: "workflow_dispatch", repository_visibility: "private",
};
async function sign(overrides = {}, options = {}) {
  return new SignJWT({ ...claims, ...overrides }).setProtectedHeader({ alg: "RS256", kid: "local-check" })
    .setSubject("local-test-subject").setIssuer(options.issuer ?? "https://token.actions.githubusercontent.com")
    .setAudience(options.audience ?? policy.PUBLIC_ORIGIN).setIssuedAt(options.issuedAt ?? Math.floor(Date.now() / 1000))
    .setExpirationTime(options.expiration ?? "5m").sign(options.key ?? privateKey);
}
test("예약 증명은 허용한 비공개 저장소·분기·작업만 통과", async () => {
  await verifyAutomationToken(await sign(), policy, keys);
  await verifyAutomationToken(await sign({ event_name: "schedule" }), policy, keys);
});
for (const [label, overrides] of [
  ["같은 이름의 다른 저장소 고유번호", { repository_id: "9999" }],
  ["다른 소유자 고유번호", { repository_owner_id: "9999" }],
  ["허용하지 않은 저장소 이름", { repository: "example-owner/another" }],
  ["다른 분기", { ref: "refs/heads/another" }],
  ["다른 작업 파일", { workflow_ref: "example-owner/example-letter/.github/workflows/other.yml@refs/heads/main" }],
  ["변경 제안의 실행", { event_name: "pull_request" }],
  ["공개 저장소", { repository_visibility: "public" }],
  ["필수 실행 번호 누락", { run_id: undefined }],
]) test(`예약 권한 거부: ${label}`, async () => {
  await assert.rejects(verifyAutomationToken(await sign(overrides), policy, keys));
});
test("발급처·대상·만료·서명이 다른 예약 증명은 거부", async () => {
  for (const options of [
    { issuer: "https://untrusted.example" }, { audience: "https://another.example" },
    { issuedAt: Math.floor(Date.now() / 1000) - 4000, expiration: Math.floor(Date.now() / 1000) - 3000 },
    { key: (await generateKeyPair("RS256")).privateKey },
  ]) await assert.rejects(verifyAutomationToken(await sign({}, options), policy, keys));
  await assert.rejects(verifyAutomationToken("", policy, keys));
  await assert.rejects(verifyAutomationToken(await sign(), { ...policy, AUTOMATION_REPOSITORY_ID: "" }, keys));
});
