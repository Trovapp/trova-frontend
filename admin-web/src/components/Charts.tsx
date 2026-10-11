"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/lib/format";

export type Series = { key: string; label: string; color: string };

// 축·격자는 눈에 덜 띄게, 글자는 글자 색으로(시리즈 색을 글자에 쓰지 않는다).
const compact = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 });
const AXIS = { stroke: "var(--grid)", tick: { fill: "var(--text-muted)", fontSize: 11 }, tickLine: false };
const Y_AXIS = { ...AXIS, width: 44, tickFormatter: (v: number) => compact.format(v) };

/** 범례 — 시리즈가 2개 이상일 때만. 정한 순서 그대로, 글자는 글자 색이고 색은 옆 네모만(recharts 범례는 쌓은 막대에서 순서를 뒤집는다). */
function ChartLegend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <svg width="10" height="10" aria-hidden="true">
            <rect width="10" height="10" rx="2" fill={s.color} />
          </svg>
          {s.label}
        </li>
      ))}
    </ul>
  );
}
const TOOLTIP = {
  contentStyle: {
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--text-secondary)" },
  cursor: { fill: "var(--grid)" },
  formatter: (value: unknown) => formatNumber(typeof value === "number" ? value : Number(value)),
};
const HEIGHT = 220;

/** 날짜별 막대. stacked면 한 막대에 쌓는다(맨 위 칸만 둥글게, 칸 사이 2px 틈). 시리즈가 1개면 범례를 숨긴다. */
export function DailyBars<T extends { label: string }>({
  data,
  series,
  stacked = false,
}: {
  data: T[];
  series: Series[];
  stacked?: boolean;
}) {
  return (
    <>
      <ChartLegend series={series} />
      <ResponsiveContainer width="100%" height={HEIGHT}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={12} />
          <YAxis {...Y_AXIS} allowDecimals={false} />
          <Tooltip {...TOOLTIP} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              stackId={stacked ? "stack" : undefined}
              stroke="var(--surface-raised)"
              strokeWidth={stacked ? 2 : 0}
              radius={!stacked || i === series.length - 1 ? [4, 4, 0, 0] : 0}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

/** 시간에 따른 선(2px). 같은 단위의 시리즈만 한 축에 그린다. */
export function TimeLines<T extends { label: string }>({
  data,
  series,
  unit,
}: {
  data: T[];
  series: Series[];
  unit?: string;
}) {
  return (
    <>
      <ChartLegend series={series} />
      <ResponsiveContainer width="100%" height={HEIGHT}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" {...AXIS} interval="preserveStartEnd" minTickGap={24} />
          <YAxis {...Y_AXIS} unit={unit} width={unit ? 52 : 44} />
          <Tooltip {...TOOLTIP} cursor={{ stroke: "var(--text-muted)", strokeWidth: 1 }} />
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              // 점이 적으면 선이 거의 안 보이므로 표식(8px)을 보인다.
              dot={data.length < 3 ? { r: 4, stroke: "var(--surface-raised)", strokeWidth: 2, fill: s.color } : false}
              activeDot={{ r: 4, stroke: "var(--surface-raised)", strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

/** 이름별 건수 — 가로 막대(HTML). 값은 글자로 바로 붙인다. */
export function RankBars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.label} className="text-sm">
          <div className="flex justify-between gap-2">
            <span className="truncate text-[var(--text-secondary)]">{item.label}</span>
            <span className="tabular-nums">{formatNumber(item.value)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[var(--grid)]">
            <div className="h-2 rounded-full bg-[var(--series-1)]" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
