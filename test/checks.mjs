import assert from "node:assert/strict";

export async function api({ call, owner }) {
  assert.equal((await call("/api/health")).body.ok, true);
  for (const path of ["/api/admin/subscribers", "/api/admin/subscribers.csv", "/api/admin/editorial/status"]) {
    assert.equal((await call(path)).status, 404, "관리자 밖에서는 명단과 이력에 접근할 수 없음");
  }
  assert.equal((await call("/api/automation/status")).status, 403);
  assert.equal((await call("/api/automation/status", { headers: { authorization: "Bearer invalid" } })).status, 403);
  for (const target of [1, 11]) {
    assert.equal((await call("/api/admin/editorial/start", { method: "POST", headers: owner, body: JSON.stringify({ target }) })).status, 409);
  }
  for (const slug of ["briefing-2026-11-13", "small-teams", "missing"]) {
    assert.equal((await call(`/api/issues/${slug}`)).status, 404, "정리한 글과 없는 글은 본문을 반환하지 않음");
  }
  const list = await call("/api/issues");
  assert.equal(list.status, 200);
  assert.ok(list.body.issues.every(issue => issue.sources?.length && issue.sections.length === 0));
  const csv = await call("/api/sources.csv");
  assert.equal(csv.status, 200); assert.ok(csv.body.includes("선정 이유") && csv.body.includes("수동 확인"));

  const email = `sai-check-${crypto.randomUUID()}@example.com`;
  const data = { email, topic: "AI", consent: true };
  for (const invalid of [{ ...data, email: "bad" }, { ...data, consent: false }, { ...data, topic: "없는 주제" }]) {
    assert.equal((await call("/api/subscribe", { method: "POST", body: JSON.stringify(invalid) })).status, 400);
  }
  let token;
  try {
    const results = await Promise.all([0, 1].map(() => call("/api/subscribe", { method: "POST", body: JSON.stringify(data) })));
    const fresh = results.find(r => r.status === 201), duplicate = results.find(r => r.status === 200);
    token = fresh?.body.token;
    assert.ok(token?.length > 50 && duplicate && !duplicate.body.token, "동시 중복도 한 번만 저장하고 관리 링크는 처음에만 발급");
    const rows = (await call("/api/admin/subscribers", { headers: owner })).body.rows;
    assert.equal(rows.filter(row => row.email === email && row.topic === "AI").length, 1);
    assert.ok(rows.every(row => !Object.hasOwn(row, "token_hash")));
    const adminCsv = await call("/api/admin/subscribers.csv", { headers: owner });
    assert.ok(adminCsv.body.includes(email) && !adminCsv.body.includes(token) && !adminCsv.body.includes("token_hash"));
    assert.equal((await call("/api/unsubscribe", { method: "POST", body: JSON.stringify({ email }) })).status, 400);
    assert.equal((await call("/api/unsubscribe", { method: "POST", body: JSON.stringify({ token }) })).status, 200);
    assert.equal((await call("/api/unsubscribe", { method: "POST", body: JSON.stringify({ token }) })).status, 404);
    token = undefined;
    const remaining = (await call("/api/admin/subscribers", { headers: owner })).body.rows;
    assert.equal(remaining.filter(row => row.email === email).length, 0);
  } finally {
    if (token) await call("/api/unsubscribe", { method: "POST", body: JSON.stringify({ token }) });
  }
}

