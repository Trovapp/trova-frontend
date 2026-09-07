import type { SavedPlace } from "@/lib/types";
import { groupBySourceUrl } from "@/lib/itinerary";

export type VideoSummary = {
  sourceUrl: string;
  title: string | null;
  sourcePlatform: SavedPlace["sourcePlatform"];
  createdAt: string;
  status: SavedPlace["status"];
  placeCount: number;
};

export function buildVideoSummaries(places: SavedPlace[]): VideoSummary[] {
  const summaries = Array.from(groupBySourceUrl(places).entries()).map(
    ([sourceUrl, group]): VideoSummary => {
      const latest = group.reduce((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? a : b
      );
      const unfinished = group.find((place) => place.status !== "DONE");

      return {
        sourceUrl,
        title: group.find((place) => place.title)?.title ?? null,
        sourcePlatform: latest.sourcePlatform,
        createdAt: latest.createdAt,
        status: unfinished?.status ?? "DONE",
        placeCount: group.filter((place) => place.status === "DONE").length,
      };
    }
  );

  return summaries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
