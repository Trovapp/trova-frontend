/** 조치 기록의 조치 이름(서버 값) → 화면에 보일 한글 이름. 모르는 이름은 원문 그대로. */
export const ACTION_LABELS: Record<string, string> = {
  DELETE_TRIP: "여행 삭제",
  DELETE_ACCOUNT: "계정 삭제",
  RETRY_JOB: "분석 다시 실행",
  HIDE_DRAFT: "초안 숨기기",
  SUSPEND_USER: "정지",
  UNSUSPEND_USER: "정지 풀기",
  ADMIN_USER_VIEW: "사용자 열람",
  ADMIN_USER_SEARCH: "사용자 찾기",
  ADMIN_WEB_LOGIN: "로그인",
  ADMIN_WEB_LOGIN_DENIED: "로그인 거부",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}
