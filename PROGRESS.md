# Progress Log

작업이 끝날 때마다 아래 형식으로 추가할 것. 다음 세션에서 이 파일만 읽고
전체 맥락을 파악할 수 있어야 함.

---

## 2026-08-19 프로젝트 세팅 (1단계)

**한 것:**
- `create-next-app`으로 초기화 (App Router, TypeScript, Tailwind, `src/` 디렉토리, `@/*` alias)
- `src/lib/types.ts`에 `SavedPlace` 타입 정의 (CLAUDE.md 스펙 그대로)
- `src/lib/api/mock.ts`에 5개 mock API 함수 작성: `createShare`, `getPlaces`, `getPlace`, `deletePlace`, `getPendingPlaces` — 각 함수는 500ms 지연 후 응답 (실제 네트워크처럼 동작해야 로딩 UI를 제대로 테스트할 수 있어서)
- `npm run lint && npm run build` 통과 확인

**왜 이렇게 했는지:**
- `src/` 디렉토리 사용 — 레포 루트를 CLAUDE.md/TODO.md/PROGRESS.md 같은 문서와 소스 코드로 분리해서 깔끔하게 유지
- mock 함수 위치를 미리 실제 API 함수가 들어갈 `lib/api/` 아래로 잡아서, 3단계에서 fetch로 교체할 때 import 경로가 안 바뀌게 함
- `components/` 폴더는 아직 안 만듦 — git이 빈 폴더를 추적하지 않아서, 2단계에서 첫 컴포넌트 만들 때 자연스럽게 생성

**막힌 것 / 다음에 주의할 것:**
- `create-next-app`이 기존 `.md` 파일들과 충돌해서 초기화 전에 잠시 밖으로 옮겼다가 되돌림 (내용 변경 없음)
- `GET /api/places/pending`이 정확히 어떤 status를 반환하는지 CLAUDE.md에 명시가 없어서, 일단 PENDING/PROCESSING만 mock으로 반환하게 해둠 — 3단계에서 백엔드와 확인 필요
- Next.js 16.3.1이 설치됐는데, `next dev` 실행 시 생성되는 `AGENTS.md`가 "이 버전은 기존 Next.js와 API/구조가 다를 수 있다"고 경고함 — 2단계에서 라우팅/데이터 페칭 코드 짤 때 `node_modules/next/dist/docs/`의 최신 문서를 먼저 확인할 것

---

## 2026-08-19 소셜 로그인 연동 + 디자인 시스템 적용 (2단계 일부)

