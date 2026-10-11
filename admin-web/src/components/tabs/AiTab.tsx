"use client";

import { getAi, type Days } from "@/lib/api";
import { formatNumber, shortDate } from "@/lib/format";
import { errorMessage, useAdminQuery } from "@/lib/useAdminQuery";
import { DailyBars, RankBars } from "../Charts";
import { DataTable, ErrorState, LoadState, Panel, StatTile } from "../Panel";

export function AiTab({ days, onUnauthorized }: { days: Days; onUnauthorized: () => void }) {
  const state = useAdminQuery(() => getAi(days), `ai-${days}`, onUnauthorized);
  if (state.status === "loading") return <LoadState message="AI 호출을 불러오는 중…" />;
  if (state.status === "error") return <ErrorState message={errorMessage(state.error)} />;

  const { daily, byOperation, callsPerJob } = state.data;
  const rows = daily.map((d) => ({
    label: shortDate(d.date),
    ok: d.calls - d.failures,
    failures: d.failures,
    tokens: d.tokens,
  }));
  const totalCalls = daily.reduce((sum, d) => sum + d.calls, 0);
  const totalFailures = daily.reduce((sum, d) => sum + d.failures, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={`${days}일 호출`}
          value={formatNumber(totalCalls)}
          hint={`실패 ${formatNumber(totalFailures)}회`}
        />
        <StatTile
          label="영상 1개당 호출"
          value={callsPerJob == null ? "–" : callsPerJob.toFixed(1)}
          hint="영상 분석 작업에 붙은 호출만"
        />
      </div>
      <Panel
        title="일별 호출"
        subtitle="이 DB에 기록된 호출만 — 같은 키를 쓰는 다른 DB의 서버 호출은 빠짐"
        table={
          <DataTable
            headers={["날짜", "성공", "실패", "토큰"]}
            rows={rows.map((r) => [r.label, r.ok, r.failures, formatNumber(r.tokens)])}
          />
        }
      >
        <DailyBars
          data={rows}
          stacked
          series={[
            { key: "ok", label: "성공", color: "var(--series-1)" },
            { key: "failures", label: "실패", color: "var(--series-2)" },
          ]}
        />
      </Panel>
      <Panel
        title="일별 토큰 합"
        table={<DataTable headers={["날짜", "토큰"]} rows={rows.map((r) => [r.label, formatNumber(r.tokens)])} />}
      >
        <DailyBars data={rows} series={[{ key: "tokens", label: "토큰", color: "var(--series-1)" }]} />
      </Panel>
      <Panel title="기능별 호출">
        {byOperation.length === 0 ? (
          <LoadState message="기간 안에 호출이 없어요." />
        ) : (
          <RankBars items={byOperation.map((o) => ({ label: `${o.provider} · ${o.operation}`, value: o.calls }))} />
        )}
      </Panel>
    </div>
  );
}
