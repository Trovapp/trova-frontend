"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTrip } from "@/lib/api/trips";
import { useAuth } from "@/lib/auth/AuthContext";
import { LoadingProgress } from "@/components/LoadingProgress";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTripPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const trip = await createTrip(title.trim(), startDate, endDate);
      router.push(`/trips/${trip.id}`);
    } catch {
      setError("여행을 만들지 못했어요. 날짜를 확인하고 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link href="/trips" className="text-sm text-ink-muted hover:text-ink">
        ← 내 여행
      </Link>

      <h1 className="mt-4 mb-6 text-xl font-semibold text-ink">새 여행 만들기</h1>

      {authLoading ? (
        <LoadingProgress />
      ) : !user ? (
        <p className="text-sm text-ink-muted">
          여행을 만들려면{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            로그인
          </Link>
          이 필요해요.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            여행 이름
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 김해 당일치기"
              autoFocus
              className="rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm text-ink-muted">
              출발일
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-ink-muted">
              도착일
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
          </div>

          {error && <p className="text-sm text-accent">{error}</p>}

          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "만드는 중..." : "여행 만들기"}
          </button>
        </form>
      )}
    </main>
  );
}
