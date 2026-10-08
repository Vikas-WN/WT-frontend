import assert from "node:assert/strict";
import { test } from "node:test";

import { selectOpenLeaveRequests } from "../../src/utils/homeLeaveRequests.ts";

const parseDate = (v) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
};
const rules = {
  types: ["LEAVE", "OPTIONAL", "OPTIONAL_LEAVE", "COMP_OFF"],
  openStatuses: ["PENDING", "SUBMITTED", "APPROVED"],
  statusOf: (row) => String(row.final ?? row.status).toUpperCase(),
  parseDate,
};
const today = new Date(2026, 9, 8); // 8 Oct 2026
const row = (over) => ({ request_type: "LEAVE", status: "APPROVED", request_from_date: "10/10/2026", request_to_date: "10/10/2026", ...over });

test("keeps pending and upcoming approved leave, soonest first", () => {
  const out = selectOpenLeaveRequests(
    [row({ user_request_id: "b", request_from_date: "20/10/2026", request_to_date: "21/10/2026" }), row({ user_request_id: "a", status: "PENDING" })],
    today,
    rules
  );
  assert.deepEqual(out.map((i) => i.id), ["a", "b"]);
});

test("drops past, rejected, cancelled and non-leave requests", () => {
  const out = selectOpenLeaveRequests(
    [
      row({ request_from_date: "01/10/2026", request_to_date: "02/10/2026" }),
      row({ status: "REJECTED" }),
      row({ status: "CANCELLED" }),
      row({ request_type: "WFH" }),
    ],
    today,
    rules
  );
  assert.equal(out.length, 0);
});

test("a leave that started before today but runs through it is still shown", () => {
  const out = selectOpenLeaveRequests([row({ request_from_date: "07/10/2026", request_to_date: "09/10/2026" })], today, rules);
  assert.equal(out.length, 1);
});

test("understands camelCase fields and half days", () => {
  const out = selectOpenLeaveRequests(
    [{ requestType: "leave", status: "PENDING", requestFromDate: "12/10/2026", isHalfDay: true }],
    today,
    rules
  );
  assert.equal(out[0].isHalfDay, true);
  assert.equal(out[0].to, "12/10/2026");
});
