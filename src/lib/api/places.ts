import type { SavedPlace } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const CATEGORY_LABEL: Record<string, string> = {
  restaurant: "맛집",
  cafe: "카페",
  attraction: "명소",
  lodging: "숙소",
  shopping: "쇼핑",
  other: "기타",
};

function toCategoryLabel(category: string | null): string {
  if (!category) return "";
  return CATEGORY_LABEL[category] ?? category;
}

type PlaceResponse = {
  id: number;
  jobId: number;
  placeName: string;
  region: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
  title: string | null;
  sourcePlatform: "INSTAGRAM" | "YOUTUBE";
  createdAt: string;
  dayNumber: number | null;
  orderInDay: number | null;
  phone: string | null;
  address: string | null;
  roadAddress: string | null;
  kakaoCategoryName: string | null;
  kakaoPlaceUrl: string | null;
};

export type PendingJobResponse = {
  jobId: number;
  sourceUrl: string;
  title: string | null;
  sourcePlatform: "INSTAGRAM" | "YOUTUBE";
  status: "PENDING" | "PROCESSING" | "FAILED";
  createdAt: string;
};

function fromPlaceResponse(place: PlaceResponse): SavedPlace {
  return {
    id: String(place.id),
    jobId: place.jobId,
    sourceUrl: place.sourceUrl,
    sourcePlatform: place.sourcePlatform,
    title: place.title,
    placeName: place.placeName,
    region: place.region ?? "",
    category: toCategoryLabel(place.category),
    latitude: place.latitude ?? 0,
    longitude: place.longitude ?? 0,
    status: "DONE",
    createdAt: place.createdAt,
    dayNumber: place.dayNumber,
    orderInDay: place.orderInDay,
    phone: place.phone,
    address: place.address,
    roadAddress: place.roadAddress,
    kakaoCategoryName: place.kakaoCategoryName,
    kakaoPlaceUrl: place.kakaoPlaceUrl,
  };
}

function fromPendingJobResponse(job: PendingJobResponse): SavedPlace {
  return {
    id: String(job.jobId),
    jobId: job.jobId,
    sourceUrl: job.sourceUrl,
    sourcePlatform: job.sourcePlatform,
    title: job.title,
    placeName: "",
    region: "",
    category: "",
    latitude: 0,
    longitude: 0,
    status: job.status,
    createdAt: job.createdAt,
    dayNumber: null,
    orderInDay: null,
    phone: null,
    address: null,
    roadAddress: null,
    kakaoCategoryName: null,
    kakaoPlaceUrl: null,
  };
}

export async function createShare(url: string): Promise<{ jobId: number }> {
  const res = await fetch(`${API_BASE_URL}/api/shares`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (res.status === 401) {
    throw new Error("로그인이 필요해요.");
  }
  if (res.status === 400) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "지원하지 않는 URL입니다.");
  }
  if (!res.ok) {
    throw new Error(`POST /api/shares failed: ${res.status}`);
  }
  return res.json();
}

export async function getPendingJobs(): Promise<PendingJobResponse[]> {
  const res = await fetch(`${API_BASE_URL}/api/places/pending`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`GET /api/places/pending failed: ${res.status}`);
  }
  return res.json();
}

export async function getPlaces(): Promise<SavedPlace[]> {
  const [placesRes, pending] = await Promise.all([
    fetch(`${API_BASE_URL}/api/places`, { credentials: "include" }),
    getPendingJobs(),
  ]);

  if (!placesRes.ok) {
    throw new Error(`GET /api/places failed: ${placesRes.status}`);
  }
  const places: PlaceResponse[] = await placesRes.json();

  // 이미 완료된 영상(DONE 장소가 있는 sourceUrl)의 job이 재처리(예: 일정 생성 트리거)로
  // 다시 PENDING/PROCESSING/FAILED에 나타나면, 완료된 장소 목록과 중복 표시되는 걸 막는다.
  const doneSourceUrls = new Set(places.map((place) => place.sourceUrl));
  const activePending = pending.filter((job) => !doneSourceUrls.has(job.sourceUrl));

  return [...activePending.map(fromPendingJobResponse), ...places.map(fromPlaceResponse)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getPlace(id: string): Promise<SavedPlace | undefined> {
  const res = await fetch(`${API_BASE_URL}/api/places/${id}`, {
    credentials: "include",
  });

  if (res.status === 404) {
    return undefined;
  }
  if (!res.ok) {
    throw new Error(`GET /api/places/${id} failed: ${res.status}`);
  }
  return fromPlaceResponse(await res.json());
}

export async function deletePlace(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/places/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`DELETE /api/places/${id} failed: ${res.status}`);
  }
}

export async function generateItinerary(jobId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/places/videos/${jobId}/itinerary`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`POST /api/places/videos/${jobId}/itinerary failed: ${res.status}`);
  }
}

export async function moveToDay(placeId: string, dayNumber: number): Promise<SavedPlace> {
  const res = await fetch(`${API_BASE_URL}/api/places/${placeId}/day`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dayNumber }),
  });

  if (!res.ok) {
    throw new Error(`PATCH /api/places/${placeId}/day failed: ${res.status}`);
  }
  return fromPlaceResponse(await res.json());
}

export async function reorderPlace(
  placeId: string,
  direction: "UP" | "DOWN"
): Promise<SavedPlace> {
  const res = await fetch(`${API_BASE_URL}/api/places/${placeId}/order`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction }),
  });

  if (!res.ok) {
    throw new Error(`PATCH /api/places/${placeId}/order failed: ${res.status}`);
  }
  return fromPlaceResponse(await res.json());
}

export async function optimizeRoute(jobId: number, day: number): Promise<SavedPlace[]> {
  const res = await fetch(`${API_BASE_URL}/api/places/videos/${jobId}/days/${day}/optimize-route`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`POST /api/places/videos/${jobId}/days/${day}/optimize-route failed: ${res.status}`);
  }
  const places: PlaceResponse[] = await res.json();
  return places.map(fromPlaceResponse);
}
