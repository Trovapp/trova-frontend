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

## 2026-08-21 일정형 영상 프론트엔드 완성 (F1~F7)

**한 것:**
- `SavedPlace` 엔티티에 `dayNumber`/`orderInDay` 필드 추가 + API 매핑 (F1+F2)
- `src/lib/itinerary.ts`: 영상별/날짜별 그룹화 순수함수 3개 (`groupBySourceUrl`, `isItineraryGroup`, `groupByDay`) — 테스트 용이성과 재사용성 목표
- Kakao Maps JS SDK 첫 통합: `src/lib/kakao.d.ts`(타입 정의) + `src/lib/kakaoMapLoader.ts`(동적 로드) (F4)
- `src/components/KakaoMap.tsx`: 마커 렌더링 + 장소 순서를 따르는 주황색 폴리라인 (실제 routing API는 별도 유료 서비스이므로 미사용, 비용 정책 준수) (F5)
- `src/components/ItineraryView.tsx`: 일차별 탭 UI ("1일차"/"2일차" 버튼, 탭 클릭 시 지도+목록 함께 전환) (F6)
- `src/app/places/page.tsx`: 일정 태그된 영상은 `<ItineraryView>`, 아닌 영상은 기존 평면 `<PlaceCard>` 리스트로 조건부 렌더링 (F7)
- **실제 end-to-end 검증:** 백엔드(8080) + 프론트(3001) 함께 실행, 실계정 Kakao OAuth 로그인 → 실제 YouTube Shorts URL 제출(WXxvV3FMLe8) → 파이프라인 처리(인천 4곳 추출, 그러나 일정 분류 안 됨 → 평면 리스트 렌더링으로 정상 동작 확인) → Supabase에 테스트 데이터 직접 시딩(부산 3곳 1일차 + 3곳 2일차, 실제 좌표) → `/places` 새로고침 → "1일차"/"2일차" 탭 버튼 렌더링 확인 → Kakao 지도 마커+폴리라인 각 일차 별로 정상 표시 확인 → 탭 클릭 시 지도+목록 함께 전환 확인 → 기존 평면 목록(실제 인천 결과, 이전 테스트 부산 데이터) 함께 렌더링 정상 확인 → 테스트 데이터 삭제(저장_위치, 처리_작업) → 실제 인천 데이터는 보존. 에러 없음.
- `/mypage` 실계정 데이터 렌더링도 함께 확인(이전 기능의 미확인 부분).

**왜 이렇게 했는지:**
- Kakao Maps SDK를 JS 라이브러리로 직접 로드 — 국내 좌표 정확도 우선, React 패키지는 타입/유지보수 부담 대비 이점 적음
- Routing API 미사용 — Kakao의 경로 탐색은 별도 유료 제품이라 비용 정책(0원 유지) 준수 위해 직선 폴리라인만 사용 (실제 여행 영상의 경우 촬영 순서 시각화가 목표이므로 충분)
- 그룹화 로직을 순수함수로 분리 — 테스트와 재사용성, 향후 변경(예: 비일정 영상도 영상별 탭 UI 적용)에 유리
- 일정 분류는 Gemini 판단에만 의존 — 영상의 실제 나레이션/자막이 명확한 일차 정보를 담고 있어야만 자동 분류됨. 이번 YouTube Shorts 25개 검증(CLAUDE.md, 2026-08-20)에서 25/25 성공했으나, 실제 프로덕션 사용자 영상은 무조건 분류되지 않을 수 있음 — 정상 동작

**막힌 것 / 다음에 주의할 것:**
- 실제 사용자 영상 중 일정 구조를 Gemini가 감지한 사례를 아직 못 찾음 — 테스트된 YouTube Shorts(25개 검증용 배치)와 이번 제출 영상(WXxvV3FMLe8) 모두 명시적 일차 구분("1일차"/Day 1 나레이션 등) 없어서 분류 안 됨. 향후 이러한 콘텐츠를 찾거나 생성해서 실제 "1일차"/"2일차" 탭 UI가 사용자에게 어떻게 보이는지 확인 필요
- 테스트 데이터 시딩 방식(Supabase 직접 쿼리)은 개발 검증 용으로만 유효 — CI/자동화된 E2E 테스트 단계에서는 별도 테스트 계정/seed 스크립트 필요
- 지오코딩 실패 케이스(카카오 API 요청 실패 등)에 대한 프론트 에러 처리는 아직 구현 안 됨 — 백엔드에서 503 에러 반환 시 프론트의 상태 처리 로직 추가 필요
- 실배포 도메인 등록은 아직 안 함 — `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`는 로컬 `.env.local`에만 있고, Vercel 등 실제 배포 시 (a) 배포 환경에도 같은 env var를 설정하고 (b) Kakao Developers 콘솔 > 플랫폼 > Web에 실제 배포 도메인을 추가로 등록해야 지도가 뜸 — 지금 로컬(`localhost:3001`)만 등록돼 있어서 배포 직후엔 지도가 안 뜰 것

---
