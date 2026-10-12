"use client";

import type { ReactNode } from "react";
import { getActionLogs, getUserDetail, type ActionName, type AdminUserDetail } from "@/lib/api/admin";
import { formatNumber, shortDate, shortDateTime } from "@/lib/format";
import { errorMessage, useAdminQuery, type AuthFailure } from "@/lib/useAdminQuery";
import { ErrorState, LoadState, StatTile } from "../Panel";

/** 조치 버튼이 부르는 콜백 — 실제 창(미리보기·사유·확인)은 받는 쪽이 띄운다. */
export type OnAction = (action: ActionName, targetId: number, label: string) => void;

export const PROVIDER_LABELS: Record<string, string> = { kakao: "카카오", google: "구글" };

export const ACTION_LABELS: Record<string, string> = {
  DELETE_TRIP: "여행 삭제",
  DELETE_ACCOUNT: "계정 삭제",
  RETRY_JOB: "작업 다시 실행",
  HIDE_DRAFT: "초안 숨기기",
  SUSPEND_USER: "정지",
  UNSUSPEND_USER: "정지 풀기",
};

const JOB_STATUS: Record<string, string> = {
  PENDING: "대기",
  PROCESSING: "처리 중",
  DONE: "완료",
  FAILED: "실패",
};

const FAILURE_REASONS: Record<string, string> = {
  NO_PLACES: "장소 없음",
  AI_QUOTA: "AI 하루 한도",
  SOURCE_RATE_LIMITED: "인스타 요청 제한",
  STALE: "중단(멈춘 작업 정리)",
  OTHER: "기타",
};

