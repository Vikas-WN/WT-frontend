import assert from "node:assert/strict";
import { test } from "node:test";

import { isMilestoneYear, milestoneBursts, milestoneTitle } from "../../src/utils/milestones.ts";

test("the big years are milestones, the in-between ones are not", () => {
  for (const y of [1, 2, 3, 5, 10, 15, 20, 25]) assert.equal(isMilestoneYear(y), true, String(y));
  for (const y of [0, 4, 6, 8, 9, 11, 13]) assert.equal(isMilestoneYear(y), false, String(y));
});

test("titles read naturally", () => {
  assert.equal(milestoneTitle(1), "One year at Webknot");
  assert.equal(milestoneTitle(5), "Five years at Webknot");
  assert.equal(milestoneTitle(10), "A whole decade at Webknot");
});

test("a bigger milestone means a bigger party", () => {
  assert.ok(milestoneBursts(1) < milestoneBursts(5));
  assert.ok(milestoneBursts(5) < milestoneBursts(10));
  assert.ok(milestoneBursts(10) < milestoneBursts(20));
});
