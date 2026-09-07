import type { SavedPlace } from "@/lib/types";
import { CategoryBadge } from "@/components/CategoryBadge";

const STATUS_LABEL: Record<SavedPlace["status"], string> = {
  PENDING: "대기중",
  PROCESSING: "처리중",
  DONE: "완료",
  FAILED: "실패",
};

const PLATFORM_LABEL: Record<SavedPlace["sourcePlatform"], string> = {
  INSTAGRAM: "인스타그램",
  YOUTUBE: "유튜브",
};

function stopPropagation(e: React.MouseEvent) {
  e.stopPropagation();
}

export function PlaceCard({
  place,
  selected = false,
  onClick,
}: {
  place: SavedPlace;
  selected?: boolean;
  onClick?: () => void;
}) {
  const isDone = place.status === "DONE";
  const addressLine = place.roadAddress ?? place.address ?? place.region;
  const hasLinks = place.phone || place.kakaoPlaceUrl;

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 transition-colors ${
        selected ? "border-accent bg-accent-bg" : "border-border-subtle"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">
            {place.placeName || "장소명 추출 중"}
          </p>
          {addressLine && (
            <p className="mt-0.5 truncate text-sm text-ink-muted">{addressLine}</p>
          )}
          {place.kakaoCategoryName && (
            <p className="mt-0.5 truncate text-xs text-ink-muted">{place.kakaoCategoryName}</p>
          )}
        </div>
        {!isDone && (
          <span className="shrink-0 text-xs text-ink-muted">
            {STATUS_LABEL[place.status]}
          </span>
        )}
      </div>

      {hasLinks && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              onClick={stopPropagation}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-accent hover:underline"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
              {place.phone}
            </a>
          )}
          {place.kakaoPlaceUrl && (
            <a
              href={place.kakaoPlaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={stopPropagation}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-accent hover:underline"
            >
              카카오맵에서 보기 ↗
            </a>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CategoryBadge category={place.category} />
          <span className="text-xs text-ink-muted">
            {PLATFORM_LABEL[place.sourcePlatform]}
          </span>
        </div>
        <time
          dateTime={place.createdAt}
          className="font-mono text-xs text-ink-muted"
        >
          {new Date(place.createdAt).toISOString().slice(0, 10)}
        </time>
      </div>
    </div>
  );
}
