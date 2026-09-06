"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KakaoMap, type MapPin } from "@/components/KakaoMap";
import { UrlInputForm } from "@/components/UrlInputForm";
import { getPlaces } from "@/lib/api/places";
import { listTrips, type Trip } from "@/lib/api/trips";
import { listBookmarks, type Bookmark } from "@/lib/api/bookmarks";
import type { CurrentUser } from "@/lib/api/auth";
import type { SavedPlace } from "@/lib/types";

export function HomeDashboard({ user }: { user: CurrentUser }) {
  const [places, setPlaces] = useState<SavedPlace[] | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPlaces()
      .then((result) => !cancelled && setPlaces(result))
      .catch(() => !cancelled && setPlaces([]));
    listTrips()
      .then((result) => !cancelled && setTrips(result))
      .catch(() => !cancelled && setTrips([]));
    listBookmarks()
      .then((result) => !cancelled && setBookmarks(result))
      .catch(() => !cancelled && setBookmarks([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = places === null || trips === null || bookmarks === null;
  const pins: MapPin[] =
    places
      ?.filter((place) => place.status === "DONE")
      .map((place) => ({ id: place.id, latitude: place.latitude, longitude: place.longitude })) ?? [];
  const hasAnyData = (places?.length ?? 0) > 0 || (trips?.length ?? 0) > 0 || (bookmarks?.length ?? 0) > 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">
        {user.nickname ?? "여행자"}님, 어디로 떠나볼까요?
      </h1>

      <div className="mt-6 rounded-xl border border-border-subtle p-4">
        <UrlInputForm />
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-muted">불러오는 중...</p>
      ) : !hasAnyData ? (
        <p className="mt-8 text-sm text-ink-muted">
          아직 저장한 장소가 없어요. 여행 영상 링크를 붙여넣어서 첫 장소를 저장해보세요.
        </p>
      ) : (
        <>
          {pins.length > 0 && (
            <div className="mt-8">
              <Link href="/places" className="mb-2 block text-sm font-medium text-ink hover:text-accent">
                내 지도 →
              </Link>
              <div className="h-64 overflow-hidden rounded-xl border border-border-subtle">
                <KakaoMap pins={pins} />
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/places"
              className="rounded-xl border border-border-subtle p-4 transition-colors hover:border-accent"
            >
              <p className="text-2xl font-semibold text-ink">{places?.length ?? 0}</p>
              <p className="mt-1 text-sm text-ink-muted">저장한 장소</p>
            </Link>
            <Link
              href="/trips"
              className="rounded-xl border border-border-subtle p-4 transition-colors hover:border-accent"
            >
              <p className="text-2xl font-semibold text-ink">{trips?.length ?? 0}</p>
              <p className="mt-1 text-sm text-ink-muted">내 여행</p>
            </Link>
            <Link
              href="/bookmarks"
              className="rounded-xl border border-border-subtle p-4 transition-colors hover:border-accent"
            >
              <p className="text-2xl font-semibold text-ink">{bookmarks?.length ?? 0}</p>
              <p className="mt-1 text-sm text-ink-muted">찜한 장소</p>
            </Link>
          </div>

          {trips && trips.length > 0 && (
            <div className="mt-8">
              <p className="mb-2 text-sm font-medium text-ink">최근 여행</p>
              <ul className="flex flex-col gap-2">
                {trips.slice(0, 3).map((trip) => (
                  <li key={trip.id}>
                    <Link
                      href={`/trips/${trip.id}`}
                      className="block rounded-lg border border-border-subtle p-3 transition-colors hover:border-accent"
                    >
                      <p className="truncate text-sm font-medium text-ink">{trip.title}</p>
                      {trip.startDate && (
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {trip.startDate} ~ {trip.endDate}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </main>
  );
}
