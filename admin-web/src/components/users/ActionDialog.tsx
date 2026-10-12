"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, executeAction, previewAction, type ActionName, type ActionPreview } from "@/lib/api/admin";
import { canExecute, describeActionError, type ActionErrorView } from "@/lib/actionError";
import { clearToken } from "@/lib/session";
import { formatCountdown, secondsLeft } from "@/lib/format";

/** 되돌리기 어려운 조치 — 실행 버튼에 빨간 테두리. */
const DANGER_ACTIONS: ReadonlySet<ActionName> = new Set(["delete-trip", "delete-account", "suspend-user"]);
const REASON_MAX = 300;
const EXPIRED_MESSAGE = "확인 시간(5분)이 지났어요. 미리보기부터 다시 해 주세요.";

type Phase =
  | { kind: "loading" }
  | { kind: "previewFailed"; error: ActionErrorView }
  | { kind: "ready"; preview: ActionPreview; deadline: number }
  | { kind: "done"; result: string };

function toErrorView(e: unknown): ActionErrorView {
  if (e instanceof ApiError) {
    // 401은 토큰이 이미 지워졌으므로 다시 로그인으로 안내한다.
    if (e.status === 401) return { kind: "reauth", message: "로그인이 만료됐어요. 다시 로그인해 주세요." };
    return describeActionError(e.status, e.code);
  }
  return { kind: "other", message: "서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요." };
}

/**
 * 조치 창: 열리면 미리보기(영향 범위·확인 토큰 5분) → 사유와 확인 글자 → 실행.
 * 확인 토큰은 한 번 쓰면 사라지므로 400·409·시간 초과 뒤에는 "미리보기 다시"로 새 토큰을 받는다(사유는 남기고 확인 글자는 비운다).
 */
