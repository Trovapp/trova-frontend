"use client";

import { useEffect, useState } from "react";
import { KakaoMap, type MapPin } from "@/components/KakaoMap";
import { FolderPickerModal } from "@/components/FolderPickerModal";
import { getDayColor } from "@/lib/itinerary";
import { addBookmark, listBookmarks, type Bookmark } from "@/lib/api/bookmarks";
import { getPlaceDetails, searchPlaces, type PlaceDetail, type RecommendedPlace } from "@/lib/api/recommendations";
import { renderHighlightedText } from "@/lib/richText";
import {
  addTripPlace,
  checkWeather,
  getTrip,
  removeTripPlace,
  reorderTripPlace,
  updateTripPlaceDetails,
  type TripDetail,
} from "@/lib/api/trips";

const TRANSPORT_LABEL: Record<string, string> = {
  WALK: "도보",
  TRANSIT: "대중교통",
  CAR: "차량",
};

export function TripDetailView({ trip: initialTrip }: { trip: TripDetail }) {
  const [trip, setTrip] = useState(initialTrip);
  const [activeDay, setActiveDay] = useState(trip.days[0]?.day ?? 1);
  const [activeTab, setActiveTab] = useState<"search" | "bookmarks">("search");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecommendedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkedPlaceIds, setBookmarkedPlaceIds] = useState<Set<number>>(new Set());
  const [expandedPlaceId, setExpandedPlaceId] = useState<number | null>(null);
  const [reviewSummaries, setReviewSummaries] = useState<
    Map<
      number,
      Pick<PlaceDetail, "highlights" | "pros" | "cons" | "hours" | "fee" | "tips" | "checklist" | "reviewSnippets">
    >
  >(new Map());
  const [detailsLoadingId, setDetailsLoadingId] = useState<number | null>(null);
  const [showRawReviews, setShowRawReviews] = useState(false);
  const [editingField, setEditingField] = useState<{ placeId: number; field: "time" | "transport" | "memo" } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherMessage, setWeatherMessage] = useState<string | null>(null);
  const [folderPickerPlaceId, setFolderPickerPlaceId] = useState<number | null>(null);

  useEffect(() => {
    listBookmarks()
      .then((result) => {
        setBookmarks(result);
        setBookmarkedPlaceIds(new Set(result.map((b) => b.placeId)));
      })
      .catch(() => setError("찜한 장소를 불러오지 못했어요."));
  }, []);

  const dayColor = getDayColor(activeDay);
  const activeDayData = trip.days.find((d) => d.day === activeDay);
  const places = activeDayData?.places ?? [];
  const pins: MapPin[] = places
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({ id: String(p.id), latitude: p.latitude as number, longitude: p.longitude as number }));

  async function reload() {
    const fresh = await getTrip(trip.id);
    setTrip(fresh);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    setError(null);
    try {
      const results = await searchPlaces(query.trim());
      setSearchResults(results);
    } catch {
      setError("장소를 찾지 못했어요. 다른 검색어로 시도해보세요.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAddPlace(googlePlaceId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await addTripPlace(trip.id, activeDay, googlePlaceId);
      await reload();
    } catch {
      setError("장소를 추가하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleDetails(placeId: number) {
    if (expandedPlaceId === placeId) {
      setExpandedPlaceId(null);
      return;
    }
    setExpandedPlaceId(placeId);
    setShowRawReviews(false);
    if (reviewSummaries.has(placeId)) return;
    setDetailsLoadingId(placeId);
    try {
      const detail = await getPlaceDetails(placeId);
      setReviewSummaries((current) =>
        new Map(current).set(placeId, {
          highlights: detail.highlights,
          pros: detail.pros,
          cons: detail.cons,
          hours: detail.hours,
          fee: detail.fee,
          tips: detail.tips,
          checklist: detail.checklist,
          reviewSnippets: detail.reviewSnippets,
        })
      );
    } catch {
      setReviewSummaries((current) =>
        new Map(current).set(placeId, {
          highlights: "리뷰를 불러오지 못했어요.",
          pros: [],
          cons: [],
          hours: null,
          fee: null,
          tips: [],
          checklist: [],
          reviewSnippets: [],
        })
      );
    } finally {
      setDetailsLoadingId(null);
    }
  }

  async function handleToggleBookmark(placeId: number) {
    if (bookmarkedPlaceIds.has(placeId)) return;
    setFolderPickerPlaceId(placeId);
  }

  async function handlePickFolder(folderId: number | null) {
    if (folderPickerPlaceId === null) return;
    const placeId = folderPickerPlaceId;
    setFolderPickerPlaceId(null);
    try {
      const created = await addBookmark(placeId, folderId);
      setBookmarkedPlaceIds((current) => new Set(current).add(placeId));
      setBookmarks((current) => [created, ...current]);
    } catch {
      setError("찜하기에 실패했어요.");
    }
  }

  async function handleRemove(placeId: number) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await removeTripPlace(placeId);
      await reload();
    } catch {
      setError("장소를 삭제하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReorder(placeId: number, direction: "UP" | "DOWN") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await reorderTripPlace(placeId, direction);
      await reload();
    } catch {
      setError("순서를 바꾸지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateDetails(
    placeId: number,
    patch: Parameters<typeof updateTripPlaceDetails>[1]
  ) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await updateTripPlaceDetails(placeId, patch);
      await reload();
    } catch {
      setError("저장하지 못했어요.");
    } finally {
      setBusy(false);
      setEditingField(null);
    }
  }

  async function handleCheckWeather() {
    if (busy) return;
    setBusy(true);
    setWeatherMessage(null);
    try {
      const result = await checkWeather(trip.id, activeDay);
      setWeatherMessage(result.message);
    } catch {
      setWeatherMessage("날씨 확인에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {trip.days.map((d) => (
            <button
              key={d.day}
              type="button"
              onClick={() => setActiveDay(d.day)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                d.day === activeDay ? "bg-accent text-white" : "bg-bg-muted text-ink-muted hover:text-ink"
              }`}
            >
              {d.day}일차{d.date ? ` (${d.date.slice(5)})` : ""}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCheckWeather}
          disabled={busy || !activeDayData?.date}
          className="text-sm font-medium text-accent hover:underline disabled:opacity-40 disabled:hover:no-underline"
        >
          날씨 확인
        </button>
      </div>

      {weatherMessage && (
        <p className="rounded-lg bg-accent-bg px-3 py-2 text-sm text-ink">{weatherMessage}</p>
      )}
      {error && <p className="text-sm text-accent">{error}</p>}

      {pins.length > 0 && <KakaoMap pins={pins} color={dayColor} />}

      <ul className="flex flex-col gap-2">
        {places.map((place, index) => (
          <li
            key={place.id}
            className="flex flex-col gap-2 rounded-lg border border-border-subtle p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {place.visitOrder}. {place.placeName}
                </p>
                {place.address && <p className="truncate text-xs text-ink-muted">{place.address}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReorder(place.id, "UP")}
                  disabled={busy || index === 0}
                  className="text-xs text-ink-muted hover:text-ink disabled:opacity-30"
                  aria-label="위로 이동"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(place.id, "DOWN")}
                  disabled={busy || index === places.length - 1}
                  className="text-xs text-ink-muted hover:text-ink disabled:opacity-30"
                  aria-label="아래로 이동"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(place.id)}
                  disabled={busy}
                  className="text-xs text-ink-muted hover:text-accent"
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              {editingField?.placeId === place.id && editingField.field === "time" ? (
                // 도착 시간 하나만 받는다 — 종료 시간은 이 화면 어디에도 쓰이지 않아서
                // (캘린더형 블록 뷰가 아니라 리스트) 입력만 시키고 버려지는 값이었다.
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const start = (form.elements.namedItem("start") as HTMLInputElement).value;
                    handleUpdateDetails(place.id, { visitStartTime: start || undefined });
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    name="start"
                    type="time"
                    defaultValue={place.visitStartTime?.slice(0, 5) ?? ""}
                    className="rounded border border-border px-1 py-0.5 text-xs"
                  />
                  <button type="submit" className="text-accent">저장</button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingField({ placeId: place.id, field: "time" })}
                  className="hover:text-ink"
                >
                  {place.visitStartTime ? `${place.visitStartTime.slice(0, 5)} 도착` : "시간 추가"}
                </button>
              )}

              {editingField?.placeId === place.id && editingField.field === "transport" ? (
                <select
                  autoFocus
                  defaultValue={place.arrivalTransportMode ?? ""}
                  onChange={(e) =>
                    handleUpdateDetails(place.id, {
                      arrivalTransportMode: e.target.value as "WALK" | "TRANSIT" | "CAR",
                    })
                  }
                  onBlur={() => setEditingField(null)}
                  className="rounded border border-border px-1 py-0.5 text-xs"
                >
                  <option value="" disabled>
                    선택
                  </option>
                  <option value="WALK">도보</option>
                  <option value="TRANSIT">대중교통</option>
                  <option value="CAR">차량</option>
                </select>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingField({ placeId: place.id, field: "transport" })}
                  className="hover:text-ink"
                >
                  {place.arrivalTransportMode ? TRANSPORT_LABEL[place.arrivalTransportMode] : "이동수단 추가"}
                </button>
              )}

              {editingField?.placeId === place.id && editingField.field === "memo" ? (
                <input
                  autoFocus
                  type="text"
                  defaultValue={place.memo ?? ""}
                  onBlur={(e) => handleUpdateDetails(place.id, { memo: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  className="rounded border border-border px-1 py-0.5 text-xs"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingField({ placeId: place.id, field: "memo" })}
                  className="max-w-[10rem] truncate hover:text-ink"
                >
                  {place.memo || "메모 추가"}
                </button>
              )}
            </div>
          </li>
        ))}
        {places.length === 0 && (
          <li className="rounded-lg border border-dashed border-border-subtle p-4 text-center text-sm text-ink-muted">
            아직 장소가 없어요. 아래에서 검색해서 추가해보세요.
          </li>
        )}
      </ul>

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
        <div className="flex gap-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={activeTab === "search" ? "text-accent" : "text-ink-muted hover:text-ink"}
          >
            검색
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bookmarks")}
            className={activeTab === "bookmarks" ? "text-accent" : "text-ink-muted hover:text-ink"}
          >
            찜한 장소
          </button>
        </div>

        {activeTab === "search" ? (
          <>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="장소 이름으로 검색 (예: 경복궁)"
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {searching ? "검색 중..." : "검색"}
              </button>
            </form>
            <ul className="flex flex-col gap-2">
              {searchResults.map((place) => (
                <li key={place.id} className="rounded-lg border border-border-subtle p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{place.name}</p>
                      {place.address && <p className="truncate text-xs text-ink-muted">{place.address}</p>}
                      {(place.rating !== null || place.userRatingCount !== null) && (
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {place.rating !== null && `⭐ ${place.rating.toFixed(1)}`}
                          {place.userRatingCount !== null && ` (리뷰 ${place.userRatingCount}개)`}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(place.id)}
                        aria-label={bookmarkedPlaceIds.has(place.id) ? "찜한 장소" : "찜하기"}
                        className="text-lg leading-none"
                      >
                        {bookmarkedPlaceIds.has(place.id) ? "⭐" : "☆"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPlace(place.googlePlaceId)}
                        disabled={busy}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDetails(place.id)}
                    className="mt-2 text-xs text-accent hover:underline"
                  >
                    {expandedPlaceId === place.id ? "상세 접기" : "상세보기"}
                  </button>
                  {expandedPlaceId === place.id && (
                    <div className="mt-1 flex flex-col gap-2">
                      {detailsLoadingId === place.id ? (
                        <p className="text-xs text-ink-muted">리뷰 요약을 불러오는 중...</p>
                      ) : (
                        (() => {
                          const detail = reviewSummaries.get(place.id);
                          if (!detail) return null;
                          return (
                            <>
                              <p className="text-xs text-ink">{renderHighlightedText(detail.highlights)}</p>

                              {(detail.pros.length > 0 || detail.cons.length > 0) && (
                                <div className="grid grid-cols-2 gap-2">
                                  {detail.pros.length > 0 && (
                                    <div>
                                      <p className="text-[11px] font-medium text-ink-muted">👍 좋은 점</p>
                                      <ul>
                                        {detail.pros.map((p, i) => (
                                          <li key={i} className="text-xs text-ink">
                                            {p}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {detail.cons.length > 0 && (
                                    <div>
                                      <p className="text-[11px] font-medium text-ink-muted">👎 아쉬운 점</p>
                                      <ul>
                                        {detail.cons.map((c, i) => (
                                          <li key={i} className="text-xs text-ink">
                                            {c}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {(detail.hours || detail.fee) && (
                                <div className="flex flex-col gap-0.5 text-xs text-ink">
                                  {detail.hours && <p>🕐 {detail.hours}</p>}
                                  {detail.fee && <p>💰 {detail.fee}</p>}
                                </div>
                              )}

                              {detail.tips.length > 0 && (
                                <div className="rounded-md bg-accent-bg p-2">
                                  <p className="text-[11px] font-medium text-accent">💡 꿀팁</p>
                                  <ul>
                                    {detail.tips.map((tip, i) => (
                                      <li key={i} className="text-xs text-ink">
                                        {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {detail.checklist.length > 0 && (
                                <ul className="flex flex-col gap-0.5">
                                  {detail.checklist.map((item, i) => (
                                    <li key={i} className="text-xs text-ink">
                                      ☐ {item}
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {detail.reviewSnippets.length > 0 && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => setShowRawReviews((current) => !current)}
                                    className="text-[11px] font-medium text-ink-muted hover:text-ink"
                                  >
                                    {showRawReviews ? "실제 리뷰 원문 접기 ▲" : "실제 리뷰 원문 보기 ▼"}
                                  </button>
                                  {showRawReviews && (
                                    <div className="mt-1 flex flex-col gap-1">
                                      {detail.reviewSnippets.slice(0, 3).map((snippet, i) => (
                                        <p
                                          key={i}
                                          className="border-l-2 border-border-subtle pl-2 text-xs text-ink-muted"
                                        >
                                          &ldquo;{snippet}&rdquo;
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <ul className="flex flex-col gap-2">
            {bookmarks.length === 0 && <li className="text-sm text-ink-muted">아직 찜한 장소가 없어요.</li>}
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle p-3"
              >
                <p className="truncate text-sm font-medium text-ink">{bookmark.placeName}</p>
                <button
                  type="button"
                  onClick={() => handleAddPlace(bookmark.googlePlaceId)}
                  disabled={busy}
                  className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  추가
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FolderPickerModal
        visible={folderPickerPlaceId !== null}
        onClose={() => setFolderPickerPlaceId(null)}
        onPick={handlePickFolder}
      />
    </div>
  );
}
