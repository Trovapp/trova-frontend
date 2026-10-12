import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCountdown, secondsLeft, tripPeriod } from "./format.ts";

test("여행 기간은 시작~끝 짧은 날짜", () => {
  assert.equal(tripPeriod("2026-10-05", "2026-10-07"), "10/5~10/7");
});

test("날짜를 안 정한 여행은 오류 없이 –", () => {
  assert.equal(tripPeriod(null, null), "–");
  assert.equal(tripPeriod("2026-10-05", null), "10/5~–");
});

test("남은 시간은 마감까지 올림한 초, 지나면 0", () => {
  assert.equal(secondsLeft(10_000, 0), 10);
  assert.equal(secondsLeft(10_000, 9_001), 1);
  assert.equal(secondsLeft(10_000, 10_000), 0);
  assert.equal(secondsLeft(10_000, 12_000), 0);
});

test("카운트다운은 분:초 두 자리", () => {
  assert.equal(formatCountdown(300), "5:00");
  assert.equal(formatCountdown(65), "1:05");
  assert.equal(formatCountdown(0), "0:00");
});
