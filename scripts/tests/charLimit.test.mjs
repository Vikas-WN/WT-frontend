import assert from "node:assert/strict";
import { test } from "node:test";

import { limitLevel, pasteWouldOverflow } from "../../src/utils/charLimit.ts";

test("the counter is calm, then warns at 90%, then flags the limit", () => {
  assert.equal(limitLevel(0, 500), "ok");
  assert.equal(limitLevel(449, 500), "ok");
  assert.equal(limitLevel(450, 500), "near");
  assert.equal(limitLevel(499, 500), "near");
  assert.equal(limitLevel(500, 500), "limit");
});

test("a paste that would be cut is detected, counting what the paste replaces", () => {
  assert.equal(pasteWouldOverflow("a".repeat(480), 0, "b".repeat(30), 500), true);
  assert.equal(pasteWouldOverflow("a".repeat(480), 20, "b".repeat(30), 500), false); // 20 selected characters make room
  assert.equal(pasteWouldOverflow("", 0, "x".repeat(500), 500), false);
  assert.equal(pasteWouldOverflow("", 0, "x".repeat(501), 500), true);
});
