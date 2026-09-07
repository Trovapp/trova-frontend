"use client";

import { useSimulatedProgress } from "@/lib/useSimulatedProgress";

export function LoadingProgress({ label = "불러오는 중" }: { label?: string }) {
  const progress = useSimulatedProgress();

  return (
    <div className="flex flex-col items-start gap-2 py-1">
      <p className="text-sm text-ink-muted">
        {label}... {progress}%
      </p>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
