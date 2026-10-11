// CSP·보안 헤더를 만드는 순수 함수들 — csp-headers.mjs(빌드)와 csp.test.mjs(node --test)가 쓴다.
import { createHash } from "node:crypto";

// Cloudflare Pages _headers는 헤더 한 줄이 2,000자를 넘으면 안 된다.
export const MAX_HEADER_LENGTH = 2000;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** src가 없는 인라인 <script>의 sha256 해시(CSP 표기). 빈 스크립트는 실행할 것이 없어 뺀다. */
export function inlineScriptHashes(htmlList) {
  const hashes = new Set();
  const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  for (const html of htmlList) {
    for (const match of html.matchAll(inlineScript)) {
      if (match[1].length > 0) {
        hashes.add(`'sha256-${createHash("sha256").update(match[1], "utf8").digest("base64")}'`);
      }
    }
  }
  return hashes;
}

/**
 * 백엔드 출처. 빠지거나 localhost가 아닌 http면 실패한다 — 운영 빌드가 조용히 localhost를 부르거나,
 * 1회용 코드·관리자 토큰이 평문 http로 오가지 않게(웹 #5 리뷰).
 */
export function resolveApiOrigin(apiBase) {
  if (!apiBase) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL이 없습니다 — 운영은 https://<백엔드>, 로컬은 .env.local에 http://localhost:8080",
    );
  }
  const url = new URL(apiBase);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname))) {
    throw new Error(`NEXT_PUBLIC_API_BASE_URL은 https여야 합니다(로컬만 http 허용): ${url.origin}`);
  }
  return url.origin;
}

/** Cloudflare Pages _headers 내용. CSP가 한 줄 한도를 넘으면 실패한다(페이지별 규칙으로 나눠야 함). */
export function buildHeaders(hashes, apiOrigin) {
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
    throw new Error(
      `CSP가 ${csp.length}자라 Cloudflare 한도(${MAX_HEADER_LENGTH}자)를 넘습니다 — 페이지별 규칙으로 나눠야 합니다.`,
    );
  }
  return [
    "/*",
    `  Content-Security-Policy: ${csp}`,
    "  Referrer-Policy: no-referrer",
    "  X-Content-Type-Options: nosniff",
    "  X-Frame-Options: DENY",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
    "  X-Robots-Tag: noindex, nofollow",
    "",
  ].join("\n");
}
