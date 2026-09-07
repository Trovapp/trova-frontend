"use client";

import { Fragment, useState } from "react";
import type { SavedPlace } from "@/lib/types";
import { KakaoMap } from "@/components/KakaoMap";
import { PlaceCard } from "@/components/PlaceCard";
import { haversineDistanceKm } from "@/lib/geo";

type PlaceMapSectionProps = {
  places: SavedPlace[];
  editable?: boolean;
  availableDayNumbers?: number[];
  onMoveDay?: (place: SavedPlace, dayNumber: number) => void;
  onReorder?: (place: SavedPlace, direction: "UP" | "DOWN") => void;
  disabled?: boolean;
  color?: string;
};

const DEFAULT_COLOR = "#FF6B4A";

function hasValidCoords(place: SavedPlace): boolean {
  return place.latitude !== 0 || place.longitude !== 0;
}

export function PlaceMapSection({
  places,
  editable = false,
  availableDayNumbers = [],
  onMoveDay,
  onReorder,
  disabled = false,
  color,
}: PlaceMapSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const nodeColor = color ?? DEFAULT_COLOR;

  return (
    <div className="flex flex-col gap-4">
      <KakaoMap
        pins={places.map((place) => ({
          id: place.id,
          latitude: place.latitude,
          longitude: place.longitude,
        }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
        color={color}
      />
      <p className="text-xs text-ink-muted">
        핀은 영상에 나온 순서대로 직선으로 이었어요 — 실제 이동 경로는 아니에요.
      </p>

      <ul className="flex flex-col">
        {places.map((place, index) => {
          const isLast = index === places.length - 1;
          const next = places[index + 1];
          const distanceKm =
            !isLast && hasValidCoords(place) && next && hasValidCoords(next)
              ? haversineDistanceKm(place.latitude, place.longitude, next.latitude, next.longitude)
              : null;

          return (
            <Fragment key={place.id}>
              <li className={`relative pl-10 ${isLast ? "" : "pb-7"}`}>
                {!isLast && (
                  <div className="absolute bottom-[-4px] left-[15px] top-8 w-0.5 bg-border-subtle" />
                )}
                <div
                  className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow"
                  style={{ background: nodeColor }}
                >
                  {index + 1}
                </div>

                <PlaceCard
                  place={place}
                  selected={place.id === selectedId}
                  onClick={() => setSelectedId(place.id)}
                />

                {editable && (
                  <div className="mt-2 flex items-center gap-3 pl-1">
                    {onReorder && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={disabled || index === 0}
                          onClick={() => onReorder(place, "UP")}
                          className="rounded border border-border-subtle px-2 py-0.5 text-xs text-ink-muted hover:text-ink disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={disabled || isLast}
                          onClick={() => onReorder(place, "DOWN")}
                          className="rounded border border-border-subtle px-2 py-0.5 text-xs text-ink-muted hover:text-ink disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                    {onMoveDay && availableDayNumbers.length > 0 && (
                      <select
                        value={place.dayNumber ?? ""}
                        onChange={(e) => onMoveDay(place, Number(e.target.value))}
                        disabled={disabled}
                        className="rounded border border-border-subtle bg-bg px-2 py-0.5 text-xs text-ink-muted"
                      >
                        <option value="" disabled>
                          날짜 선택
                        </option>
                        {availableDayNumbers.map((day) => (
                          <option key={day} value={day}>
                            {day}일차
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </li>

              {!isLast && (
                <li className="relative h-8 pl-10" aria-hidden={distanceKm === null}>
                  <div className="absolute inset-y-0 left-[15px] w-0.5 bg-border-subtle" />
                  {distanceKm !== null && (
                    <span className="absolute left-[15px] top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-border-subtle bg-bg px-2 py-0.5 text-[10.5px] text-ink-muted">
                      {distanceKm.toFixed(1)}km
                    </span>
                  )}
                </li>
              )}
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