export async function ui({ page, base, call, owner, password, shot }) {
  const wide = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "화면 가로 넘침 없음");
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "사람을 이해하고, 일의 변화를 읽다" }).waitFor();
  await wide(); await shot("home");
  await page.locator("header.topbar").getByRole("link", { name: "전체 글", exact: true }).click();
  await page.getByRole("heading", { name: "전체 글", exact: true, level: 1 }).waitFor();
  await page.getByRole("button", { name: "HR", exact: true }).click();
  await page.waitForURL(/topic=HR/); await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByRole("button", { name: "HR", exact: true }).getAttribute("aria-pressed"), "true");
  await wide(); await shot("archive");
  if (await page.locator("a.card").count()) {
    await page.locator("a.card").first().click();
    await page.locator("#issue-title").waitFor();
    await page.locator(".toc").getByRole("link", { name: /실무에서/ }).click();
    await page.waitForFunction(() => Number(document.querySelector(".pct")?.textContent?.replace("%", "")) > 0);
    await page.getByRole("heading", { name: "여기까지 읽으셨다면" }).scrollIntoViewIfNeeded();
    assert.ok(await page.locator(".brief-sources a[target=_blank]").count());
    await wide(); await shot("reading");
  }
  await page.goto(`${base}/sources`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "정기 수집 대상", exact: true }).click();
  assert.ok(await page.locator(".source-entry").count());
  await page.getByLabel("분야", { exact: true }).selectOption("HR");
  await page.waitForURL(url => url.searchParams.get("group") === "HR");
  await page.getByLabel("출처 검색", { exact: true }).fill("AIHR");
  await page.waitForURL(url => url.searchParams.get("q") === "AIHR");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByLabel("출처 검색", { exact: true }).inputValue(), "AIHR");
  assert.equal(await page.locator(".source-entry").count(), 1);
  await page.locator(".source-entry summary").click();
  await wide(); await shot("sources");
  await page.getByLabel("출처 검색", { exact: true }).fill("zz-no-source-zz");
  await page.getByText("조건에 맞는 출처가 없어요.").waitFor();
  await page.getByRole("button", { name: "전체 출처 보기" }).click();
  await page.waitForURL(url => url.pathname === "/sources" && !url.search);
  await page.waitForFunction(() => document.querySelectorAll(".source-entry").length > 9);
  assert.equal(await page.getByLabel("출처 검색", { exact: true }).inputValue(), "");
  assert.equal(await page.getByLabel("분야", { exact: true }).inputValue(), "전체");
  assert.ok(await page.locator(".source-entry").count() > 9);
  const sourcesDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "출처 조사표 내려받기", exact: true }).click();
  assert.equal((await sourcesDownload).suggestedFilename(), "sai-sources.csv");

  let token;
  const email = `sai-ui-${crypto.randomUUID()}@example.com`;
  try {
    await page.goto(`${base}/subscribe`, { waitUntil: "networkidle" });
    await page.getByRole("textbox", { name: "이메일", exact: true }).fill("bad");
    await page.getByRole("button", { name: "구독 신청", exact: true }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(await page.locator(":focus").getAttribute("name"), "email");
    await page.getByRole("textbox", { name: "이메일", exact: true }).fill(email);
    await page.getByRole("combobox", { name: "관심 주제" }).selectOption("AI");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "구독 신청", exact: true }).click();
    await page.getByText("구독 신청을 저장했어요.", { exact: true }).waitFor();
    const manage = await page.getByRole("link", { name: "구독 관리", exact: true }).first().getAttribute("href");
    token = new URLSearchParams(new URL(manage).hash.slice(1)).get("token");
    const saved = (await call("/api/admin/subscribers", { headers: owner })).body.rows;
    assert.equal(saved.filter(row => row.email === email).length, 1);
    await wide();
    await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
    await page.getByLabel("관리자 비밀번호", { exact: true }).fill("검증용-틀린-비밀번호");
    await page.getByRole("button", { name: "운영 관리 열기", exact: true }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(await page.getByRole("heading", { name: "수집과 발행", exact: true }).count(), 0);
    await page.getByLabel("관리자 비밀번호", { exact: true }).fill(password);
    await page.getByRole("button", { name: "운영 관리 열기", exact: true }).click();
    await page.getByRole("heading", { name: "수집과 발행", exact: true }).waitFor();
    await page.getByRole("heading", { name: "회차별 실행 이력", exact: true }).waitFor();
    await wide(); await shot("admin", { mask: [page.locator(".subscriber-list strong")] });
    await page.getByRole("searchbox", { name: "이메일 찾기" }).fill(email);
    await page.getByText(email, { exact: true }).waitFor();
    await page.getByRole("searchbox", { name: "이메일 찾기" }).fill("not-a-subscriber-zz");
    await page.getByText("일치하는 이메일이 없어요. 검색어를 바꿔 보세요.").waitFor();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "CSV 내려받기", exact: true }).click();
    assert.equal((await download).suggestedFilename(), "subscribers.csv");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "수집과 발행", exact: true }).waitFor();
    await page.getByRole("button", { name: "관리 화면 잠그기", exact: true }).click();
    await page.getByLabel("관리자 비밀번호", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => sessionStorage.getItem("owner.token")), null);
    await page.goto(manage, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "구독 취소", exact: true }).click();
    await page.getByText("저장된 이메일과 관심 주제를 삭제했어요.", { exact: true }).waitFor();
    token = undefined;
    const rows = (await call("/api/admin/subscribers", { headers: owner })).body.rows;
    assert.equal(rows.filter(row => row.email === email).length, 0);
    await wide();
  } finally {
    if (token) await call("/api/unsubscribe", { method: "POST", body: JSON.stringify({ token }) });
  }
}
