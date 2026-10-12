"use client";

import { useState } from "react";
import { getActionLogs, type ActionLog } from "@/lib/api/admin";
import { actionLabel } from "@/lib/actionLabels";
import { shortDateTime } from "@/lib/format";
import { errorMessage, useAdminQuery, type AuthFailure } from "@/lib/useAdminQuery";
import { ErrorState, LoadState } from "../Panel";

const dash = (value: string | number | null) => (value == null || value === "" ? "–" : String(value));

/** 최근 조치 기록 — 기본은 실제 조치만, 끄면 열람·검색·로그인까지. 넓은 화면은 표, 휴대폰은 카드. */
export function ActionLogTab({ onUnauthorized }: { onUnauthorized: (reason: AuthFailure) => void }) {
  const [onlyActions, setOnlyActions] = useState(true);
  const kind = onlyActions ? "actions" : "all";
  const state = useAdminQuery(() => getActionLogs({ kind }), `action-logs-${kind}`, onUnauthorized);

  return (
    <section className="flex flex-col gap-3">
      <label className="flex w-fit items-center gap-2 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={onlyActions}
          onChange={(e) => setOnlyActions(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        조치만 보기
      </label>
      {state.status === "loading" && <LoadState message="조치 기록을 불러오는 중…" />}
      {state.status === "error" && <ErrorState message={errorMessage(state.error)} />}
      {state.status === "ready" &&
        (state.data.logs.length === 0 ? (
          <LoadState message="조치 기록이 아직 없어요." />
        ) : (
          <>
            <LogTable logs={state.data.logs} />
            <LogCards logs={state.data.logs} />
          </>
        ))}
    </section>
  );
}

function LogTable({ logs }: { logs: ActionLog[] }) {
  const headers = ["시각", "관리자 번호", "조치", "대상", "사용자", "사유", "결과"];
  return (
    <div className="hidden rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:block">
      <table className="w-full table-fixed text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
            {headers.map((h) => (
              <th key={h} className="py-1 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b border-[var(--border)] align-top last:border-0">
              <td className="py-1.5 pr-3 tabular-nums">{shortDateTime(l.createdAt)}</td>
              <td className="py-1.5 pr-3 tabular-nums">{dash(l.actorUserId)}</td>
              <td className="py-1.5 pr-3 font-medium">{actionLabel(l.action)}</td>
              <td className="py-1.5 pr-3 tabular-nums">{l.targetId == null ? "–" : `#${l.targetId}`}</td>
              <td className="py-1.5 pr-3 tabular-nums">{l.targetUserId == null ? "–" : `#${l.targetUserId}`}</td>
              <td className="break-words py-1.5 pr-3">{dash(l.reason)}</td>
              <td className="break-words py-1.5 pr-3">{dash(l.result)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogCards({ logs }: { logs: ActionLog[] }) {
  return (
    <ul className="flex flex-col gap-2 sm:hidden">
      {logs.map((l) => (
        <li key={l.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">{actionLabel(l.action)}</span>
            <span className="text-xs tabular-nums text-[var(--text-muted)]">{shortDateTime(l.createdAt)}</span>
          </div>
          <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
            <dt className="text-[var(--text-secondary)]">관리자 번호</dt>
            <dd className="tabular-nums">{dash(l.actorUserId)}</dd>
            <dt className="text-[var(--text-secondary)]">대상</dt>
            <dd className="tabular-nums">{l.targetId == null ? "–" : `#${l.targetId}`}</dd>
            <dt className="text-[var(--text-secondary)]">사용자</dt>
            <dd className="tabular-nums">{l.targetUserId == null ? "–" : `#${l.targetUserId}`}</dd>
            <dt className="text-[var(--text-secondary)]">사유</dt>
            <dd className="break-words">{dash(l.reason)}</dd>
            <dt className="text-[var(--text-secondary)]">결과</dt>
            <dd className="break-words">{dash(l.result)}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
