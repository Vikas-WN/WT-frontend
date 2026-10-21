import assert from "node:assert/strict";
import test from "node:test";

import { daysUntil, holidayWhen } from "../../src/utils/holidayWhen.ts";

const today = new Date(2026, 9, 19, 14, 30); // Mon 19 Oct 2026, afternoon

test("tomorrow and today are named", () => {
  assert.equal(holidayWhen(new Date(2026, 9, 20), today), "Tomorrow · Tuesday");
  assert.equal(holidayWhen(new Date(2026, 9, 19), today), "Today · Monday");
});

test("further out it counts the days", () => {
  assert.equal(holidayWhen(new Date(2026, 10, 1), today), "Sunday · in 13 days");
  assert.equal(holidayWhen(new Date(2026, 10, 9), today), "Monday · in 21 days");
});

test("the time of day does not change the count", () => {
  assert.equal(daysUntil(new Date(2026, 9, 20, 0, 0), new Date(2026, 9, 19, 23, 59)), 1);
});
