import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { buildHeaders, inlineScriptHashes, resolveApiOrigin } from "./csp.mjs";

const sha = (s) => `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`;

test("HTML의 인라인 스크립트 해시를 모두 모으고 src 있는 스크립트·빈 스크립트는 뺀다", () => {
  const html = [
    '<script>self.__next_f.push([1,"a"])</script>',
    '<script src="/_next/static/x.js" async></script>',
    '<script id="n">b()</script>',
    "<script></script>",
  ].join("");
  assert.deepEqual([...inlineScriptHashes([html])].sort(), [sha('self.__next_f.push([1,"a"])'), sha("b()")].sort());
});

test("CSP에 모든 해시와 API 출처가 들어가고 unsafe-inline 스크립트는 없다", () => {
  const headers = buildHeaders(new Set([sha("a")]), "https://api.example.com");
  const csp = headers.split("\n").find((l) => l.includes("Content-Security-Policy"));
  assert.match(csp, /script-src 'self' 'sha256-/);
  assert.ok(csp.includes(sha("a")));
  assert.ok(csp.includes("connect-src 'self' https://api.example.com"));
  assert.ok(!/script-src[^;]*unsafe-inline/.test(csp));
  assert.ok(headers.includes("frame-ancestors 'none'"));
  assert.ok(headers.includes("Referrer-Policy: no-referrer"));
});

test("CSP가 Cloudflare 한 줄 한도(2,000자)를 넘으면 실패한다", () => {
  const many = new Set(Array.from({ length: 40 }, (_, i) => sha(String(i))));
  assert.throws(() => buildHeaders(many, "https://api.example.com"), /2000/);
});

test("API 주소가 없거나 localhost가 아닌 http면 실패하고, https와 로컬 http는 받는다", () => {
  assert.throws(() => resolveApiOrigin(undefined), /NEXT_PUBLIC_API_BASE_URL/);
  assert.throws(() => resolveApiOrigin("http://api.example.com"), /https/);
  assert.throws(() => resolveApiOrigin("not a url"));
  assert.equal(resolveApiOrigin("https://api.example.com/x"), "https://api.example.com");
  assert.equal(resolveApiOrigin("http://localhost:8080"), "http://localhost:8080");
  assert.equal(resolveApiOrigin("http://127.0.0.1:8081"), "http://127.0.0.1:8081");
});
