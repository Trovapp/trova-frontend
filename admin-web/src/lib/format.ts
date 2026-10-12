/** "2026-10-05" → "10/5" */
export function shortDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 여행 기간 "10/5~10/7" — 날짜를 아직 안 정한 여행(초안 승인 등)은 빈 쪽을 "–"로. */
export function tripPeriod(start: string | null, end: string | null): string {
  if (start == null && end == null) return "–";
  return `${start == null ? "–" : shortDate(start)}~${end == null ? "–" : shortDate(end)}`;
}

/** "2026-10-11T19:04:59.8" → "10/11 19:04" */
export function shortDateTime(value: string): string {
  const [date, time] = value.split("T");
  return `${shortDate(date)} ${time.slice(0, 5)}`;
}

export function formatNumber(value: number | null | undefined): string {
  return value == null ? "–" : value.toLocaleString("ko-KR");
}

export function formatSeconds(seconds: number | null): string {
  if (seconds == null) return "–";
  if (seconds < 60) return `${seconds}초`;
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}

/** 마감 시각(ms)까지 남은 초 — 올림해서 "0초 남음"은 정말 끝났을 때만. 지나면 0. */
export function secondsLeft(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

/** 300 → "5:00", 65 → "1:05" */
export function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