**한 것:**
- 백엔드(trova-backend, PR #1)의 세션 쿠키 기반 Google/Kakao 소셜 로그인을 실제로 연동: `lib/api/auth.ts`(진짜 fetch, mock 아님) + `lib/auth/AuthContext.tsx`(클라이언트 사이드 로그인 상태 관리)
- `/login` 화면 — 카카오 우선(브랜드 컬러 `#FEE500`) + 구글 보조 + 이메일 로그인은 접힌 상태(백엔드 미지원이라 UI만, disabled)
- 헤더에 `AuthStatus` 컴포넌트로 로그인/로그아웃 상태 상시 표시
- 홈 화면을 히어로(URL 인풋 + "장소 추출하기") 중심으로 완전히 교체, mock `createShare` 연동
- `/places` 저장 목록 화면 — 카드 리스트, `CategoryBadge`(아이템당 코랄 포인트 1개로 제한), 좌표/타임스탬프는 모노스페이스 폰트로 구분
- 디자인 토큰(`--color-bg/ink/accent` 등) 반영, Pretendard(한글) + IBM Plex Mono(숫자/메타) 폰트 적용, 앱 아이콘을 `app/icon.svg`(파비콘) + `public/trova-icon.svg`(헤더 로고)로 반영
- `SavedPlace` 타입에 `category` 필드 추가 (mock 전용, 실제 API 응답 형태를 예상해서 미리 반영)
- 백엔드+프론트 로컬 서버를 실제로 같이 띄워서(백엔드 8080, 프론트 3001) 크로스 오리진 세션 쿠키 흐름 에러 없이 동작 확인
- `npm run lint && npm run build` 통과 확인

**왜 이렇게 했는지:**
- 로컬 3000번 포트가 이미 다른 프로젝트(Grafana)에서 쓰이고 있어서, 프론트를 3001로 띄우고 백엔드 `FRONTEND_URL`도 함께 맞춤 — 로컬 개발 시 매번 이 포트 조합을 기억해야 함
- SavedPlace/ProcessingJob API가 아직 백엔드에 없어서, 이번 작업 범위는 로그인 연동 + 디자인 시스템 적용 + 기존 mock 화면(홈/목록)에 디자인만 입히는 것으로 한정. 지도 토글/상세/대기열은 다음 단계
- 컬러 사용 규칙(코랄은 화면의 10% 이내, 리스트 아이템당 아이콘 하나로 제한)을 컴포넌트 레벨에서 강제하기 위해 `CategoryBadge`를 별도 컴포넌트로 분리 — 재사용할 때마다 규칙이 자동으로 지켜지도록

**막힌 것 / 다음에 주의할 것:**
- 지금까지의 모든 프론트 코드(1단계 create-next-app 스캐폴딩 포함)가 실제로는 한 번도 커밋된 적이 없었음 — `git log`에 "Initial commit"(README.md 한 줄)만 있었음. 이번에 `feat/social-login-ui` 브랜치로 처음 커밋함
- 실제 로그인은 백엔드 쪽(trova-backend)에서 구글/카카오 둘 다 실계정으로 검증 완료. 프론트에서는 버튼 href/CORS/세션 쿠키 흐름까지만 확인했고, 브라우저로 끝까지 눌러서 헤더에 닉네임 뜨는 것까지는 다음에 확인 필요
- 프로필 이미지가 없는 카카오 계정은 카카오 기본 프로필 이미지 URL이 내려옴 — 프론트에서 별도 처리 안 해도 되는지 확인 필요 (일단은 그냥 `<img>`로 사용)

---

## 2026-08-21 마이페이지 화면 (`/mypage`)

**한 것:**
- 백엔드(trova-backend)에 새로 추가된 `GET/DELETE /api/users/me`에 맞춰 `src/lib/api/users.ts` 작성(`places.ts`와 동일한 fetch 패턴, provider 값 한글 라벨 매핑)
- `src/app/mypage/page.tsx` 신규 — `/places`와 동일하게 `useAuth()` 게이팅 + 클라이언트 컴포넌트 패턴. 프로필(닉네임/프로필이미지/로그인수단/가입일) 표시, "회원탈퇴" 버튼(브라우저 기본 `confirm()` 확인 → `DELETE /api/users/me` → `useAuth().refresh()`로 로그아웃 상태 반영 → 홈으로 이동)
- `AuthStatus.tsx`의 헤더 닉네임 텍스트를 `/mypage`로 가는 링크로 변경
- `main`에서 새로 브랜치를 딴 `feat/mypage`(기존 `feat/connect-places-api`는 이미 PR #2가 열려있어서 무관한 기능을 얹지 않으려고 분리함), 커밋 `e8efb71`. `npm run lint`/`npm run build` 통과
- 브라우저로 비로그인 상태 게이팅 화면("로그인이 필요해요")까지는 확인함

**왜 이렇게 했는지:**
- 회원탈퇴 확인 UX는 커스텀 모달 대신 브라우저 기본 `confirm()`으로 — 이 프로젝트 규모에서는 충분하고 구현이 가장 간단하다고 사용자와 합의
- 새 브랜치로 분리한 이유: `feat/connect-places-api`는 이미 리뷰 대기 중인 PR #2가 있어서, 별개 기능(마이페이지)을 같은 브랜치에 얹으면 PR 리뷰 범위가 섞임

**막힌 것 / 다음에 주의할 것:**
- 로그인 상태에서의 실제 렌더링과 회원탈퇴 버튼 클릭까지의 end-to-end 확인은 안 함 — 회원탈퇴가 실제 계정을 진짜로 삭제하는 동작이라 자동화로 함부로 눌러볼 수 없어서, 코드 리뷰 수준까지만 확인함. 사용자가 직접 로그인해서 `/mypage` 렌더링 + (원한다면 테스트 계정으로) 탈퇴 플로우 확인 필요
- 아직 push 안 함, PR도 안 만듦

---

## [날짜] 작업 제목

**한 것:**
- (완료한 작업 요약, 2~3줄)

**왜 이렇게 했는지:**
- (핵심 결정 이유. 예: "지도는 카카오맵 SDK로 — 국내 장소 정확도 우선")

**막힌 것 / 다음에 주의할 것:**
- (있으면 기록, 없으면 생략)

---

---

## 2026-10-11 관리자 운영 대시보드 웹 admin-web (#5)

**한 것:**
- 레포 안에 별도 앱 `admin-web/`(Next.js 16 정적 내보내기) — 로그인(구글·카카오 → 1회용 코드 → 1시간 관리자 토큰), 요약 카드 4개, 탭 4개(AI 한도·호출 / 분석 파이프라인 / 서버 상태 / 사용 데이터), 기간 7·14·30일
- 백엔드: Trovapp/trova-backend#162(집계 API), #164(관리자 웹 로그인·전용 토큰). 결정은 백엔드 ADR 0012
- 그래프 recharts 3.10.1(고정). 색은 dataviz 기본 팔레트 두 색(검증 스크립트로 라이트·다크 모두 색약 기준 통과), 범례는 정한 순서·글자 색, 모든 그래프에 "표로 보기"
- `scripts/csp-headers.mjs`: 빌드 뒤 인라인 스크립트 해시로 Cloudflare `_headers`의 CSP를 만든다

**왜 이렇게 했는지:**
- 별도 앱: 기존 웹 앱은 Vercel용이고 정적 내보내기로 바꿀 수 없어서, 관리자 웹만 따로 빌드해 Cloudflare Pages(무료)에 올린다(Vercel 무료는 상업적 사용 불가 — ADR 0012). 루트 `tsconfig`·`eslint`에서 `admin-web/`을 빼 두 앱이 섞이지 않게 함
- CSP: Next.js 정적 페이지는 인라인 스크립트가 꼭 필요하고(문서: nonce는 동적 렌더링에서만, SRI는 외부 파일만), 설계는 `script-src 'self'`라 `'unsafe-inline'` 대신 빌드 때 해시를 계산
- 정적 내보내기라 `useSearchParams` 대신 `window.location`을 읽고, 로그인 코드는 읽자마자 주소창에서 지운다

**확인한 것(로컬: 백엔드 #164 브랜치 8081 + 개발 DB, 관리자 웹 3002에 `_headers`를 붙여 서빙, 헤드리스 Chrome):**
- 관리자 API 5개를 실제로 불러 그리기, 콘솔 오류·CSP 위반 0, 휴대폰 폭(390px) 가로 넘침 없음, 다크 모드
- 처음 캡처에서 고친 것: 세로축 숫자 잘림(→ 만 단위 줄임), 범례 글자가 시리즈 색·쌓은 막대에서 순서 뒤집힘(→ HTML 범례), 휴대폰 탭 줄 스크롤바, 파비콘 404
- 해시가 어긋나면(예전 `_headers` + 새 HTML) 브라우저가 인라인 스크립트를 실제로 막는 것도 확인 — Pages에는 같은 빌드에서 함께 올라가 어긋나지 않는다
- `npm run lint && npm run build`: 루트 앱·admin-web 둘 다 통과

**확인하지 않은 것 / 다음에 주의할 것:**
- 실제 구글·카카오 로그인 → 콜백 → 교환 왕복: 로컬 OAuth 돌아올 주소가 8080 기준이라 이번엔 토큰을 로컬 서명 키로 만들어 넣고 확인함. 백엔드 #164를 8080에 띄운 뒤 직접 로그인해 볼 것
- Cloudflare Pages 배포·Access 설정(계정 필요), 운영 백엔드 `APP_ADMIN_WEB_URL` 설정

**PR 리뷰(reviewflow) 반영:**
- 7건(중간 3·낮음 4) 모두 고침: 운영 빌드에 백엔드 주소가 없거나 http면 빌드 실패, 만료 시각이 없는 저장 토큰은 만료로, 코드 교환 실패를 원인별 안내(403 권한·429 횟수·400 만료·연결 실패), 로그인 실패 경로 확인, API 함수를 `lib/api/admin.ts`로(레포 규칙), 설계대로 일정 초안 멈춤·실패 표시(백엔드 #162에 집계 추가), 백엔드 ADR·설계의 화면 위치를 "별도 앱, 주소 루트"로 정정
- 백엔드가 돌려보내는 주소를 `/auth/callback/`(끝 `/`)로 — 정적 호스팅이 끝 `/`를 붙여 다시 보낼 때 `?code=`가 떨어질 위험을 없앰(백엔드 #164)
- `npm test`(node --test, 의존성 없음) 8개: CSP 해시·API 주소 검사·한도, 토큰 만료 판단
- 확인(로컬, 헤드리스 Chrome): `/auth/callback/?error=forbidden`·코드 없음·잘못된 코드 → 각각 맞는 안내, 만료 시각 없는 토큰 → 로그인 화면, CSP 위반 0

