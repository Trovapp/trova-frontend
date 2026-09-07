# TODO

작업 진행하면서 계속 갱신할 것. 완료 시 [x] 체크. 새로 파악된 작업은
적절한 단계 아래에 추가.

## 1단계: 프로젝트 세팅
- [x] Next.js 프로젝트 초기화 (App Router, TypeScript, Tailwind)
- [x] 폴더 구조 잡기 (app/, components/, lib/api/) — components/는 2단계에서 첫 컴포넌트 만들 때 생성
- [x] SavedPlace 타입 정의 (CLAUDE.md 참고)
- [x] mock API 함수 작성 (lib/api/mock.ts) — 백엔드 준비 전까지 사용

## 2단계: 화면 구현 (mock 데이터 기준)
- [x] 디자인 시스템 반영 (trova-color-tokens.md 기준 컬러, Pretendard/IBM Plex Mono 폰트, 앱 아이콘)
- [x] 로그인 화면 — 카카오 우선/구글 보조, 이메일 로그인은 접힌 상태로 UI만 (백엔드 미지원)
- [x] 로그인 상태 관리 (AuthContext, 실제 백엔드 `/api/auth/me` `/api/auth/logout` 연동 완료 — mock 아님)
- [x] 홈 화면: URL 입력 폼 (히어로, mock createShare 연동)
- [x] 저장 목록 화면 (`/places`) — 카드 리스트, 카테고리 배지, mock getPlaces 연동
- [ ] 홈 화면: 목록/지도 토글
- [x] 카카오맵 SDK 연동, 핀 표시 (F4~F5: Kakao SDK 통합 + 일정형 영상 마커/폴리라인 렌더링)
- [ ] 처리 대기열 화면 (상태 폴링 UI, 지금은 mock으로)
- [ ] 장소 상세 화면

## 3단계: 실제 백엔드 연동
- [x] SavedPlace `category` 필드 — 백엔드 응답의 실제 category 문자열(restaurant/cafe/attraction/lodging/shopping/other)에 맞춰 `CATEGORY_LABEL` 매핑 확정, 실제 데이터로 라벨 정상 표시 확인
- [x] mock 함수를 실제 fetch 호출로 교체 — `feat/connect-places-api` 브랜치, 커밋 `a85bdd4`(PR #2). `lib/api/mock.ts` 제거, `lib/api/places.ts`가 실제 `/api/places`·`/api/places/pending`·`/api/shares` 호출
- [x] `GET /api/places/pending` 반환 status 확인 — `PENDING`/`PROCESSING`/`FAILED` 세 가지(백엔드 `JobStatus`, PR #2에서 FAILED도 포함하도록 확장됨), 타입도 이에 맞춤
- [x] CORS 이슈 확인 — 백엔드(8080)·프론트(3001) 로컬에서 실제로 같이 띄워서 세션 쿠키 포함 크로스 오리진 요청 전부 정상 동작 확인(로그인/장소 저장/조회/삭제 전체 플로우)
- [x] 로딩/에러 상태 처리 — `/places`·`/mypage` 로딩 텍스트, `UrlInputForm`/`places.ts`/`users.ts` 에러 메시지 처리 반영

- [x] 마이페이지 화면(`/mypage`) — 백엔드 `GET/DELETE /api/users/me` 연동. 프로필(닉네임/프로필이미지/로그인수단/가입일) 표시 + 회원탈퇴(브라우저 기본 confirm 확인 → 삭제 후 로그아웃 상태 반영하고 홈으로 이동). 헤더 닉네임을 `/mypage` 링크로 변경. `feat/mypage` 브랜치, 커밋 `e8efb71`. `npm run lint`/`npm run build` 통과, 비로그인 게이팅 화면은 브라우저로 확인함 — 로그인 상태 렌더링과 실제 탈퇴 플로우는 실계정 삭제라 자동화로는 못 해보고 코드 리뷰만 함(사용자가 직접 로그인해서 확인 필요)

## 4단계: 배포
- [ ] Vercel 배포 연결
- [ ] 환경변수 설정 — API URL, `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`(배포 환경에도 동일하게 설정 필요) + Kakao Developers 콘솔 > 플랫폼 > Web에 실제 배포 도메인 등록(로컬 `.env.local`/`localhost` 등록만으로는 배포 후 지도가 안 뜸)

## 백로그 (지금 안 함)
- [ ] 지오펜싱 알림 (웹에서는 구현 불가 영역)
- [x] 일정 자동 생성 — 이 항목은 "Gemini가 태그한 dayNumber로 일자별 탭 UI를 보여주는 것"을 의미했고, 해당 기능은 이번 일정형 영상 프론트엔드 작업(F1~F7, 커밋 `fd8c8d3`..`c5d0db7`)으로 완료됨. 아래 "일정 미분류 영상에 Gemini 추천 코스 자동 생성" 항목은 이것과 별개로, dayNumber 태그가 아예 없는 영상에 AI가 새 코스를 제안하는 것이라 계속 백로그로 남김
- [ ] 영상별 탭 UI 비일정 영상 확대 적용 (groupBySourceUrl 재사용, 차후 브레인스토밍)
- [ ] 일정 미분류 영상에 Gemini 추천 코스 자동 생성 (좌표/장소명 기반 입력 선택 필요, 차후 브레인스토밍)
- [ ] 추출 장소명 검증 (영상 자막과의 불일치 케이스 조사 — STT/hallucination 여부 파악 필요, 차후 브레인스토밍)
