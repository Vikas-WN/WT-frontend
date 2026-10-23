import assert from "node:assert/strict";
import { test } from "node:test";

import { EMPTY_PEOPLE_ALLOCATION_FILTERS, buildPeopleAllocationRows, filterPeopleAllocations, sortByEndDate } from "../../src/utils/peopleAllocations.ts";

const projects = [
  { project_code: "P1", client_name: "Acme" },
  { project_code: "P2", client_name: "Globex" },
];
const allocations = [
  { id: 1, employee_name: "Asha", project_code: "P1", project_name: "Alpha", role: "Dev", allocated_percent: 100, allocation_type: "DEPLOYABLE", billing_status: "BILLED", start_date: "01/01/2026", end_date: "31/03/2026" },
  { id: 2, employee_name: "Bala", project_code: "P2", project_name: "Beta", role: "QA", allocated_percent: 50, allocation_type: "NONBILLABLE", billing_status: null, start_date: "01/02/2026", end_date: "—" },
  { id: 3, employee_name: "Chitra", project_code: "P1", project_name: "Alpha", role: "PM", allocated_percent: 50, allocation_type: "STAFFING", billing_status: "Talent Pool", start_date: "01/01/2026", end_date: "15/01/2026" },
];
const rows = buildPeopleAllocationRows(allocations, projects);
const f = (patch) => filterPeopleAllocations(rows, { ...EMPTY_PEOPLE_ALLOCATION_FILTERS, ...patch }).map((r) => r.employee_name);

test("the client comes from the project, and codes are normalised", () => {
  assert.equal(rows[0].client_name, "Acme");
  assert.equal(rows[2].billing_status, "TALENT_POOL");
  assert.equal(rows[1].end_date, "");
});

test("filters by type, project, client and status", () => {
  assert.deepEqual(f({ type: "STAFFING" }), ["Chitra"]);
  assert.deepEqual(f({ project: "P1" }), ["Asha", "Chitra"]);
  assert.deepEqual(f({ client: "Globex" }), ["Bala"]);
  assert.deepEqual(f({ status: "BILLED" }), ["Asha"]);
});

test("NB has no status and is found with the no-status filter", () => {
  assert.deepEqual(f({ status: "__NONE__" }), ["Bala"]);
});

test("the end-date range keeps allocations ending inside it and drops open-ended ones", () => {
  assert.deepEqual(f({ endFrom: "01/01/2026", endTo: "31/01/2026" }), ["Chitra"]);
  assert.deepEqual(f({ endFrom: "01/03/2026" }), ["Asha"]);
  assert.deepEqual(f({ endTo: "31/12/2026" }), ["Asha", "Chitra"]);
});

test("the list runs soonest end first, open-ended last", () => {
  assert.deepEqual(sortByEndDate(rows).map((r) => r.employee_name), ["Chitra", "Asha", "Bala"]);
});