export function ActionDialog({
  action,
  targetId,
  label,
  onDone,
  onClose,
}: {
  action: ActionName;
  targetId: number;
  label: string;
  onDone: (action: ActionName) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const reasonId = useId();
  const confirmId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  // state 반영 전 같은 순간의 두 번째 누름도 막는다.
  const busyRef = useRef(false);

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [execError, setExecError] = useState<ActionErrorView | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const requestPreview = useCallback(() => {
    previewAction(action, targetId).then(
      (preview) => {
        setNow(Date.now());
        setPhase({ kind: "ready", preview, deadline: Date.now() + preview.expiresInSeconds * 1000 });
      },
      (e: unknown) => setPhase({ kind: "previewFailed", error: toErrorView(e) }),
    );
  }, [action, targetId]);

  useEffect(() => {
    requestPreview();
  }, [requestPreview]);

  const retryPreview = () => {
    setPhase({ kind: "loading" });
    setExecError(null);
    setTyped("");
    requestPreview();
  };

  const remaining = phase.kind === "ready" ? secondsLeft(phase.deadline, now) : 0;
  const expired = phase.kind === "ready" && remaining === 0;

  // 남은 시간 카운트다운(미리보기를 받은 동안만).
  useEffect(() => {
    if (phase.kind !== "ready") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  // 포커스: 미리보기를 받으면 첫 입력칸(사유를 이미 적었으면 확인 글자 칸), 그 밖엔 창 자체.
  useEffect(() => {
    if (phase.kind === "ready") {
      const focusConfirm = phase.preview.confirmText !== null && reasonRef.current?.value.trim();
      (focusConfirm ? confirmRef.current : reasonRef.current)?.focus();
    } else {
      panelRef.current?.focus();
    }
  }, [phase]);

  // 닫히면 창을 열었던 버튼으로 포커스를 돌려준다.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    return () => opener?.focus?.();
  }, []);

  const close = useCallback(() => {
    if (busyRef.current) return;
    if (phase.kind === "done") onDone(action);
    else onClose();
  }, [phase.kind, onDone, onClose, action]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  const goLogin = () => {
    clearToken();
    router.replace("/login/?error=reauth");
  };

  const execute = async () => {
    if (phase.kind !== "ready" || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setExecError(null);
    try {
      const res = await executeAction(action, {
        confirmToken: phase.preview.confirmToken,
        reason: reason.trim(),
        confirmText: typed.trim(),
      });
      setPhase({ kind: "done", result: res.result });
    } catch (e) {
      setExecError(toErrorView(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const danger = DANGER_ACTIONS.has(action);
  // 400·409·로그인 필요 뒤에는 같은 토큰으로 다시 실행하지 않는다.
  const tokenSpent = execError !== null && execError.kind !== "other";
  const executable =
    phase.kind === "ready" &&
    !busy &&
    !expired &&
    !tokenSpent &&
    canExecute(reason, phase.preview.confirmText, typed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy || phase.kind === "loading"}
        tabIndex={-1}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-[var(--text-primary)] shadow-lg focus:outline-none"
      >
        <h2 id={titleId} className="break-words text-lg font-semibold">
          {label}
        </h2>

        {phase.kind === "loading" && <p className="text-sm text-[var(--text-muted)]">영향 범위를 확인하는 중…</p>}

        {phase.kind === "previewFailed" && <ErrorBox error={phase.error} onLogin={goLogin} />}

        {phase.kind === "done" && (
          <p role="status" className="break-words text-sm">
            완료: {phase.result}
          </p>
        )}

        {phase.kind === "ready" && (
          <>
            <div className="flex flex-col gap-1 text-sm">
              <p className="break-words">영향 범위: {phase.preview.impact}</p>
              <p className={`tabular-nums ${expired ? "text-[var(--critical)]" : "text-[var(--text-secondary)]"}`}>
                남은 시간 {formatCountdown(remaining)}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor={reasonId} className="text-sm font-medium">
                사유
              </label>
              <textarea
                id={reasonId}
                ref={reasonRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={REASON_MAX}
                rows={3}
                disabled={busy}
                placeholder="왜 이 조치를 하는지 적어 주세요"
                className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
              <span className="self-end text-xs tabular-nums text-[var(--text-muted)]">
                {reason.length}/{REASON_MAX}
              </span>
            </div>

            {phase.preview.confirmText !== null && (
              <div className="flex flex-col gap-1">
                <label htmlFor={confirmId} className="break-words text-sm font-medium">
                  아래에 「{phase.preview.confirmText}」를 그대로 입력해 주세요
                </label>
                <input
                  id={confirmId}
                  ref={confirmRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  disabled={busy}
                  autoComplete="off"
                  className="w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            )}

            {execError && <ErrorBox error={execError} onLogin={goLogin} />}
            {expired && !execError && <ErrorBox error={{ kind: "retryPreview", message: EXPIRED_MESSAGE }} />}
          </>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {phase.kind === "ready" && (expired || execError?.kind === "retryPreview") && !busy && (
            <button
              type="button"
              onClick={retryPreview}
              className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)]"
            >
              미리보기 다시
            </button>
          )}
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] disabled:opacity-50"
          >
            닫기
          </button>
          {phase.kind === "ready" && (
            <button
              type="button"
              onClick={execute}
              disabled={!executable}
              className={`rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                danger
                  ? "border-2 border-[var(--critical)] text-[var(--critical)] hover:bg-[var(--critical-bg)]"
                  : "border border-[var(--accent)] bg-[var(--accent)] text-white"
              }`}
            >
              {busy ? "실행 중…" : "실행"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ error, onLogin }: { error: ActionErrorView; onLogin?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg bg-[var(--critical-bg)] px-3 py-2 text-sm text-[var(--critical)]"
    >
      <p className="break-words">{error.message}</p>
      {error.kind === "reauth" && onLogin && (
        <button
          type="button"
          onClick={onLogin}
          className="self-start rounded-lg border border-[var(--critical)] px-3 py-1 font-medium"
        >
          다시 로그인
        </button>
      )}
    </div>
  );
}
