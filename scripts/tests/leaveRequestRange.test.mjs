import assert from "node:assert/strict";
import test from "node:test";

import { lastMonthToThisMonthRange } from "../../src/utils/leaveRequestRange.ts";

test("mid-month: first of last month to last of this month", () => {
  assert.deepEqual(lastMonthToThisMonthRange(new Date(2026, 9, 16)), { from: "01/09/2026", to: "31/10/2026" });
});

test("January reaches back into December of the previous year", () => {
  assert.deepEqual(lastMonthToThisMonthRange(new Date(2026, 0, 5)), { from: "01/12/2025", to: "31/01/2026" });
});

test("February in a leap year ends on the 29th", () => {
  assert.deepEqual(lastMonthToThisMonthRange(new Date(2028, 1, 10)), { from: "01/01/2028", to: "29/02/2028" });
});
