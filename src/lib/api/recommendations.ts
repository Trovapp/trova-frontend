const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type RecommendedPlace = {
  id: number;
  googlePlaceId: string;
  name: string;
  category: string | null;
  mood: string | null;
  space: string | null;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
};

export async function recommend(
  latitude: number,
  longitude: number,
  radiusMeters?: number
): Promise<RecommendedPlace[]> {
  const res = await fetch(`${API_BASE_URL}/api/recommendations`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude, longitude, radiusMeters }),
  });
  if (!res.ok) {
    throw new Error(`POST /api/recommendations failed: ${res.status}`);
  }
  return res.json();
}

export async function searchPlaces(query: string): Promise<RecommendedPlace[]> {
  const res = await fetch(`${API_BASE_URL}/api/places/search?query=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`GET /api/places/search failed: ${res.status}`);
  }
  return res.json();
}

export type PlaceDetail = Omit<RecommendedPlace, "mood" | "space"> & {
  highlights: string;
  pros: string[];
  cons: string[];
  hours: string | null;
  fee: string | null;
  tips: string[];
  checklist: string[];
  reviewSnippets: string[];
};

export async function getPlaceDetails(id: number): Promise<PlaceDetail> {
  const res = await fetch(`${API_BASE_URL}/api/places/${id}/details`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`GET /api/places/${id}/details failed: ${res.status}`);
  }
  return res.json();
}
