import { clearToken, getToken } from "../session";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type Provider = "google" | "kakao";
export type Days = 7 | 14 | 30;

// 백엔드 응답 형식(Trovapp/trova-backend admin 패키지의 record)과 같게 유지한다.
export type SummaryCard = {
  key: "geminiToday" | "failures24h" | "stuckJobs" | "p90LastHour";
  value: number | null;
  threshold: number;
  alert: boolean;
  note: string;
};
export type DashboardSummary = { cards: SummaryCard[] };

export type DailyCount = { date: string; count: number };
export type UsageDashboard = {
  days: number;
  totalUsers: number;
  newUsers: DailyCount[];
  savedPlaces: DailyCount[];
  trips: DailyCount[];
  autoDrafts: DailyCount[];
};

export type PipelineDashboard = {
  days: number;
  daily: { date: string; total: number; done: number; failed: number }[];
  durationP50Seconds: number | null;
  durationP90Seconds: number | null;
  failureReasons: { reason: string; count: number }[];
  stuckJobs: { id: number; status: string; stage: string | null; minutesSinceUpdate: number }[];
  drafts: {
    total: number;
    failed: number;
    stuck: { id: number; status: string; autoCreated: boolean; minutesSinceUpdate: number }[];
  };
};

export type AiDashboard = {
  days: number;
  daily: { date: string; calls: number; failures: number; tokens: number }[];
  byOperation: { provider: string; operation: string; calls: number }[];
  callsPerJob: number | null;
};

export type ServerDashboard = {
  days: number;
  instanceName: string;
  snapshots: {
    measuredAt: string;
    requestCount: number;
    p50Ms: number | null;
    p90Ms: number | null;
    serverErrorCount: number;
    heapUsedMb: number;
    dbActiveConnections: number | null;
  }[];
};

/** 401(토큰 없음·만료)·403(관리자 아님)·429(횟수 제한)를 화면이 구분할 수 있게 상태 코드를 담는다. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export function loginUrl(provider: Provider): string {
  return `${API_BASE_URL}/oauth2/authorization/${provider}?client=admin-web`;
}

export async function exchangeCode(code: string): Promise<{ token: string; expiresInSeconds: number }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST /api/auth/exchange failed: ${res.status}`);
  }
  return res.json();
}

async function adminGet<T>(path: string): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, "로그인이 필요합니다");
  }
  // 관리자 웹은 쿠키를 쓰지 않는다 — Bearer 토큰만(백엔드 CORS도 쿠키 없이 열려 있다).
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "omit",
  });
  if (res.status === 401) {
    clearToken();
  }
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function adminPost<T>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, "로그인이 필요합니다");
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
  });
  if (res.status === 401) {
    clearToken();
  }
  if (!res.ok) {
    let code: string | undefined;
    try {
      const data = await res.json();
      if (typeof data?.error === "string") code = data.error;
    } catch {
      // 본문이 JSON이 아니면 code 없이 상태 코드만 전달한다.
    }
    throw new ApiError(res.status, `POST ${path} failed: ${res.status}`, code);
  }
  return res.json();
}

export const getSummary = () => adminGet<DashboardSummary>("/api/admin/dashboard/summary");
export const getUsage = (days: Days) => adminGet<UsageDashboard>(`/api/admin/dashboard/usage?days=${days}`);
export const getPipeline = (days: Days) => adminGet<PipelineDashboard>(`/api/admin/dashboard/pipeline?days=${days}`);
export const getAi = (days: Days) => adminGet<AiDashboard>(`/api/admin/dashboard/ai?days=${days}`);
export const getServer = (days: Days) => adminGet<ServerDashboard>(`/api/admin/dashboard/server?days=${days}`);

export type AdminUserRow = {
  id: number;
  provider: string;
  nickname: string;
  createdAt: string;
  suspended: boolean;
  jobs: number;
  trips: number;
};
export type AdminUserDetail = {
  id: number;
  provider: string;
  nickname: string;
  createdAt: string;
  lastActiveAt: string;
  suspendedAt: string | null;
  admin: boolean;
  counts: { jobs: number; savedPlaces: number; trips: number; drafts: number };
  recentJobs: { id: number; status: string; failureReason: string | null; createdAt: string; retryable: boolean }[];
  trips: { id: number; title: string; startDate: string; endDate: string }[];
  autoDrafts: { id: number; status: string; dismissed: boolean; createdAt: string }[];
};
export type ActionName =
  | "delete-trip"
  | "delete-account"
  | "retry-job"
  | "hide-draft"
  | "suspend-user"
  | "unsuspend-user";
export type ActionPreview = {
  action: string;
  targetId: number;
  targetUserId: number;
  impact: string;
  confirmText: string | null;
  confirmToken: string;
  expiresInSeconds: number;
};
export type ActionLog = {
  id: number;
  createdAt: string;
  actorUserId: number | null;
  action: string;
  targetId: number | null;
  targetUserId: number | null;
  reason: string | null;
  result: string | null;
};

export const searchUsers = (q: string) =>
  adminGet<{ users: AdminUserRow[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`);
export const getUserDetail = (id: number) => adminGet<AdminUserDetail>(`/api/admin/users/${id}`);
export function getActionLogs(opts?: { targetUserId?: number; kind?: "actions" | "all" }) {
  const params = new URLSearchParams();
  if (opts?.targetUserId) params.set("targetUserId", String(opts.targetUserId));
  if (opts?.kind) params.set("kind", opts.kind);
  const qs = params.toString();
  return adminGet<{ logs: ActionLog[] }>(`/api/admin/actions${qs ? `?${qs}` : ""}`);
}
export const previewAction = (action: ActionName, targetId: number) =>
  adminPost<ActionPreview>(`/api/admin/actions/${action}/preview`, { targetId });
export const executeAction = (
  action: ActionName,
  body: { confirmToken: string; reason: string; confirmText: string },
) => adminPost<{ action: string; targetId: number; result: string }>(`/api/admin/actions/${action}/execute`, body);
