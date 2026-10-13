import type { ReactNode } from "react";

/** 그래프 하나를 담는 칸 — 제목, 설명, 본문, 그리고 같은 숫자를 표로도 볼 수 있게(색에만 기대지 않게). */
export function Panel({
  title,
  subtitle,
  children,
  table,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  table?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
      <div className="mt-3">{children}</div>
      {table && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-[var(--text-secondary)]">표로 보기</summary>
          <div className="mt-2 overflow-x-auto">{table}</div>
        </details>
      )}
    </section>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-left text-xs">
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
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-[var(--border)] last:border-0">
            {row.map((cell, j) => (
              <td key={j} className="py-1 pr-3 tabular-nums">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

export function LoadState({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-[var(--text-muted)]">{message}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg bg-[var(--critical-bg)] px-3 py-2 text-sm text-[var(--critical)]">
      {message}
    </p>
  );
}
