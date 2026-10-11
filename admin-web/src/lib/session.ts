// 관리자 웹 토큰(1시간, aud=admin-web)은 메모리와 탭을 닫으면 사라지는 sessionStorage에만 둔다(ADR 0012).
// localStorage·쿠키에 두지 않는다 — 탭을 닫으면 다시 로그인한다.

const STORAGE_KEY = "trova-admin-token";

type StoredToken = { token: string; expiresAt: number };

let current: StoredToken | null = null;

function readStorage(): StoredToken | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredToken) : null;
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
  const stored = current ?? readStorage();
  if (!stored || stored.expiresAt <= Date.now()) {
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
