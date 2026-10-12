import { test } from "node:test";
import assert from "node:assert/strict";
import { tripPeriod } from "./format.ts";

test("여행 기간은 시작~끝 짧은 날짜", () => {
  assert.equal(tripPeriod("2026-10-05", "2026-10-07"), "10/5~10/7");
});

test("날짜를 안 정한 여행은 오류 없이 –", () => {
  assert.equal(tripPeriod(null, null), "–");
  assert.equal(tripPeriod("2026-10-05", null), "10/5~–");
});
