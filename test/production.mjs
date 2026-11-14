import assert from "node:assert/strict";
import { createRequire } from "node:module";
const base = "http://localhost:8787";
const require = createRequire(import.meta.url);
const { chromium } = require("/usr/local/lib/node_modules/playwright");
process.env.PLAYWRIGHT_BROWSERS_PATH ??= "/opt/pw-browsers";

const listing = await (await fetch(`${base}/api/issues`)).json();
const root = await (await fetch(base)).text();
assert.ok(root.includes("https://sai-newsletter.baze.cloud/og-sai-v2.png"));
const image = await fetch(`${base}/og-sai-v2.png`);
assert.equal(image.status, 200); assert.ok(image.headers.get("content-type").includes("image/png"));
const png = Buffer.from(await image.arrayBuffer());
assert.equal(png.readUInt32BE(16), 800); assert.equal(png.readUInt32BE(20), 400);
assert.equal((await fetch(`${base}/issues/briefing-2026-11-13`)).status, 404);

const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const issue of listing.issues) {
    const path = `/issues/${issue.slug}`;
    for (const headers of [{}, { "if-none-match": "*", "if-modified-since": new Date(Date.now() + 86400000).toUTCString() }]) {
      const response = await fetch(base + path, { headers, redirect: "manual" });
      assert.equal(response.status, 200); assert.equal(response.headers.get("location"), null);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const html = await response.text();
      const meta = await page.evaluate(text => {
        const doc = new DOMParser().parseFromString(text, "text/html");
        return { title: doc.title, url: doc.querySelector('meta[property="og:url"]')?.content, tags: doc.querySelectorAll('meta[property="og:title"]').length, hasRoot: !!doc.querySelector("#root") };
      }, html);
      assert.equal(meta.title, `${issue.title} | 사이`);
      assert.equal(meta.url, `https://sai-newsletter.baze.cloud${path}`);
      assert.equal(meta.tags, 1); assert.ok(meta.hasRoot);
    }
    const head = await fetch(base + path, { method: "HEAD" });
    assert.equal(head.status, 200); assert.equal(await head.text(), "");
  }
  const routes = ["/", "/archive", "/sources", "/subscribe", "/unsubscribe", "/admin", ...listing.issues.map(issue => `/issues/${issue.slug}`)];
  const resources = new Set();
  for (const path of routes) {
    const response = await page.goto(base + path, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200); assert.ok(await page.title());
    assert.equal(await page.locator("html").getAttribute("lang"), "ko");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `가로 넘침: ${path}`);
    assert.equal(await page.locator("input:not([type=hidden]),select,textarea").evaluateAll(nodes => nodes.filter(node => !node.labels?.length && !node.getAttribute("aria-label") && !node.getAttribute("aria-labelledby")).length), 0);
    assert.equal(await page.locator("img:not([alt])").count(), 0);
    for (const url of await page.locator("a[href],img[src],script[src],link[rel=stylesheet]").evaluateAll(nodes => nodes.map(node => node.href ?? node.src).filter(Boolean))) if (url.startsWith(`${base}/`)) resources.add(url);
  }
  // CSV는 HTML 페이지가 아니다. 다운로드 응답으로 확인한다.
  const csv = await fetch(`${base}/api/sources.csv`);
  assert.equal(csv.status, 200); assert.ok(csv.headers.get("content-disposition").includes("sai-sources.csv"));
  for (const url of resources) { const response = await fetch(url); assert.ok(response.ok, `끊어진 링크 또는 파일: ${new URL(url).pathname}`); await response.body?.cancel(); }
  assert.equal(errors.length, 0);
  console.log(`배포용 ${routes.length}개 화면·글별 공유 태그·조건부 새로고침·모바일·파일·CSV 다운로드 확인 통과`);
} finally { await browser.close(); }
