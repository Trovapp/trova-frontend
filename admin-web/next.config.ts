import type { NextConfig } from "next";

// 관리자 웹은 서버 없이 Cloudflare Pages에 올리는 정적 사이트다(ADR 0012). 데이터는 전부 브라우저에서 백엔드 관리자 API로 받는다.
const nextConfig: NextConfig = {
  output: "export",
  // Pages가 /login → /login/index.html로 바로 찾게 한다.
  trailingSlash: true,
  images: { unoptimized: true },
  // 응답 헤더에 Next.js 표시를 남기지 않는다(정적 사이트라 Pages가 헤더를 정하지만 개발 서버에서도 같게).
  poweredByHeader: false,
};

export default nextConfig;
