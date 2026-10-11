# Trova 관리자 웹 (admin-web)

운영 대시보드 — 요약 카드 4개, 탭 4개(AI 한도·호출 / 분석 파이프라인 / 서버 상태 / 사용 데이터).
설계·결정: Trovapp/trova-backend `docs/superpowers/specs/2026-10-11-admin-dashboard-design.md`, `docs/adr/0012-admin-dashboard-web.md`.

기존 웹 앱(레포 루트)과 따로 빌드·배포한다. 서버 없는 정적 사이트(Next.js `output: "export"`)라 Cloudflare Pages 무료에 올린다.

## 로컬 실행

```bash
cd admin-web
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
npm run dev                  # http://localhost:3001
```

백엔드는 `ADMIN_USERS`(관리자 계정), `APP_ADMIN_WEB_URL=http://localhost:3001`로 띄운다.

## 로그인 흐름

1. 로그인 화면에서 구글·카카오 → 백엔드 `/oauth2/authorization/{provider}?client=admin-web`
2. 관리자면 백엔드가 `/auth/callback/?code=<1회용, 60초>`로 돌려보냄(아니면 `?error=forbidden`)
3. 콜백 화면이 `POST /api/auth/exchange`로 1시간 토큰을 받아 메모리 + sessionStorage에만 둔다(탭을 닫으면 다시 로그인)
4. 관리자 API는 `Authorization: Bearer` 토큰만, 쿠키는 쓰지 않는다

## 빌드와 보안 헤더

`npm run build` = `next build` + `scripts/csp-headers.mjs`. 뒤 스크립트가 `out/` HTML의 인라인 스크립트 해시를 계산해
`out/_headers`(Cloudflare Pages 헤더 파일)를 만든다 — CSP `script-src 'self' <해시들>`(`'unsafe-inline'` 없이),
`frame-ancestors 'none'`, `Referrer-Policy: no-referrer` 등. 빌드 때 `NEXT_PUBLIC_API_BASE_URL`이 CSP `connect-src`에도 들어간다.

## Cloudflare Pages 배포

- 프로젝트 루트 디렉터리: `admin-web`, 빌드 명령: `npm run build`, 출력: `out`
- 환경 변수: `NEXT_PUBLIC_API_BASE_URL=https://<운영 백엔드>`
- 앞에 Cloudflare Access(이메일 1회용 코드)를 둔다
- 배포 뒤 백엔드 운영 설정 `APP_ADMIN_WEB_URL=https://<프로젝트>.pages.dev`
