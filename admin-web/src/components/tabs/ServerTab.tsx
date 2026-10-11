"use client";

import { getServer, type Days } from "@/lib/api";
import { formatNumber, shortDateTime } from "@/lib/format";
import { errorMessage, useAdminQuery } from "@/lib/useAdminQuery";
import { DailyBars, TimeLines } from "../Charts";
import { DataTable, ErrorState, LoadState, Panel } from "../Panel";

export function ServerTab({ days, onUnauthorized }: { days: Days; onUnauthorized: () => void }) {
  const state = useAdminQuery(() => getServer(days), `server-${days}`, onUnauthorized);
  if (state.status === "loading") return <LoadState message="서버 상태를 불러오는 중…" />;
  if (state.status === "error") return <ErrorState message={errorMessage(state.error)} />;

  const { instanceName, snapshots } = state.data;
  if (snapshots.length === 0) {
    return <LoadState message={`서버(${instanceName}) 기록이 아직 없어요. 서버가 뜬 뒤 5분마다 쌓여요.`} />;
  }
  const rows = snapshots.map((s) => ({
    label: shortDateTime(s.measuredAt),
    p50: s.p50Ms,
    p90: s.p90Ms,
    requests: s.requestCount,
    errors: s.serverErrorCount,
    heap: s.heapUsedMb,
    db: s.dbActiveConnections,
  }));
  const table = (
    <DataTable
      headers={["시각", "요청", "p50(ms)", "p90(ms)", "5xx", "힙(MB)", "DB 연결"]}
      rows={rows.map((r) => [
        r.label,
        r.requests,
        formatNumber(r.p50),
        formatNumber(r.p90),
        r.errors,
        r.heap,
        formatNumber(r.db),
      ])}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--text-muted)]">
        서버 {instanceName} · 5분마다 한 줄 · 빈 칸 바로 뒤 줄은 저장이 실패했던 구간까지 합친 값이에요.
      </p>
      <Panel title="응답 시간" subtitle="/api 요청, 5분 구간별" table={table}>
        <TimeLines
          data={rows}
          unit="ms"
          series={[
            { key: "p50", label: "p50", color: "var(--series-1)" },
            { key: "p90", label: "p90", color: "var(--series-2)" },
          ]}
        />
      </Panel>
      <Panel title="요청 수">
        <DailyBars data={rows} series={[{ key: "requests", label: "요청", color: "var(--series-1)" }]} />
      </Panel>
      <Panel title="5xx 오류 수">
        <DailyBars data={rows} series={[{ key: "errors", label: "5xx", color: "var(--series-2)" }]} />
      </Panel>
      <Panel title="힙 사용량" subtitle="MB">
        <TimeLines data={rows} unit="MB" series={[{ key: "heap", label: "힙", color: "var(--series-1)" }]} />
      </Panel>
    </div>
  );
}
