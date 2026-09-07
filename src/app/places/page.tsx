"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlaces } from "@/lib/api/places";
import { VideoCard } from "@/components/VideoCard";
import { LoadingProgress } from "@/components/LoadingProgress";
import { useAuth } from "@/lib/auth/AuthContext";
import { buildVideoSummaries } from "@/lib/videoGroups";
import type { SavedPlace } from "@/lib/types";

const POLL_INTERVAL_MS = 4000;

export default function PlacesPage() {
  const { user, loading: authLoading } = useAuth();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    // 처리중인 영상이 남아있는 동안엔 몇 초마다 다시 불러온다 — 그래야 상세 페이지를
    // 오가지 않아도 "처리중" 상태가 저절로 "완료"로 바뀐다.
    async function loadAndSchedule() {
      const result = await getPlaces();
      if (cancelled) return;
      setPlaces(result);
      setDataLoading(false);

      const stillProcessing = result.some(
        (place) => place.status === "PENDING" || place.status === "PROCESSING"
      );
      if (stillProcessing) {
        timeoutId = setTimeout(loadAndSchedule, POLL_INTERVAL_MS);
      }
    }

    loadAndSchedule();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [authLoading, user]);

  const loading = authLoading || (!!user && dataLoading);
  const videos = buildVideoSummaries(places);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-xl font-semibold text-ink">저장한 장소</h1>

      {loading ? (
        <LoadingProgress />
      ) : !user ? (
        <p className="text-sm text-ink-muted">
          저장한 장소를 보려면{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            로그인
          </Link>
          이 필요해요.
        </p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-ink-muted">아직 저장한 장소가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {videos.map((video) => (
            <VideoCard key={video.sourceUrl} video={video} />
          ))}
        </ul>
      )}
    </main>
  );
}
