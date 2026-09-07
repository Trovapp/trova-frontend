"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getPendingJobs } from "@/lib/api/places";
import { useAuth } from "@/lib/auth/AuthContext";

const POLL_INTERVAL_MS = 3000;

const STATUS_LABEL: Record<"PENDING" | "PROCESSING", string> = {
  PENDING: "대기열에 있어요...",
  PROCESSING: "AI가 영상을 분석하고 있어요",
};

export default function ProcessingPage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"PENDING" | "PROCESSING" | "FAILED" | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const sourceUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const missCountRef = { current: 0 };
    const MAX_INITIAL_MISSES = 3;

    async function poll() {
      const jobs = await getPendingJobs();
      if (cancelled) return;

      const job = jobs.find((j) => String(j.jobId) === params.jobId);

      if (!job) {
        // 아직 이 job을 한 번도 못 봤다면(sourceUrlRef가 비어있다면), 비동기 처리가 아직
        // PENDING/PROCESSING으로 못 넘어간 것일 수 있다 — 바로 완료로 간주하지 않고 몇 번 더
        // 재시도한다. (예: 일정 생성 트리거는 202 응답 후 markProcessing이 비동기로 늦게
        // 반영될 수 있어서, 첫 폴링에서 이미 "없음"으로 보일 수 있다.)
        if (sourceUrlRef.current === null && missCountRef.current < MAX_INITIAL_MISSES) {
          missCountRef.current += 1;
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }
        // 더 이상 대기 목록에 없다 = 처리가 끝나서 저장 장소로 넘어갔다는 뜻.
        const sourceUrl = sourceUrlRef.current;
        router.replace(sourceUrl ? `/places/${encodeURIComponent(sourceUrl)}` : "/places");
        return;
      }

      sourceUrlRef.current = job.sourceUrl;
      setTitle(job.title);
      setStatus(job.status);

      if (job.status !== "FAILED") {
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [authLoading, user, params.jobId, router]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      {status === "FAILED" ? (
        <>
          <h1 className="text-xl font-semibold text-ink">분석에 실패했어요</h1>
          {title && <p className="mt-2 text-sm text-ink-muted">{title}</p>}
          <Link
            href="/"
            className="mt-6 text-sm font-medium text-accent hover:underline"
          >
            다시 시도하기
          </Link>
        </>
      ) : (
        <>
          <div className="mb-6 h-10 w-10 animate-spin rounded-full border-4 border-border-subtle border-t-accent" />
          <h1 className="text-xl font-semibold text-ink">
            {status ? STATUS_LABEL[status] : "불러오는 중..."}
          </h1>
          {title && <p className="mt-2 text-sm text-ink-muted">{title}</p>}
          <p className="mt-2 max-w-sm text-sm text-ink-muted">
            영상 다운로드부터 장소 추출까지 최대 몇 분 걸릴 수 있어요. 이 페이지를 열어둔 채
            기다리시면 완료되는 대로 자동으로 이동해요.
          </p>
        </>
      )}
    </main>
  );
}
