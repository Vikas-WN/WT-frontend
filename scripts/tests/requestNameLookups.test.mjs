import assert from "node:assert/strict";
import { test } from "node:test";

import { emailsNeedingNameLookup, mapWithConcurrency } from "../../src/utils/requestNameLookups.ts";

test("rows that already carry the employee's name need no lookup", () => {
  const rows = [
    { emp_email: "a@webknot.in", employee_name: "Asha" },
    { emp_email: "A@webknot.in", employee_name: "" }, // same person, name on another row
    { emp_email: "b@webknot.in", employeeName: "Bala" },
  ];
  assert.deepEqual(emailsNeedingNameLookup(rows, {}), []);
});

test("only people with no name anywhere and not already known are looked up, once each", () => {
  const rows = [
    { emp_email: "c@webknot.in" },
    { emp_email: "c@webknot.in" },
    { email: "d@webknot.in" },
    { emp_email: "e@webknot.in" },
    { emp_email: "" },
  ];
  assert.deepEqual(emailsNeedingNameLookup(rows, { "e@webknot.in": "Esha" }).sort(), ["c@webknot.in", "d@webknot.in"]);
});

test("mapWithConcurrency never runs more than the limit at once and keeps order", async () => {
  let inFlight = 0;
  let peak = 0;
  const out = await mapWithConcurrency([5, 1, 4, 2, 3, 6, 7], 3, async (n) => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, n));
    inFlight -= 1;
    return n * 10;
  });
  assert.deepEqual(out, [50, 10, 40, 20, 30, 60, 70]);
  assert.equal(peak, 3);
  assert.deepEqual(await mapWithConcurrency([], 3, async () => 1), []);
});
