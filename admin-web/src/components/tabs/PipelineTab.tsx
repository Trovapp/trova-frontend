"use client";

import { getPipeline, type Days } from "@/lib/api";
import { formatNumber, formatSeconds, shortDate } from "@/lib/format";
import { errorMessage, useAdminQuery } from "@/lib/useAdminQuery";
import { DailyBars, RankBars } from "../Charts";
import { DataTable, ErrorState, LoadState, Panel, StatTile } from "../Panel";

const REASONS: Record<string, string> = {
  NO_PLACES: "장소 없음",
  AI_QUOTA: "AI 하루 한도",
  SOURCE_RATE_LIMITED: "인스타 요청 제한",
  STALE: "중단(멈춘 작업 정리)",
  OTHER: "기타",
};

const STAGES: Record<string, string> = {
  PENDING: "대기",
  PROCESSING: "처리 중",
};

export function PipelineTab({ days, onUnauthorized }: { days: Days; onUnauthorized: () => void }) {
  const state = useAdminQuery(() => getPipeline(days), `pipeline-${days}`, onUnauthorized);
  if (state.status === "loading") return <LoadState message="분석 파이프라인을 불러오는 중…" />;
  if (state.status === "error") return <ErrorState message={errorMessage(state.error)} />;

  const { daily, durationP50Seconds, durationP90Seconds, failureReasons, stuckJobs } = state.data;
  const rows = daily.map((d) => ({
    label: shortDate(d.date),
    done: d.done,
    failed: d.failed,
    other: d.total - d.done - d.failed,
  }));
  const total = daily.reduce((s, d) => s + d.total, 0);
  const done = daily.reduce((s, d) => s + d.done, 0);
  const failed = daily.reduce((s, d) => s + d.failed, 0);
  const successRate = done + failed === 0 ? null : Math.round((done / (done + failed)) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={`${days}일 요청`} value={formatNumber(total)} />
        <StatTile label="성공률" value={successRate == null ? "–" : `${successRate}%`} hint="끝난 작업 중 완료" />
        <StatTile label="처리 시간 중앙값" value={formatSeconds(durationP50Seconds)} />
        <StatTile label="처리 시간 p90" value={formatSeconds(durationP90Seconds)} />
      </div>
      <Panel
        title="일별 분석 결과"
        subtitle="분석이 처음 끝난 결과 기준(일정 생성은 섞지 않음)"
        table={
          <DataTable
            headers={["날짜", "완료", "실패", "진행 중"]}
            rows={rows.map((r) => [r.label, r.done, r.failed, r.other])}
          />
        }
      >
        <DailyBars
          data={rows}
          stacked
          series={[
            { key: "done", label: "완료", color: "var(--series-1)" },
            { key: "failed", label: "실패", color: "var(--series-2)" },
          ]}
        />
      </Panel>
      <Panel title="실패 이유">
        {failureReasons.length === 0 ? (
          <LoadState message="기간 안에 실패가 없어요." />
        ) : (
          <RankBars items={failureReasons.map((r) => ({ label: REASONS[r.reason] ?? r.reason, value: r.count }))} />
        )}
      </Panel>
      <Panel
        title="지금 멈춘 작업"
        subtitle="진행 중인데 오래 갱신이 없는 작업(최대 20개). 15분이 지나면 자동으로 실패 처리돼요."
      >
        {stuckJobs.length === 0 ? (
          <LoadState message="멈춘 작업이 없어요." />
        ) : (
          <DataTable
            headers={["작업 번호", "상태", "단계", "갱신 없음"]}
            rows={stuckJobs.map((j) => [
              j.id,
              STAGES[j.status] ?? j.status,
              j.stage ?? "–",
              `${j.minutesSinceUpdate}분`,
            ])}
          />
        )}
      </Panel>
    </div>
  );
}
