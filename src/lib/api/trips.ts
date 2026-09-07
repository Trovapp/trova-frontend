const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type Trip = {
  id: number;
  title: string;
  startDate: string | null;
  endDate: string | null;
};

export type TripPlace = {
  id: number;
  placeName: string;
  region: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  address: string | null;
  visitOrder: number;
  source: "VIDEO" | "NORMAL";
  googlePlaceId: string | null;
  visitStartTime: string | null;
  visitEndTime: string | null;
  arrivalTransportMode: "WALK" | "TRANSIT" | "CAR" | null;
  memo: string | null;
};

export type TripDay = {
  id: number;
  day: number;
  date: string | null;
  places: TripPlace[];
};

export type TripDetail = Trip & { days: TripDay[] };

async function parseOrThrow<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${label} failed: ${res.status}`);
  }
  return res.json();
}

export async function confirmTrip(
  jobId: number,
  title: string,
  startDate: string | null
): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/api/places/videos/${jobId}/confirm-trip`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, startDate }),
  });
  return parseOrThrow(res, `POST /api/places/videos/${jobId}/confirm-trip`);
}

export async function createTrip(title: string, startDate: string, endDate: string): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/api/trips`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, startDate, endDate }),
  });
  return parseOrThrow(res, "POST /api/trips");
}

export async function listTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_BASE_URL}/api/trips`, { credentials: "include" });
  return parseOrThrow(res, "GET /api/trips");
}

export async function getTrip(id: number): Promise<TripDetail> {
  const res = await fetch(`${API_BASE_URL}/api/trips/${id}`, { credentials: "include" });
  return parseOrThrow(res, `GET /api/trips/${id}`);
}

export async function deleteTrip(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/trips/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE /api/trips/${id} failed: ${res.status}`);
}

export async function addTripPlace(tripId: number, day: number, googlePlaceId: string): Promise<TripPlace> {
  const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}/days/${day}/places`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ googlePlaceId }),
  });
  return parseOrThrow(res, `POST /api/trips/${tripId}/days/${day}/places`);
}

export async function removeTripPlace(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/trip-places/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`DELETE /api/trip-places/${id} failed: ${res.status}`);
}

export async function reorderTripPlace(id: number, direction: "UP" | "DOWN"): Promise<TripPlace> {
  const res = await fetch(`${API_BASE_URL}/api/trip-places/${id}/order`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction }),
  });
  return parseOrThrow(res, `PATCH /api/trip-places/${id}/order`);
}

export async function checkWeather(
  tripId: number,
  day: number
): Promise<{ notified: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}/days/${day}/weather-check`, {
    method: "POST",
    credentials: "include",
  });
  return parseOrThrow(res, `POST /api/trips/${tripId}/days/${day}/weather-check`);
}

export async function updateTripPlaceDetails(
  id: number,
  patch: {
    visitStartTime?: string;
    visitEndTime?: string;
    arrivalTransportMode?: "WALK" | "TRANSIT" | "CAR";
    memo?: string;
  }
): Promise<TripPlace> {
  const res = await fetch(`${API_BASE_URL}/api/trip-places/${id}/details`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseOrThrow(res, `PATCH /api/trip-places/${id}/details`);
}
