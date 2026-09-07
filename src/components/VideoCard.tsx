import Link from "next/link";
import type { VideoSummary } from "@/lib/videoGroups";

const PLATFORM_LABEL: Record<VideoSummary["sourcePlatform"], string> = {
  INSTAGRAM: "인스타그램",
  YOUTUBE: "유튜브",
};

const STATUS_LABEL: Record<VideoSummary["status"], string> = {
  PENDING: "대기중",
  PROCESSING: "처리중",
  DONE: "완료",
  FAILED: "실패",
};

export function VideoCard({ video }: { video: VideoSummary }) {
  const isDone = video.status === "DONE";
  const title = video.title ?? (isDone ? "제목 없음" : "제목 가져오는 중...");

  return (
    <li>
      <Link
        href={`/places/${encodeURIComponent(video.sourceUrl)}`}
        className="block rounded-xl border border-border-subtle p-4 transition-colors hover:border-accent"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate font-medium text-ink">{title}</p>
          {!isDone && (
            <span className="shrink-0 text-xs text-ink-muted">
              {STATUS_LABEL[video.status]}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>{PLATFORM_LABEL[video.sourcePlatform]}</span>
            {isDone && <span>· 장소 {video.placeCount}곳</span>}
          </div>
          <time dateTime={video.createdAt} className="font-mono text-xs text-ink-muted">
            {new Date(video.createdAt).toISOString().slice(0, 10)}
          </time>
        </div>
      </Link>
    </li>
  );
}
