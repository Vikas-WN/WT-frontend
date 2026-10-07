import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeHolidayCalendarRows, normalizeHolidayCalendarSheets } from "../../src/utils/holidayCalendarTable.ts";

const columns = ["Date", "Day", "Holiday", "Optional"];
const sheet = (rows) => ({ columns, rows: rows.map(([date, day, holiday, optional = ""]) => ({ Date: date, Day: day, Holiday: holiday, Optional: optional })) });

test("a flagged optional row stays optional and the rest are mandatory", () => {
  const rows = normalizeHolidayCalendarRows(sheet([["01-Jan-2026", "Thursday", "New Year"], ["19-Mar-2026", "Thursday", "Ugadi", "Optional"]]));
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.holiday === "Ugadi").optional, "Optional");
  assert.equal(rows.find((r) => r.holiday === "New Year").optional, "");
});

test("optional holidays listed in their own block after a blank line and a heading are kept, and marked optional", () => {
  const rows = normalizeHolidayCalendarRows(
    sheet([
      ["01-Jan-2026", "Thursday", "New Year"],
      ["26-Jan-2026", "Monday", "Republic Day"],
      ["", "", ""],
      ["", "", "Optional Holidays"],
      ["19-Mar-2026", "Thursday", "Ugadi"],
      ["20-Mar-2026", "Friday", "Ramadan"],
    ])
  );
  assert.deepEqual(rows.map((r) => [r.holiday, r.optional]), [["New Year", ""], ["Republic Day", ""], ["Ugadi", "Optional"], ["Ramadan", "Optional"]]);
});

test("a heading with no blank line before it works too, and a mandatory heading switches back", () => {
  const rows = normalizeHolidayCalendarRows(
    sheet([["01-Jan-2026", "Thursday", "New Year"], ["", "", "Optional holidays (choose any 2)"], ["19-Mar-2026", "Thursday", "Ugadi"], ["", "", "Mandatory holidays"], ["15-Aug-2026", "Saturday", "Independence Day"]])
  );
  assert.deepEqual(rows.map((r) => [r.holiday, r.optional]), [["New Year", ""], ["Ugadi", "Optional"], ["Independence Day", ""]]);
});

test("stale rows left after a blank gap (no optional heading) are still ignored", () => {
  const rows = normalizeHolidayCalendarRows(sheet([["01-Jan-2026", "Thursday", "New Year"], ["", "", ""], ["09-Nov-2025", "Sunday", "Old leftover"]]));
  assert.deepEqual(rows.map((r) => r.holiday), ["New Year"]);
});

test("a sheet called Optional Holidays makes all its rows optional", () => {
  const rows = normalizeHolidayCalendarSheets([
    { name: "Holidays 2026", parsed: sheet([["01-Jan-2026", "Thursday", "New Year"]]) },
    { name: "Optional Holidays", parsed: sheet([["19-Mar-2026", "Thursday", "Ugadi"], ["20-Mar-2026", "Friday", "Ramadan"]]) },
  ]);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.filter((r) => r.optional).map((r) => r.holiday), ["Ugadi", "Ramadan"]);
});
