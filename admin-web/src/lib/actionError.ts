export type ActionErrorView =
  | { kind: "reauth"; message: string }
  | { kind: "retryPreview"; message: string }
  | { kind: "other"; message: string };

/** 실행·미리보기 실패를 창 안 안내로 바꾼다. code는 서버 본문 {"error": ...}의 값(409·400에서는 화면에 보일 문구). */
export function describeActionError(status: number, code: string | undefined): ActionErrorView {
  if (status === 403 && code === "REAUTH_REQUIRED") {
    return { kind: "reauth", message: "로그인한 지 10분이 지나 다시 로그인해야 해요." };
  }
  if (status === 409) {
    return { kind: "retryPreview", message: code ?? "지금은 실행할 수 없어요. 미리보기를 다시 해 주세요." };
  }
  // 400도 확인 토큰은 이미 소모됐으므로 미리보기부터 다시 해야 한다.
  if (status === 400) {
    return { kind: "retryPreview", message: code ?? "입력을 확인하고 미리보기부터 다시 해 주세요." };
  }
  if (status === 404) {
    return { kind: "other", message: "대상이 이미 없어요." };
  }
  if (status === 429) {
    return { kind: "other", message: "요청이 너무 많아요. 1분 뒤 다시 시도해 주세요." };
  }
  return { kind: "other", message: `실행하지 못했어요(${status}).` };
}

/** 실행 버튼 활성 조건: 사유 1~300자(앞뒤 공백 빼고), 확인 글자가 필요하면 앞뒤 공백 빼고 같을 때. */
export function canExecute(reason: string, confirmText: string | null, typed: string): boolean {
  const r = reason.trim();
  if (r.length === 0 || r.length > 300) return false;
  return confirmText === null || confirmText.trim() === typed.trim();
}
