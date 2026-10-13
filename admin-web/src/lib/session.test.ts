// node --test로 돈다(Node 23.6+ 타입 제거 실행). Next 빌드·타입 검사에서는 tsconfig로 뺀다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStoredToken, storedTokenState } from "./session.ts";

const NOW = 1_000_000;

test("만료 시각이 지나지 않은 토큰은 돌려준다", () => {
  assert.equal(parseStoredToken(JSON.stringify({ token: "abc", expiresAt: NOW + 1 }), NOW)?.token, "abc");
});

test("만료 시각이 지났거나 같으면 버린다", () => {
  assert.equal(parseStoredToken(JSON.stringify({ token: "abc", expiresAt: NOW }), NOW), null);
  assert.equal(parseStoredToken(JSON.stringify({ token: "abc", expiresAt: NOW - 1 }), NOW), null);
});

test("만료 시각이 없거나 숫자가 아니면 버린다(만료되지 않은 것으로 보면 안 된다)", () => {
  assert.equal(parseStoredToken(JSON.stringify({ token: "abc" }), NOW), null);
  assert.equal(parseStoredToken(JSON.stringify({ token: "abc", expiresAt: "9999999999999" }), NOW), null);
});

test("깨진 값·토큰 없음·빈 값은 버린다", () => {
  assert.equal(parseStoredToken("{not json", NOW), null);
  assert.equal(parseStoredToken(JSON.stringify({ token: "", expiresAt: NOW + 1 }), NOW), null);
  assert.equal(parseStoredToken(null, NOW), null);
});

test("저장된 토큰 상태: 없음·만료·유효를 나눈다(만료면 로그인 화면에 만료 안내)", () => {
  assert.equal(storedTokenState(null, NOW), "none");
  assert.equal(storedTokenState(JSON.stringify({ token: "abc", expiresAt: NOW - 1 }), NOW), "expired");
  assert.equal(storedTokenState("{not json", NOW), "expired");
  assert.equal(storedTokenState(JSON.stringify({ token: "abc", expiresAt: NOW + 1 }), NOW), "valid");
});
