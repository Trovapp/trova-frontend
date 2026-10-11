"use client";

import { getSummary, type SummaryCard } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { errorMessage, useAdminQuery } from "@/lib/useAdminQuery";
import { ErrorState } from "./Panel";

const TITLES: Record<SummaryCard["key"], { title: string; unit: string }> = {
  geminiToday: { title: "오늘 Gemini 호출", unit: "회" },
  failures24h: { title: "24시간 분석 실패", unit: "건" },
  stuckJobs: { title: "멈춘 작업", unit: "건" },
  p90LastHour: { title: "최근 1시간 응답 p90", unit: "ms" },
};

/** 맨 위 "지금 확인할 것" 카드 4개. 기준을 넘으면 빨간 테두리 + "확인 필요" 글자(색만으로 알리지 않는다). */
export function SummaryCards({ onUnauthorized }: { onUnauthorized: () => void }) {
  const state = useAdminQuery(getSummary, "summary", onUnauthorized);

  if (state.status === "error") {
    return <ErrorState message={`요약: ${errorMessage(state.error)}`} />;
  }
  const cards = state.status === "ready" ? state.data.cards : null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {(cards ?? (Object.keys(TITLES) as SummaryCard["key"][]).map((key) => ({ key }) as Partial<SummaryCard>)).map(
        (card) => {
          const meta = TITLES[card.key as SummaryCard["key"]];
          const alert = card.alert === true;
          return (
            <div
              key={card.key}
              className={`rounded-xl border p-4 ${
                alert
                  ? "border-[var(--critical)] bg-[var(--critical-bg)]"
                  : "border-[var(--border)] bg-[var(--surface-raised)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--text-secondary)]">{meta?.title ?? card.key}</p>
                {alert && (
                  <span className="rounded bg-[var(--critical)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    ! 확인 필요
                  </span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {cards ? formatNumber(card.value) : "…"}
                {cards && card.value != null && <span className="ml-0.5 text-sm font-normal">{meta?.unit}</span>}
              </p>
              {cards && (
                <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
                  기준 {formatNumber(card.threshold)}
                  {meta?.unit} · {card.note}
                </p>
              )}
            </div>
          );
        },
      )}
    </div>
  );
}
