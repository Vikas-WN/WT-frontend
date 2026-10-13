import assert from "node:assert/strict";
import { test } from "node:test";

import { bandCounts, levelFor, mondayOf, percentLabel, shortDay, startOfViewWeek } from "../../src/utils/utilizationDisplay.ts";

const T = { over_above: 100, full_from: 80, partial_from: 40 };

test("bands follow the server's thresholds", () => {
  assert.equal(levelFor(null, T), "none");
  assert.equal(levelFor(100.1, T), "over");
  assert.equal(levelFor(100, T), "full");
  assert.equal(levelFor(80, T), "full");
  assert.equal(levelFor(79.9, T), "partial");
  assert.equal(levelFor(39.9, T), "bench");
});

test("weeks start on Monday", () => {
  assert.equal(shortDay(mondayOf(new Date(2026, 9, 15))), "12 Oct"); // a Thursday
  assert.equal(shortDay(mondayOf(new Date(2026, 9, 18))), "12 Oct"); // the Sunday belongs to the week before the next Monday
  assert.equal(shortDay(mondayOf(new Date(2026, 9, 12))), "12 Oct");
});

test("the view starts a couple of weeks back and can be moved by whole weeks", () => {
  const today = new Date(2026, 9, 15);
  assert.equal(shortDay(startOfViewWeek(today, 2)), "28 Sep");
  assert.equal(shortDay(startOfViewWeek(today, 2, 4)), "26 Oct"); // shifted four weeks later
  assert.equal(shortDay(startOfViewWeek(today, 2, -2)), "14 Sep");
});

test("labels and counts", () => {
  assert.equal(percentLabel(87.4), "87%");
  assert.equal(percentLabel(null), "—");
  assert.deepEqual(bandCounts([120, 100, 85, 50, 10, 0], T), { over: 1, full: 2, partial: 1, bench: 2 });
});
