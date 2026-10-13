import { test } from "node:test";
import assert from "node:assert/strict";
import { canExecute, describeActionError } from "./actionError.ts";

test("403 REAUTH_REQUIRED는 다시 로그인 안내", () => {
  assert.equal(describeActionError(403, "REAUTH_REQUIRED").kind, "reauth");
});

test("409는 서버 문구로 미리보기 다시", () => {
  const v = describeActionError(409, "확인이 만료됐어요. 미리보기부터 다시 해 주세요.");
  assert.equal(v.kind, "retryPreview");
  assert.match(v.message, /만료/);
});

test("400은 확인 토큰이 이미 소모됐으므로 서버 문구로 미리보기 다시", () => {
  const v = describeActionError(400, "사유를 1~300자로 적어 주세요. 미리보기부터 다시 해 주세요.");
  assert.equal(v.kind, "retryPreview");
  assert.match(v.message, /1~300자/);
});

test("400에 서버 문구가 없으면 기본 안내", () => {
  const v = describeActionError(400, undefined);
  assert.equal(v.kind, "retryPreview");
  assert.equal(v.message, "입력을 확인하고 미리보기부터 다시 해 주세요.");
});

test("404와 429와 그 밖의 오류는 other", () => {
  assert.equal(describeActionError(404, undefined).kind, "other");
  assert.equal(describeActionError(429, undefined).kind, "other");
  assert.match(describeActionError(500, undefined).message, /500/);
});

test("사유가 비거나 300자를 넘으면 실행할 수 없다", () => {
  assert.equal(canExecute("  ", null, ""), false);
  assert.equal(canExecute("가".repeat(301), null, ""), false);
  assert.equal(canExecute("사용자 요청", null, ""), true);
});

test("확인 글자는 앞뒤 공백만 무시하고 같아야 한다", () => {
  assert.equal(canExecute("사유", "계정 삭제", " 계정 삭제 "), true);
  assert.equal(canExecute("사유", "계정 삭제", "계정삭제"), false);
});
