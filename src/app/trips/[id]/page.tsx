"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getTrip, type TripDetail } from "@/lib/api/trips";
import { TripDetailView } from "@/components/TripDetailView";
import { LoadingProgress } from "@/components/LoadingProgress";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const tripId = Number(params.id);
  const { user, loading: authLoading } = useAuth();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    getTrip(tripId)
      .then((result) => {
        if (!cancelled) setTrip(result);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, tripId]);

  const loading = authLoading || (!!user && dataLoading);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link href="/trips" className="text-sm text-ink-muted hover:text-ink">
        ← 내 여행
      </Link>

      {loading ? (
        <div className="mt-6">
          <LoadingProgress />
        </div>
      ) : !user ? (
        <p className="mt-6 text-sm text-ink-muted">
          이 페이지를 보려면{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            로그인
          </Link>
          이 필요해요.
        </p>
      ) : notFound || !trip ? (
        <p className="mt-6 text-sm text-ink-muted">여행을 찾을 수 없어요.</p>
      ) : (
        <>
          <h1 className="mt-4 text-xl font-semibold text-ink">{trip.title}</h1>
          {trip.startDate && (
            <p className="mb-6 mt-1 text-sm text-ink-muted">
              {trip.startDate} ~ {trip.endDate}
            </p>
          )}
          <TripDetailView trip={trip} />
        </>
      )}
    </main>
  );
}
