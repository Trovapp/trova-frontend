"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Days } from "@/lib/api/admin";
import { clearToken, tokenState } from "@/lib/session";
import type { AuthFailure } from "@/lib/useAdminQuery";
import { SummaryCards } from "@/components/SummaryCards";
import { AiTab } from "@/components/tabs/AiTab";
import { PipelineTab } from "@/components/tabs/PipelineTab";
import { ServerTab } from "@/components/tabs/ServerTab";
import { UsageTab } from "@/components/tabs/UsageTab";

const TABS = [
  { id: "ai", label: "AI 한도·호출" },
  { id: "pipeline", label: "분석 파이프라인" },
  { id: "server", label: "서버 상태" },
  { id: "usage", label: "사용 데이터" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const PERIODS: Days[] = [7, 14, 30];

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>("ai");
  const [days, setDays] = useState<Days>(7);

  const toLogin = useCallback(
    (reason?: string) => {
      clearToken();
      router.replace(reason ? `/login/?error=${reason}` : "/login/");
    },
    [router],
  );
  const onUnauthorized = useCallback((reason: AuthFailure) => toLogin(reason), [toLogin]);

  useEffect(() => {
    const state = tokenState();
    if (state === "valid") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 토큰은 브라우저 저장소에만 있어 화면을 그린 뒤 확인한다.
      setReady(true);
    } else {
      toLogin(state === "expired" ? "expired" : undefined);
    }
  }, [toLogin]);

  if (!ready) {
    return null;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">Trova 운영 대시보드</h1>
        <button
          type="button"
          onClick={() => toLogin()}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)]"
        >
          로그아웃
        </button>
      </header>

      <SummaryCards onUnauthorized={onUnauthorized} />

      {/* 필터는 그래프 위 한 줄에: 탭과 기간. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)]">
        <nav role="tablist" aria-label="대시보드 탭" className="-mb-px grid w-full grid-cols-2 gap-x-1 sm:flex sm:w-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-left text-sm sm:text-center ${
                tab === t.id
                  ? "border-[var(--accent)] font-semibold text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div role="group" aria-label="기간" className="mb-2 flex rounded-lg border border-[var(--border)] p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={days === p}
              onClick={() => setDays(p)}
              className={`rounded-md px-3 py-1 text-sm tabular-nums ${
                days === p ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)]"
              }`}
            >
              {p}일
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel">
        {tab === "ai" && <AiTab days={days} onUnauthorized={onUnauthorized} />}
        {tab === "pipeline" && <PipelineTab days={days} onUnauthorized={onUnauthorized} />}
        {tab === "server" && <ServerTab days={days} onUnauthorized={onUnauthorized} />}
        {tab === "usage" && <UsageTab days={days} onUnauthorized={onUnauthorized} />}
      </div>
    </main>
  );
}
