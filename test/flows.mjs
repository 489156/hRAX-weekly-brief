import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { api, ui } from "./checks.mjs";

const base = process.env.CHECK_BASE ?? "http://localhost:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("검증용 신청은 로컬 미리보기에서만 만들어요.");
if (!process.env.ADMIN_TOKEN) throw new Error("검증에 필요한 관리자 연결이 없어요.");
const password = process.env.ADMIN_TOKEN, owner = { authorization: `Bearer ${encodeURIComponent(password)}` };
// 로컬 검증끼리 요청 제한 횟수를 소진하지 않도록 문서용 대역의 서로 다른 주소를 쓴다.
const checkIp = `192.0.2.${Number(BigInt(`0x${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`) % 250n) + 1}`;
async function call(path, init = {}) {
  const response = await fetch(base + path, { ...init, headers: { "content-type": "application/json", "cf-connecting-ip": checkIp, ...(init.headers ?? {}) } });
  const body = response.headers.get("content-type")?.includes("application/json") ? await response.json() : await response.text();
  return { status: response.status, body };
}
await api({ call, owner });
console.log("관리자 보호·발행 한도·구독 실제 저장·동시 중복·취소 검증 통과");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require("/usr/local/lib/node_modules/playwright")); }
process.env.PLAYWRIGHT_BROWSERS_PATH ??= "/opt/pw-browsers";
const output = "/tmp/opencode/sai-checks";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  for (const width of [1440, 375, 402]) {
    const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: "reduce", extraHTTPHeaders: { "cf-connecting-ip": checkIp } });
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await ui({ page, base, call, owner, password, shot: (name, options = {}) => page.screenshot({ path: `${output}/${width}-${name}.png`, ...options }) });
      if (errors.length) throw new Error(`화면 오류 ${errors.length}건`);
      console.log(`${width} 너비: 목록·읽기·출처 필터·구독·관리·취소·가로 넘침 검증 통과`);
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
