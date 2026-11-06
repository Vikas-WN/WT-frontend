import assert from "node:assert/strict";
import { test } from "node:test";

import { leaveLabelsByDate } from "../../src/utils/timelog/leaveDays.ts";

const helpers = {
  statusOf: (row) => String(row.status ?? "").toUpperCase(),
  parseDate: (value) => (value ? new Date(`${value}T00:00:00`) : null),
  toKey: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
};

test("approved leave marks each weekday of the range, skipping the weekend", () => {
  const labels = leaveLabelsByDate(
    [{ request_type: "LEAVE", status: "APPROVED", request_from_date: "2026-11-05", request_to_date: "2026-11-10" }],
    helpers
  );
  assert.deepEqual(Object.keys(labels), ["2026-11-05", "2026-11-06", "2026-11-09", "2026-11-10"]);
  assert.equal(labels["2026-11-06"], "On leave");
});

test("a half day is labelled as such, and pending or rejected leave is ignored", () => {
  const labels = leaveLabelsByDate(
    [
      { request_type: "LEAVE", status: "APPROVED", is_half_day: true, request_from_date: "2026-11-12", request_to_date: "2026-11-12" },
      { request_type: "LEAVE", status: "PENDING", request_from_date: "2026-11-13", request_to_date: "2026-11-13" },
      { request_type: "WFH", status: "APPROVED", request_from_date: "2026-11-16", request_to_date: "2026-11-16" },
    ],
    helpers
  );
  assert.deepEqual(labels, { "2026-11-12": "Half-day leave" });
});

test("optional leave counts, and a full day wins over a half day on the same date", () => {
  const labels = leaveLabelsByDate(
    [
      { request_type: "LEAVE", status: "APPROVED", is_half_day: true, request_from_date: "2026-11-18", request_to_date: "2026-11-18" },
      { request_type: "OPTIONAL", status: "APPROVED", request_from_date: "2026-11-18", request_to_date: "2026-11-18" },
    ],
    helpers
  );
  assert.equal(labels["2026-11-18"], "On leave");
});
