// 빌드(out/) 뒤에 Cloudflare Pages용 out/_headers를 만든다(ADR 0012 "웹 보안 헤더").
// Next.js 정적 페이지는 HTML 안에 인라인 스크립트(페이지 데이터)를 넣는다 — 'unsafe-inline' 대신
// 그 스크립트들의 sha256 해시만 허용해 script-src를 'self' + 해시로 묶는다. 빌드할 때마다 다시 계산된다.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import nextEnv from "@next/env";
import { buildHeaders, inlineScriptHashes, resolveApiOrigin } from "./csp.mjs";

const OUT = "out";

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

// next build와 같은 규칙으로 .env 파일을 읽는다(이 스크립트는 따로 도는 node 프로세스라서).
nextEnv.loadEnvConfig(process.cwd());

try {
  const hashes = inlineScriptHashes(htmlFiles(OUT).map((file) => readFileSync(file, "utf8")));
  const apiOrigin = resolveApiOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);
  writeFileSync(join(OUT, "_headers"), buildHeaders(hashes, apiOrigin));
  console.log(`[csp] out/_headers 작성: 인라인 스크립트 해시 ${hashes.size}개, API ${apiOrigin}`);
} catch (error) {
  console.error(`[csp] ${error.message}`);
  process.exit(1);
}
