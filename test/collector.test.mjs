import test from "node:test";
import assert from "node:assert/strict";
import { boundedText, canonicalUrl, parseFeed, robotsAllows } from "../worker/collect.ts";

const source = { id: "test", name: "수집 검증용", group: "AI", url: "https://example.org/", feed: "https://example.org/feed", priority: 50, lookback: 10 };
const date = "2026-11-13T10:00:00Z", now = Date.parse("2026-11-14T10:00:00Z");
const rss = (extra = "") => `<rss><channel><item><title>AI 공개 자료</title><link>https://example.org/post?utm_source=sample</link><pubDate>${date}</pubDate><description><![CDATA[<p>짧은 설명</p>${extra}]]></description></item></channel></rss>`;
test("원문 주소의 추적값·해시는 빼되 본문 식별값은 보존", () => {
  assert.equal(canonicalUrl("https://example.org/post/?utm_source=test&id=5#body"), "https://example.org/post?id=5");
  assert.throws(() => canonicalUrl("http://example.org/a"));
  assert.throws(() => canonicalUrl("https://user:password@example.org/a"));
});
test("수집 제한은 가장 긴 경로와 Allow 우선순위를 적용", () => {
  const rules = "User-agent: *\nDisallow: /private\nAllow: /private/public\nDisallow: /*?secret=*\nUser-agent: GPTBot\nDisallow: /";
  assert.equal(robotsAllows(rules, "/private/a"), false);
  assert.equal(robotsAllows(rules, "/private/public/a"), true);
  assert.equal(robotsAllows(rules, "/post?secret=1"), false);
  assert.equal(robotsAllows(rules, "/post"), true);
  assert.equal(robotsAllows("User-agent: SaiNewsletterBot\nDisallow: /\nUser-agent: *\nAllow: /", "/post"), false);
});
test("RSS 날짜·주소·제목을 확인하고 원문 밖 주소는 제외", () => {
  const items = parseFeed(rss(), source, now);
  assert.equal(items.length, 1); assert.equal(items[0].url, "https://example.org/post");
  assert.equal(parseFeed(rss().replace(date, "invalid"), source, now).length, 0);
  assert.equal(parseFeed(rss().replace(date, "2026-12-01T10:00:00Z"), source, now).length, 0);
  assert.equal(parseFeed(rss().replace(date, "2025-01-01T10:00:00Z"), source, now).length, 0);
  assert.equal(parseFeed(rss().replace("https://example.org/post", "https://outside.example/post"), source, now).length, 0);
});
test("CDATA의 코드 예시는 허용하지만 XML 외부 문서 선언은 거부", () => {
  assert.equal(parseFeed(rss("<!DOCTYPE html>"), source, now).length, 1);
  assert.throws(() => parseFeed('<!DOCTYPE rss SYSTEM "https://outside.example"><rss/>', source, now));
  assert.throws(() => parseFeed("<html>일시적인 서비스 오류</html>", source, now));
});
test("최대 크기보다 큰 자료는 중단", async () => {
  assert.equal(await boundedText(new Response("안녕하세요"), 100), "안녕하세요");
  await assert.rejects(boundedText(new Response("x".repeat(101)), 100));
});
