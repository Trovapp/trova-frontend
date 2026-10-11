"use client";

import { getUsage, type DailyCount, type Days } from "@/lib/api";
import { formatNumber, shortDate } from "@/lib/format";
import { errorMessage, useAdminQuery } from "@/lib/useAdminQuery";
import { DailyBars } from "../Charts";
import { DataTable, ErrorState, LoadState, Panel, StatTile } from "../Panel";

function UsagePanel({ title, series }: { title: string; series: DailyCount[] }) {
  const rows = series.map((d) => ({ label: shortDate(d.date), count: d.count }));
  const sum = series.reduce((s, d) => s + d.count, 0);
  return (
    <Panel
      title={title}
      subtitle={`기간 합 ${formatNumber(sum)}`}
      table={<DataTable headers={["날짜", "수"]} rows={rows.map((r) => [r.label, r.count])} />}
    >
      <DailyBars data={rows} series={[{ key: "count", label: title, color: "var(--series-1)" }]} />
    </Panel>
  );
}

export function UsageTab({ days, onUnauthorized }: { days: Days; onUnauthorized: () => void }) {
  const state = useAdminQuery(() => getUsage(days), `usage-${days}`, onUnauthorized);
  if (state.status === "loading") return <LoadState message="사용 데이터를 불러오는 중…" />;
  if (state.status === "error") return <ErrorState message={errorMessage(state.error)} />;

  const { totalUsers, newUsers, savedPlaces, trips, autoDrafts } = state.data;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="누적 사용자" value={formatNumber(totalUsers)} />
      </div>
      {/* 단위가 같아도 뜻이 다른 숫자라 한 그래프에 겹치지 않고 따로 그린다. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <UsagePanel title="새 가입자" series={newUsers} />
        <UsagePanel title="저장한 장소" series={savedPlaces} />
        <UsagePanel title="만든 여행" series={trips} />
        <UsagePanel title="자동 일정 초안" series={autoDrafts} />
      </div>
    </div>
  );
}
