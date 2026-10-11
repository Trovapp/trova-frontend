// 빌드(out/) 뒤에 Cloudflare Pages용 out/_headers를 만든다(ADR 0012 "웹 보안 헤더").
// Next.js 정적 페이지는 HTML 안에 인라인 스크립트(페이지 데이터)를 넣는다 — 'unsafe-inline' 대신
// 그 스크립트들의 sha256 해시만 허용해 script-src를 'self' + 해시로 묶는다. 빌드할 때마다 다시 계산된다.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
// Cloudflare Pages _headers는 헤더 한 줄이 2,000자를 넘으면 안 된다.
const MAX_HEADER_LENGTH = 2000;

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

const hashes = new Set();
const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
for (const file of htmlFiles(OUT)) {
  for (const match of readFileSync(file, "utf8").matchAll(inlineScript)) {
    if (match[1].length > 0) {
      hashes.add(`'sha256-${createHash("sha256").update(match[1], "utf8").digest("base64")}'`);
    }
  }
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!apiBase) {
  console.warn(
    "[csp] NEXT_PUBLIC_API_BASE_URL이 없어 http://localhost:8080으로 둡니다 — 운영 빌드에서는 꼭 설정하세요.",
  );
}
const apiOrigin = new URL(apiBase ?? "http://localhost:8080").origin;

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].sort().join(" ")}`,
  // 그래프 라이브러리(recharts)와 막대 너비가 style 속성을 쓴다. 스크립트가 아니라 위험이 작아 허용한다.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${apiOrigin}`,
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

if (csp.length > MAX_HEADER_LENGTH) {
  console.error(
    `[csp] CSP가 ${csp.length}자라 Cloudflare 한도(${MAX_HEADER_LENGTH}자)를 넘습니다 — 페이지별 규칙으로 나눠야 합니다.`,
  );
  process.exit(1);
}

writeFileSync(
  join(OUT, "_headers"),
  [
    "/*",
    `  Content-Security-Policy: ${csp}`,
    "  Referrer-Policy: no-referrer",
    "  X-Content-Type-Options: nosniff",
    "  X-Frame-Options: DENY",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
    "  X-Robots-Tag: noindex, nofollow",
    "",
  ].join("\n"),
);
console.log(`[csp] out/_headers 작성: 인라인 스크립트 해시 ${hashes.size}개, CSP ${csp.length}자, API ${apiOrigin}`);
