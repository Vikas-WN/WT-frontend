import assert from "node:assert/strict";
import { test } from "node:test";

import { collectPendingApprovals } from "../../src/utils/homePendingApprovals.ts";
import { formatShortRange } from "../../src/utils/shortDateRange.ts";

const parse = (v) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
};
const row = (over) => ({ user_request_id: "1", employee_name: "Amy", request_type: "leave", status: "PENDING", request_from_date: "12/10/2026", request_to_date: "13/10/2026", ...over });

test("keeps only pending requests, each once, earliest leave first", () => {
  const out = collectPendingApprovals(
    [[row({ user_request_id: "b", request_from_date: "20/10/2026", request_to_date: "20/10/2026" }), row({ user_request_id: "x", status: "APPROVED" })], [row({ user_request_id: "b" }), row({ user_request_id: "a" })]],
    parse
  );
  assert.deepEqual(out.map((i) => i.id), ["a", "b"]);
});

test("reads the requester and type under their different field names", () => {
  const [item] = collectPendingApprovals([[{ userRequestId: "9", employee_display: "Bob Rao", requestType: "wfh", status: "pending", requestFromDate: "01/11/2026", isHalfDay: true }]], parse);
  assert.equal(item.requester, "Bob Rao");
  assert.equal(item.type, "WFH");
  assert.equal(item.isHalfDay, true);
  assert.equal(item.to, "01/11/2026");
});

test("a row without an id is skipped rather than guessed at", () => {
  assert.equal(collectPendingApprovals([[row({ user_request_id: "" })]], parse).length, 0);
});

test("short date ranges read naturally", () => {
  const now = new Date(2026, 9, 8);
  assert.equal(formatShortRange(new Date(2026, 9, 10), new Date(2026, 9, 10), now), "10 Oct");
  assert.equal(formatShortRange(new Date(2026, 9, 10), new Date(2026, 9, 11), now), "10 – 11 Oct");
  assert.equal(formatShortRange(new Date(2026, 9, 30), new Date(2026, 10, 2), now), "30 Oct – 2 Nov");
  assert.equal(formatShortRange(new Date(2027, 0, 4), new Date(2027, 0, 4), now), "4 Jan 2027");
});
