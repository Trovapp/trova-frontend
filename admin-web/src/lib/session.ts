// 관리자 웹 토큰(1시간, aud=admin-web)은 메모리와 탭을 닫으면 사라지는 sessionStorage에만 둔다(ADR 0012).
// localStorage·쿠키에 두지 않는다 — 탭을 닫으면 다시 로그인한다.

const STORAGE_KEY = "trova-admin-token";

type StoredToken = { token: string; expiresAt: number };

let current: StoredToken | null = null;

/** 저장 값을 검사해 아직 유효한 토큰만 돌려준다. 만료 시각이 없거나 숫자가 아니면 만료로 본다(웹 #5 리뷰). */
export function parseStoredToken(raw: string | null, now: number): StoredToken | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredToken>;
    if (typeof value.token !== "string" || value.token === "" || typeof value.expiresAt !== "number") {
      return null;
    }
    return value.expiresAt > now ? { token: value.token, expiresAt: value.expiresAt } : null;
  } catch {
    return null;
  }
}

function readStorage(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string, expiresInSeconds: number): void {
  current = { token, expiresAt: Date.now() + expiresInSeconds * 1000 };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // 시크릿 창 등에서 저장이 막혀도 이 탭 메모리에서는 쓸 수 있다.
  }
}

/** 만료됐거나 없으면 null. */
export function getToken(): string | null {
  const now = Date.now();
  const stored = current && current.expiresAt > now ? current : parseStoredToken(readStorage(), now);
  if (!stored) {
    clearToken();
    return null;
  }
  current = stored;
  return stored.token;
}

export function clearToken(): void {
  current = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}
