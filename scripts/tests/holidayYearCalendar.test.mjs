import assert from "node:assert/strict";
import { test } from "node:test";

import { buildYearCalendar } from "../../src/utils/holidayYearCalendar.ts";

// A tiny reader for "dd-Mon-yyyy", like the real sheet's dates.
const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const parse = (v) => {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(v.trim());
  return m ? new Date(Number(m[3]), MON[m[2]], Number(m[1])) : null;
};
const row = (date, holiday, optional = "") => ({ date, day: "", holiday, optional });

test("every month is whole Monday-first weeks; 2026 starts on a Thursday", () => {
  const { months } = buildYearCalendar([], 2026, parse);
  assert.equal(months.length, 12);
  assert.equal(months.every((m) => m.cells.length % 7 === 0), true);
  assert.deepEqual(months[0].cells.slice(0, 4), [null, null, null, 1]); // 1 Jan 2026 is a Thursday
  assert.equal(months[1].cells.filter(Boolean).length, 28);
});

test("holidays land in their month, in date order, with the weekday worked out from the date", () => {
  const cal = buildYearCalendar([row("02-Oct-2026", "Gandhi Jayanti"), row("20-Oct-2026", "Dussehra"), row("15-Aug-2026", "Independence Day")], 2026, parse);
  assert.deepEqual(cal.months[9].holidays.map((h) => h.name), ["Gandhi Jayanti", "Dussehra"]);
  assert.equal(cal.months[9].holidays[0].weekday, "Fri");
  assert.equal(cal.months[7].holidays[0].weekend, true); // 15 Aug 2026 is a Saturday
  assert.equal(cal.mandatory, 3);
});

test("optional holidays are counted apart and keep their note", () => {
  const cal = buildYearCalendar([row("26-Jun-2026", "Muharram", "Optional with Ramadan"), row("04-Mar-2026", "Holi")], 2026, parse);
  assert.equal(cal.optional, 1);
  assert.equal(cal.mandatory, 1);
  assert.equal(cal.months[5].holidays[0].note, "Optional with Ramadan");
});

test("rows with an unreadable date, or from another year, are reported and left off", () => {
  const cal = buildYearCalendar([row("soon", "Mystery"), row("01-Jan-2025", "Last year"), row("01-Jan-2026", "New Year")], 2026, parse);
  assert.equal(cal.unreadable, 2);
  assert.equal(cal.mandatory, 1);
});
