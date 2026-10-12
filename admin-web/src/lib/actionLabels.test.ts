import { test } from "node:test";
import assert from "node:assert/strict";
import { actionLabel } from "./actionLabels.ts";

test("알려진 조치는 한글 이름", () => {
  assert.equal(actionLabel("SUSPEND_USER"), "정지");
  assert.equal(actionLabel("ADMIN_WEB_LOGIN_DENIED"), "로그인 거부");
});

test("모르는 조치는 원문 그대로", () => {
  assert.equal(actionLabel("SOMETHING_NEW"), "SOMETHING_NEW");
});
