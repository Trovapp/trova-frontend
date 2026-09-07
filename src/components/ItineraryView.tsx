"use client";

import { useState } from "react";
import type { SavedPlace } from "@/lib/types";
import { getDayColor, groupByDay } from "@/lib/itinerary";
import { PlaceMapSection } from "@/components/PlaceMapSection";
import { moveToDay, optimizeRoute, reorderPlace } from "@/lib/api/places";

export function ItineraryView({ places }: { places: SavedPlace[] }) {
  const [localPlaces, setLocalPlaces] = useState(places);
  const [editing, setEditing] = useState(false);
  const [emptyDayNumbers, setEmptyDayNumbers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const days = groupByDay(localPlaces);
  const dayNumbers = Array.from(new Set([...days.keys(), ...emptyDayNumbers])).sort((a, b) => a - b);
  // activeDay를 한 번만 초기화해도 안전한 이유: 부모(page.tsx)의 폴링 루프는 이 소스 영상에
  // PENDING/PROCESSING 상태인 place가 있는 동안만 계속되는데, 그 상태는 이 영상에 대한 place
  // row가 아직 하나도 없을 때만 존재한다(Task 6 de-dup 필터). 반면 ItineraryView는
  // isItineraryGroup(group)이 true일 때만 렌더링되는데, 이는 dayNumber가 채워진 place row가
  // 이미 존재해야 성립한다. 즉 "폴링이 계속 도는 상태"와 "ItineraryView가 마운트된 상태"는
  // 서로 배타적이라 이 컴포넌트가 살아있는 동안 dayNumbers가 바뀌어 재초기화가 필요해질 일이
  // 없다. (de-dup 필터 로직이 바뀌면 이 전제도 같이 재검토해야 한다.)
  const [activeDay, setActiveDay] = useState(dayNumbers[0]);

  const activePlaces = days.get(activeDay) ?? [];
  const unassignedPlaces = localPlaces.filter((place) => place.dayNumber === null);

  async function handleMoveDay(place: SavedPlace, dayNumber: number) {
    if (actionPending) return;
    setActionPending(true);
    const previous = localPlaces;
    const previousEmptyDays = emptyDayNumbers;
    const sourceDay = place.dayNumber;
    setError(null);
    setLocalPlaces((current) =>
      current.map((p) => (p.id === place.id ? { ...p, dayNumber } : p))
    );
    setEmptyDayNumbers((current) => current.filter((d) => d !== dayNumber));

    const sourceDayNowEmpty =
      sourceDay !== null &&
      sourceDay === activeDay &&
      !localPlaces.some((p) => p.id !== place.id && p.dayNumber === sourceDay);
    if (sourceDayNowEmpty) {
      setActiveDay(dayNumber);
    }

    try {
      const updated = await moveToDay(place.id, dayNumber);
      setLocalPlaces((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      setLocalPlaces(previous);
      setEmptyDayNumbers(previousEmptyDays);
      setError("장소를 옮기지 못했어요. 다시 시도해주세요.");
    } finally {
      setActionPending(false);
    }
  }

  async function handleReorder(place: SavedPlace, direction: "UP" | "DOWN") {
    if (actionPending) return;
    if (place.dayNumber === null) return;
    const dayPlaces = days.get(place.dayNumber) ?? [];
    const index = dayPlaces.findIndex((p) => p.id === place.id);
    const swapIndex = direction === "UP" ? index - 1 : index + 1;
    if (index < 0 || swapIndex < 0 || swapIndex >= dayPlaces.length) {
      return; // 경계값 — no-op, 백엔드와 동일한 규칙
    }
    const neighbor = dayPlaces[swapIndex];

    setActionPending(true);
    const previous = localPlaces;
    setError(null);
    const placeOrder = place.orderInDay;
    const neighborOrder = neighbor.orderInDay;
    setLocalPlaces((current) =>
      current.map((p) => {
        if (p.id === place.id) return { ...p, orderInDay: neighborOrder };
        if (p.id === neighbor.id) return { ...p, orderInDay: placeOrder };
        return p;
      })
    );

    try {
      const updated = await reorderPlace(place.id, direction);
      setLocalPlaces((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      setLocalPlaces(previous);
      setError("순서를 바꾸지 못했어요. 다시 시도해주세요.");
    } finally {
      setActionPending(false);
    }
  }

  function handleAddDay() {
    const maxDay = dayNumbers.length > 0 ? Math.max(...dayNumbers) : 0;
    const nextDay = maxDay + 1;
    setEmptyDayNumbers((current) => [...current, nextDay]);
    setActiveDay(nextDay);
  }

  async function handleOptimizeRoute() {
    if (actionPending || activePlaces.length < 2) return;
    const jobId = activePlaces[0]?.jobId;
    if (jobId === undefined) return;

    setActionPending(true);
    setError(null);
    try {
      const updated = await optimizeRoute(jobId, activeDay);
      const updatedById = new Map(updated.map((p) => [p.id, p]));
      setLocalPlaces((current) => current.map((p) => updatedById.get(p.id) ?? p));
    } catch {
      setError("동선을 최적화하지 못했어요. 다시 시도해주세요.");
    } finally {
      setActionPending(false);
    }
  }

  function handleDeleteDay(day: number) {
    setEmptyDayNumbers((current) => current.filter((d) => d !== day));
    if (activeDay === day) {
      const remaining = dayNumbers.filter((d) => d !== day);
      setActiveDay(remaining[0]);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {dayNumbers.map((day) => {
            const count = (days.get(day) ?? []).length;
            return (
              <div key={day} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    day === activeDay
                      ? "bg-accent text-white"
                      : "bg-bg-muted text-ink-muted hover:text-ink"
                  }`}
                >
                  {day}일차
                </button>
                {editing && count === 0 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteDay(day)}
                    aria-label={`${day}일차 삭제`}
                    className="text-xs text-ink-muted hover:text-accent"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
          {editing && (
            <button
              type="button"
              onClick={handleAddDay}
              className="rounded-full border border-dashed border-border-subtle px-4 py-1.5 text-sm text-ink-muted hover:text-ink"
            >
              + 날짜 추가
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOptimizeRoute}
            disabled={actionPending || activePlaces.length < 2}
            className="text-sm font-medium text-accent hover:underline disabled:opacity-40 disabled:hover:no-underline"
          >
            동선 최적화
          </button>
          <button
            type="button"
            onClick={() => setEditing((current) => !current)}
            className="text-sm font-medium text-accent hover:underline"
          >
            {editing ? "편집 완료" : "편집"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <PlaceMapSection
        key={activeDay}
        places={activePlaces}
        editable={editing}
        availableDayNumbers={dayNumbers}
        onMoveDay={handleMoveDay}
        onReorder={handleReorder}
        disabled={actionPending}
        color={getDayColor(activeDay)}
      />

      {unassignedPlaces.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
          <p className="text-sm font-medium text-ink-muted">일자 미분류</p>
          <PlaceMapSection
            places={unassignedPlaces}
            editable={editing}
            availableDayNumbers={dayNumbers}
            onMoveDay={handleMoveDay}
            disabled={actionPending}
          />
        </div>
      )}
    </div>
  );
}
