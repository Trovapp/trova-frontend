import { useState } from "react";
import { getPlaceDetails, type PlaceDetail, type RecommendedPlace } from "@/lib/api/recommendations";
import { CategoryBadge } from "@/components/CategoryBadge";
import { renderHighlightedText } from "@/lib/richText";

const MOOD_LABEL: Record<string, string> = {
  CALM: "차분함",
  LIVELY: "활기참",
  ROMANTIC: "로맨틱",
  TRENDY: "트렌디",
  COZY: "아늑함",
  LUXURIOUS: "고급스러움",
};

const SPACE_LABEL: Record<string, string> = {
  INDOOR: "실내",
  OUTDOOR: "실외",
  MIXED: "실내외",
};

const FAILED_DETAIL: Pick<PlaceDetail, "highlights" | "pros" | "cons" | "hours" | "fee" | "tips" | "checklist" | "reviewSnippets"> = {
  highlights: "리뷰를 불러오지 못했어요.",
  pros: [],
  cons: [],
  hours: null,
  fee: null,
  tips: [],
  checklist: [],
  reviewSnippets: [],
};

function ProsConsList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-ink-muted">{label}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-ink">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecommendedPlaceCard({
  place,
  bookmarked,
  pending,
  onToggleBookmark,
}: {
  place: RecommendedPlace;
  bookmarked: boolean;
  pending?: boolean;
  onToggleBookmark: () => void;
}) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDetail, setReviewDetail] = useState<PlaceDetail | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showRawReviews, setShowRawReviews] = useState(false);

  async function handleOpenReviews() {
    setShowReviewModal(true);
    if (reviewDetail) return;
    setReviewLoading(true);
    try {
      const detail = await getPlaceDetails(place.id);
      setReviewDetail(detail);
    } catch {
      setReviewDetail({ ...place, ...FAILED_DETAIL });
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{place.name}</p>
          {place.address && <p className="mt-0.5 truncate text-sm text-ink-muted">{place.address}</p>}
        </div>
        <button
          type="button"
          onClick={onToggleBookmark}
          disabled={pending}
          aria-label={bookmarked ? "찜 해제" : "찜하기"}
          aria-pressed={bookmarked}
          className="shrink-0 text-xl leading-none disabled:opacity-40"
        >
          {bookmarked ? "⭐" : "☆"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {place.category && <CategoryBadge category={place.category} />}
        {place.mood && (
          <span className="rounded-full bg-bg-muted px-2.5 py-1 text-xs text-ink-muted">
            {MOOD_LABEL[place.mood] ?? place.mood}
          </span>
        )}
        {place.space && (
          <span className="rounded-full bg-bg-muted px-2.5 py-1 text-xs text-ink-muted">
            {SPACE_LABEL[place.space] ?? place.space}
          </span>
        )}
      </div>

      {(place.rating !== null || place.userRatingCount !== null) && (
        <p className="mt-2 text-xs text-ink-muted">
          {place.rating !== null && `⭐ ${place.rating.toFixed(1)}`}
          {place.userRatingCount !== null && ` (리뷰 ${place.userRatingCount}개)`}
        </p>
      )}

      <button
        type="button"
        onClick={handleOpenReviews}
        className="mt-2 text-xs font-medium text-accent hover:underline"
      >
        리뷰 보기
      </button>

      {showReviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setShowReviewModal(false);
            setShowRawReviews(false);
          }}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-border-subtle bg-bg p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{place.name}</p>
                {place.address && <p className="truncate text-xs text-ink-muted">{place.address}</p>}
              </div>
              <button
                type="button"
                onClick={() => {
            setShowReviewModal(false);
            setShowRawReviews(false);
          }}
                aria-label="닫기"
                className="shrink-0 text-ink-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            {reviewLoading ? (
              <p className="text-sm text-ink-muted">리뷰를 불러오는 중...</p>
            ) : (
              reviewDetail && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-ink">{renderHighlightedText(reviewDetail.highlights)}</p>

                  {reviewDetail.pros.length > 0 && reviewDetail.cons.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      <ProsConsList label="👍 좋은 점" items={reviewDetail.pros} />
                      <ProsConsList label="👎 아쉬운 점" items={reviewDetail.cons} />
                    </div>
                  ) : reviewDetail.pros.length > 0 ? (
                    <ProsConsList label="👍 좋은 점" items={reviewDetail.pros} />
                  ) : reviewDetail.cons.length > 0 ? (
                    <ProsConsList label="👎 아쉬운 점" items={reviewDetail.cons} />
                  ) : null}

                  {(reviewDetail.hours || reviewDetail.fee) && (
                    <div className="overflow-hidden rounded-lg border border-border-subtle">
                      {reviewDetail.hours && (
                        <div className="flex gap-3 border-b border-border-subtle p-2 last:border-b-0">
                          <span className="w-14 shrink-0 text-xs font-medium text-ink-muted">운영시간</span>
                          <span className="text-xs text-ink">{reviewDetail.hours}</span>
                        </div>
                      )}
                      {reviewDetail.fee && (
                        <div className="flex gap-3 p-2">
                          <span className="w-14 shrink-0 text-xs font-medium text-ink-muted">요금</span>
                          <span className="text-xs text-ink">{reviewDetail.fee}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {reviewDetail.tips.length > 0 && (
                    <div className="rounded-lg bg-accent-bg p-3">
                      <p className="mb-1 text-xs font-medium text-accent">💡 꿀팁</p>
                      <ul className="flex flex-col gap-1">
                        {reviewDetail.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-ink">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reviewDetail.checklist.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-ink-muted">✅ 체크리스트</p>
                      <ul className="flex flex-col gap-1">
                        {reviewDetail.checklist.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-ink">
                            <span aria-hidden="true">☐</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reviewDetail.reviewSnippets.length > 0 && (
                    <div className="border-t border-border-subtle pt-3">
                      <button
                        type="button"
                        onClick={() => setShowRawReviews((current) => !current)}
                        className="text-xs font-medium text-ink-muted hover:text-ink"
                      >
                        {showRawReviews ? "실제 리뷰 원문 접기 ▲" : "실제 리뷰 원문 보기 ▼"}
                      </button>
                      {showRawReviews && (
                        <ul className="mt-2 flex flex-col gap-2">
                          {reviewDetail.reviewSnippets.map((snippet, i) => (
                            <li
                              key={i}
                              className="border-l-2 border-border-subtle pl-2 text-xs text-ink-muted"
                            >
                              “{snippet}”
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
