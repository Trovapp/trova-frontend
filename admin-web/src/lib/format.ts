/** "2026-10-05" → "10/5" */
export function shortDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
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
