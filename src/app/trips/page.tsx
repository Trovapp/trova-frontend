"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listTrips, type Trip } from "@/lib/api/trips";
import { LoadingProgress } from "@/components/LoadingProgress";
import { useAuth } from "@/lib/auth/AuthContext";

export default function TripsPage() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    listTrips()
      .then((result) => {
        if (!cancelled) setTrips(result);
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const loading = authLoading || (!!user && dataLoading);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">내 여행</h1>
        {user && (
          <Link
            href="/trips/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            새 여행 만들기
          </Link>
        )}
      </div>

      {loading ? (
        <LoadingProgress />
      ) : !user ? (
        <p className="text-sm text-ink-muted">
          내 여행을 보려면{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            로그인
          </Link>
          이 필요해요.
        </p>
      ) : trips.length === 0 ? (
        <p className="text-sm text-ink-muted">아직 만든 여행이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="block rounded-xl border border-border-subtle p-4 transition-colors hover:border-accent"
              >
                <p className="truncate font-medium text-ink">{trip.title}</p>
                {trip.startDate && (
                  <p className="mt-1 text-xs text-ink-muted">
                    {trip.startDate} ~ {trip.endDate}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
