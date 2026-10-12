"use client";

import { useCallback, useState, type FormEvent } from "react";
import { searchUsers, type ActionName } from "@/lib/api/admin";
import { errorMessage, useAdminQuery, type AuthFailure } from "@/lib/useAdminQuery";
import { ErrorState, LoadState } from "../Panel";
import { ActionDialog } from "../users/ActionDialog";
import { Badge, joinDate, providerLabel, UserDetail } from "../users/UserDetail";

export type PendingAction = { action: ActionName; targetId: number; label: string };

/**
 * 사용자 찾기 → 목록 → 상세. 검색어를 비우고 찾으면 서버가 최근 가입 20명을 준다(처음 열 때도 빈 검색).
 * 휴대폰에서는 상세를 열면 목록을 숨기고 상세만 보인다(넓은 화면은 목록 아래에 상세).
 */
export function UsersTab({ onUnauthorized }: { onUnauthorized: (reason: AuthFailure) => void }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState({ q: "", seq: 0 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [pending, setPending] = useState<PendingAction | null>(null);

  // seq를 키에 넣어 같은 검색어로 다시 찾아도(계정 삭제 뒤 등) 새로 부른다.
  const list = useAdminQuery(() => searchUsers(search.q), `users-${search.seq}-${search.q}`, onUnauthorized);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearch((s) => ({ q: input.trim(), seq: s.seq + 1 }));
    setSelectedId(null);
  };

  const onAction = useCallback((action: ActionName, targetId: number, label: string) => {
    setPending({ action, targetId, label });
  }, []);

  /** 조치가 성공한 뒤(조치 창이 닫힐 때 부른다): 계정 삭제면 상세를 닫고 목록을 다시 찾고, 아니면 상세·이력을 다시 부른다(정지·정지 풀기는 목록도). */
  const onActionDone = useCallback((action: ActionName) => {
    setPending(null);
    if (action === "delete-account") {
      setSelectedId(null);
      setSearch((s) => ({ ...s, seq: s.seq + 1 }));
      return;
    }
    setDetailVersion((v) => v + 1);
    // 정지·정지 풀기는 목록의 "정지됨" 배지도 바뀌므로 목록도 다시 부른다(넓은 화면은 목록이 같이 보인다).
    if (action === "suspend-user" || action === "unsuspend-user") {
      setSearch((s) => ({ ...s, seq: s.seq + 1 }));
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className={selectedId == null ? "flex flex-col gap-4" : "hidden flex-col gap-4 sm:flex"}>
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="번호·영상 링크·닉네임·여행 이름"
            aria-label="사용자 찾기"
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            찾기
          </button>
        </form>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
          <h3 className="font-semibold">{search.q ? `"${search.q}" 찾은 결과` : "최근 가입 20명"}</h3>
          <div className="mt-3">
            {list.status === "loading" && <LoadState message="사용자를 찾는 중…" />}
            {list.status === "error" && <ErrorState message={errorMessage(list.error)} />}
            {list.status === "ready" &&
              (list.data.users.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">맞는 사용자가 없어요.</p>
              ) : (
                <ul className="flex flex-col">
                  {list.data.users.map((u) => (
                    <li key={u.id} className="border-b border-[var(--border)] last:border-0">
                      <button
                        type="button"
                        onClick={() => setSelectedId(u.id)}
                        aria-current={selectedId === u.id}
                        className={`flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-1 py-2 text-left text-sm hover:bg-[var(--surface)] ${
                          selectedId === u.id ? "font-semibold text-[var(--accent)]" : ""
                        }`}
                      >
                        <span className="tabular-nums">#{u.id}</span>
                        <span className="min-w-0 break-all">{u.nickname}</span>
                        {u.suspended && <Badge tone="critical">정지됨</Badge>}
                        <span className="text-xs tabular-nums text-[var(--text-secondary)]">
                          {providerLabel(u.provider)} · {joinDate(u.createdAt)} · 영상 {u.jobs} · 여행 {u.trips}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        </section>
      </div>

      {selectedId != null && (
        <UserDetail
          userId={selectedId}
          reloadKey={detailVersion}
          onAction={onAction}
          onClose={() => setSelectedId(null)}
          onUnauthorized={onUnauthorized}
        />
      )}

      {pending && (
        <ActionDialog
          key={`${pending.action}-${pending.targetId}`}
          action={pending.action}
          targetId={pending.targetId}
          label={pending.label}
          onDone={onActionDone}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