const DRAFT_STATUS: Record<string, string> = {
  PENDING: "대기",
  PROCESSING: "만드는 중",
  NEEDS_INPUT: "입력 기다림",
  READY: "준비됨",
  APPROVED: "승인됨",
  FAILED: "실패",
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

/** "2026-10-05T09:12:00" → "2026-10-05"(가입일은 연도까지 보인다). */
export function joinDate(value: string): string {
  return value.slice(0, 10);
}

export function Badge({ tone, children }: { tone: "critical" | "accent"; children: ReactNode }) {
  const color =
    tone === "critical"
      ? "border-[var(--critical)] bg-[var(--critical-bg)] text-[var(--critical)]"
      : "border-[var(--accent)] text-[var(--accent)]";
  return <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>{children}</span>;
}

function ActionButton({ danger, onClick, children }: { danger?: boolean; onClick: () => void; children: ReactNode }) {
  const color = danger
    ? "border-[var(--critical)] text-[var(--critical)] hover:bg-[var(--critical-bg)]"
    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs ${color}`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** 표는 칸 안에서만 가로로 밀린다(휴대폰에서 화면 전체가 넘치지 않게). */
function Table({ headers, rows, empty }: { headers: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-[var(--text-muted)]">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap py-1 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-1.5 pr-3 align-middle tabular-nums">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 사용자 한 명의 상세. reloadKey가 바뀌면 상세와 조치 이력을 다시 부른다(조치가 성공한 뒤 부모가 올린다).
 * 조치 버튼은 onAction만 부른다 — 관리자 계정은 정지·계정 삭제를 숨기고, 정지된 사용자는 "정지 풀기"만 보인다.
 */
export function UserDetail({
  userId,
  reloadKey,
  onAction,
  onClose,
  onUnauthorized,
}: {
  userId: number;
  reloadKey: number;
  onAction: OnAction;
  onClose: () => void;
  onUnauthorized: (reason: AuthFailure) => void;
}) {
  const detail = useAdminQuery(() => getUserDetail(userId), `user-${userId}-${reloadKey}`, onUnauthorized);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onClose}
        className="self-start rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)]"
      >
        ← 목록으로
      </button>
      {detail.status === "loading" && <LoadState message="사용자 정보를 불러오는 중…" />}
      {detail.status === "error" && <ErrorState message={errorMessage(detail.error)} />}
      {detail.status === "ready" && <DetailBody user={detail.data} onAction={onAction} />}
      <ActionHistory userId={userId} reloadKey={reloadKey} onUnauthorized={onUnauthorized} />
    </div>
  );
}

function DetailBody({ user, onAction }: { user: AdminUserDetail; onAction: OnAction }) {
  const suspended = user.suspendedAt != null;
  const visibleDrafts = user.autoDrafts.filter((d) => !d.dismissed);

  return (
    <>
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 break-all text-base font-bold">
            #{user.id} {user.nickname}
          </h2>
          {suspended && <Badge tone="critical">정지됨</Badge>}
          {user.admin && <Badge tone="accent">관리자</Badge>}
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {providerLabel(user.provider)} · 가입 {joinDate(user.createdAt)} · 최근 활동{" "}
          {shortDateTime(user.lastActiveAt)}
          {suspended && user.suspendedAt && ` · 정지 ${shortDateTime(user.suspendedAt)}`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="영상" value={formatNumber(user.counts.jobs)} />
        <StatTile label="저장한 장소" value={formatNumber(user.counts.savedPlaces)} />
        <StatTile label="여행" value={formatNumber(user.counts.trips)} />
        <StatTile label="자동 초안" value={formatNumber(user.counts.drafts)} />
      </div>

      <Section title="최근 작업">
        <Table
          headers={["번호", "상태", "실패 이유", "시각", ""]}
          empty="작업이 없어요."
          rows={user.recentJobs.map((j) => [
            `#${j.id}`,
            JOB_STATUS[j.status] ?? j.status,
            j.failureReason ? (FAILURE_REASONS[j.failureReason] ?? j.failureReason) : "–",
            shortDateTime(j.createdAt),
            j.retryable ? (
              <ActionButton onClick={() => onAction("retry-job", j.id, `작업 #${j.id} 다시 실행`)}>
                다시 실행
              </ActionButton>
            ) : (
              ""
            ),
          ])}
        />
      </Section>

      <Section title="여행">
        <Table
          headers={["이름", "기간", ""]}
          empty="여행이 없어요."
          rows={user.trips.map((t) => [
            <span key="title" className="break-all">
              {t.title}
            </span>,
            `${shortDate(t.startDate)}~${shortDate(t.endDate)}`,
            <ActionButton key="delete" danger onClick={() => onAction("delete-trip", t.id, `여행 "${t.title}" 삭제`)}>
              삭제
            </ActionButton>,
          ])}
        />
      </Section>

      <Section title="자동 초안">
        <Table
          headers={["번호", "상태", "만든 시각", ""]}
          empty="숨기지 않은 자동 초안이 없어요."
          rows={visibleDrafts.map((d) => [
            `#${d.id}`,
            DRAFT_STATUS[d.status] ?? d.status,
            shortDateTime(d.createdAt),
            <ActionButton key="hide" onClick={() => onAction("hide-draft", d.id, `초안 #${d.id} 숨기기`)}>
              숨기기
            </ActionButton>,
          ])}
        />
      </Section>

      <Section title="계정">
        {user.admin ? (
          <p className="text-sm text-[var(--text-muted)]">관리자 계정은 정지하거나 삭제할 수 없어요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suspended ? (
              <ActionButton onClick={() => onAction("unsuspend-user", user.id, `#${user.id} 정지 풀기`)}>
                정지 풀기
              </ActionButton>
            ) : (
              <ActionButton danger onClick={() => onAction("suspend-user", user.id, `#${user.id} 정지`)}>
                정지
              </ActionButton>
            )}
            <ActionButton danger onClick={() => onAction("delete-account", user.id, `#${user.id} 계정 삭제`)}>
              계정 삭제
            </ActionButton>
          </div>
        )}
      </Section>
    </>
  );
}

function ActionHistory({
  userId,
  reloadKey,
  onUnauthorized,
}: {
  userId: number;
  reloadKey: number;
  onUnauthorized: (reason: AuthFailure) => void;
}) {
  const logs = useAdminQuery(
    () => getActionLogs({ targetUserId: userId }),
    `user-logs-${userId}-${reloadKey}`,
    onUnauthorized,
  );

  return (
    <Section title="이 사용자 조치 이력">
      {logs.status === "loading" && <LoadState message="조치 이력을 불러오는 중…" />}
      {logs.status === "error" && <ErrorState message={errorMessage(logs.error)} />}
      {logs.status === "ready" && (
        <Table
          headers={["시각", "조치", "대상", "사유", "결과"]}
          empty="아직 조치한 적이 없어요."
          rows={logs.data.logs.map((l) => [
            shortDateTime(l.createdAt),
            ACTION_LABELS[l.action] ?? l.action,
            l.targetId == null ? "–" : `#${l.targetId}`,
            <span key="reason" className="inline-block min-w-32 max-w-xs break-all">
              {l.reason ?? "–"}
            </span>,
            l.result ?? "–",
          ])}
        />
      )}
    </Section>
  );
}
