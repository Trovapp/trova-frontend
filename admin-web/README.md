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
2. 관리자면 백엔드가 `/auth/callback/?code=<1회용, 60초>`로 돌려보냄(아니면 `?error=forbidden`). 교환 실패는 원인별(만료·권한·횟수 제한·연결)로 안내
3. 콜백 화면이 `POST /api/auth/exchange`로 1시간 토큰을 받아 메모리 + sessionStorage에만 둔다(탭을 닫으면 다시 로그인)
4. 관리자 API는 `Authorization: Bearer` 토큰만, 쿠키는 쓰지 않는다

## 확인

```bash
npm run lint && npm test && npm run build
```

`npm test`는 의존성 없이 Node 내장 `node --test`로 CSP 생성(`scripts/csp.test.mjs`)과 토큰 만료 판단(`src/lib/session.test.ts`, Node 23.6+ 타입 제거 실행)을 검사한다.

## 사용자·조치 기록 화면(2단계)

"사용자" 탭에서 닉네임·번호로 사용자를 찾아 상세를 보고, 여행 삭제·계정 삭제·분석 다시 실행·초안 숨기기·정지/정지 풀기를 미리보기 → 사유·확인 글자 → 실행 순서로 한다(로그인한 지 10분이 지나면 다시 로그인). "조치 기록" 탭은 최근 50개 기록을 보여 주며, 기본은 "조치만 보기"(끄면 열람·검색·로그인 기록까지)다.

## 빌드와 보안 헤더

`npm run build` = `next build` + `scripts/csp-headers.mjs`. 뒤 스크립트가 `out/` HTML의 인라인 스크립트 해시를 계산해
`out/_headers`(Cloudflare Pages 헤더 파일)를 만든다 — CSP `script-src 'self' <해시들>`(`'unsafe-inline'` 없이),
`frame-ancestors 'none'`, `Referrer-Policy: no-referrer` 등. 빌드 때 `NEXT_PUBLIC_API_BASE_URL`이 CSP `connect-src`에도 들어간다 — 없거나 `https`가 아니면(로컬 `localhost`만 예외) 빌드가 실패한다.

## Cloudflare 배포 (Workers 정적 사이트)

2026-10-12: Cloudflare Pages가 Workers로 합쳐져 Workers 정적 사이트로 올린다. 주소 **https://admin.trovapp.workers.dev**(설정 `wrangler.jsonc`).

```bash
NEXT_PUBLIC_API_BASE_URL=https://<운영 백엔드> npm run build && npx wrangler@4 deploy
```

- 배포 뒤 백엔드 운영 설정 `APP_ADMIN_WEB_URL=https://admin.trovapp.workers.dev`, `ADMIN_USERS=<로그인제공자:제공자사용자ID>`
- 앞에 Cloudflare Access(이메일 1회용 코드)를 두는 것은 아직 안 함(관리자 데이터는 관리자 전용 토큰으로만 열린다)
