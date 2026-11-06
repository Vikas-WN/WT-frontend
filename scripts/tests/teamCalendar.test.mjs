import assert from "node:assert/strict";
import { test } from "node:test";

import { daysOfMonth, mandatoryHolidays, monthTotal, teamCalendarCell } from "../../src/utils/timelog/teamCalendar.ts";

const TODAY = "2026-11-20";
const holidays = mandatoryHolidays([
  { date: "2026-11-10", name: "Diwali", is_optional: false },
  { date: "2026-11-12", name: "Optional fest", is_optional: true },
]);
const cell = (day, extra = {}) => teamCalendarCell({ day, today: TODAY, absences: [], holidays, ...extra });

test("a month lists each of its days", () => {
  assert.equal(daysOfMonth(2026, 1).length, 28);
  assert.equal(daysOfMonth(2026, 10)[0], "2026-11-01");
});

test("weekends and mandatory holidays read as such; an optional holiday does not close the day", () => {
  assert.equal(cell("2026-11-07").kind, "weekend");
  assert.deepEqual(cell("2026-11-10"), { kind: "holiday", title: "Diwali" });
  assert.equal(cell("2026-11-12").kind, "missing");
});

test("approved leave shows as leave, a half day keeps the hours that were logged", () => {
  const absences = [
    { type: "LEAVE", from_date: "2026-11-03", to_date: "2026-11-04", is_half_day: false },
    { type: "LEAVE", from_date: "2026-11-05", to_date: "2026-11-05", is_half_day: true },
  ];
  assert.equal(cell("2026-11-03", { absences }).kind, "leave");
  assert.deepEqual(cell("2026-11-05", { absences, hours: 4 }), { kind: "half-leave", hours: 4 });
});

test("a holiday inside a leave range is not a leave day", () => {
  const absences = [{ type: "LEAVE", from_date: "2026-11-09", to_date: "2026-11-11", is_half_day: false, excluded_dates: ["2026-11-10"] }];
  assert.equal(cell("2026-11-09", { absences }).kind, "leave");
  assert.equal(cell("2026-11-10", { absences }).kind, "holiday");
});

test("hours win over a missing day; a working day with nothing logged is missing, or future", () => {
  assert.deepEqual(cell("2026-11-17", { hours: 8 }), { kind: "hours", hours: 8 });
  assert.equal(cell("2026-11-18").kind, "missing");
  assert.equal(cell("2026-11-24").kind, "future");
});

test("work from home is tagged on a logged day and shown alone otherwise", () => {
  const absences = [{ type: "WFH", from_date: "2026-11-17", to_date: "2026-11-18", is_half_day: false }];
  assert.deepEqual(cell("2026-11-17", { absences, hours: 8 }), { kind: "hours", hours: 8, tag: "WFH" });
  assert.equal(cell("2026-11-18", { absences }).kind, "wfh");
});

test("month total adds the days and ignores other months", () => {
  assert.equal(monthTotal({ "2026-11-03": 8, "2026-11-04": 7.5, "2026-12-01": 8 }, daysOfMonth(2026, 10)), 15.5);
  assert.equal(monthTotal(undefined, daysOfMonth(2026, 10)), 0);
});
