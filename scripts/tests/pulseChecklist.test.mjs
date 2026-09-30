// Run: pnpm test:unit   (node --experimental-strip-types --test scripts/tests/*.test.mjs)
// The "what have I missed?" checklist behind the Pulse forms and their Submit buttons.
import test from "node:test";
import assert from "node:assert/strict";
import { buildChecklist, summarizeChecklist, summarizeGroup } from "../../src/utils/pulseChecklist.ts";

const kpis = [{ id: 1, name: "Code Quality" }, { id: 2, name: "Delivery" }];
const values = [{ id: 7, name: "Ownership" }, { id: 8, name: "Curiosity" }];
const base = { kpis, values, kpiRatings: {}, kpiComments: {}, valueRatings: {}, valueComments: {} };
const group = (groups, key) => groups.find((g) => g.key === key);
const missing = (g) => Object.fromEntries(g.items.map((i) => [i.label, i.missing]));

test("an empty form has every item outstanding, each saying what it needs", () => {
  const groups = buildChecklist(base);
  assert.deepEqual(missing(group(groups, "kpis")), { "Code Quality": "rating and comment", Delivery: "rating and comment" });
  assert.equal(summarizeChecklist(groups).complete, false);
  assert.equal(summarizeChecklist(groups).remaining, 4);
});

test("an item needs BOTH a rating and a comment; the message says which half is missing", () => {
  const groups = buildChecklist({ ...base, kpiRatings: { 1: 4, 2: 3 }, kpiComments: { 1: "Clean PRs" } });
  assert.deepEqual(missing(group(groups, "kpis")), { "Code Quality": "", Delivery: "comment" });
  const commentOnly = buildChecklist({ ...base, kpiComments: { 1: "thoughts" } });
  assert.equal(missing(group(commentOnly, "kpis"))["Code Quality"], "rating");
});

test("a comment of only spaces, and a rating of 0 (not chosen yet), both count as missing", () => {
  const groups = buildChecklist({ ...base, kpiRatings: { 1: 0, 2: 5 }, kpiComments: { 1: "x", 2: "   " } });
  assert.deepEqual(missing(group(groups, "kpis")), { "Code Quality": "rating", Delivery: "comment" });
});

test("a fully explained form is complete", () => {
  const groups = buildChecklist({
    ...base,
    kpiRatings: { 1: 4, 2: 5 }, kpiComments: { 1: "a", 2: "b" },
    valueRatings: { 7: 3, 8: 4 }, valueComments: { 7: "c", 8: "d" },
    projects: { required: true, selected: 2, max: 3 }, selfReviewWritten: true, reviewer: { required: false, chosen: false },
  });
  assert.deepEqual(summarizeChecklist(groups), { done: 6, total: 6, remaining: 0, complete: true });
});

test("projects: at least one and no more than the cap; skipped when the employee has none", () => {
  const over = buildChecklist({ ...base, kpis: [], values: [], projects: { required: true, selected: 4, max: 3 } });
  assert.equal(group(over, "projects").items[0].missing, "pick no more than 3");
  const none = buildChecklist({ ...base, kpis: [], values: [], projects: { required: true, selected: 0, max: 3 } });
  assert.equal(group(none, "projects").items[0].missing, "pick at least one");
  const bench = buildChecklist({ ...base, kpis: [], values: [], projects: { required: false, selected: 0, max: 3 } });
  assert.equal(group(bench, "projects"), undefined);
});

test("the reviewer item only exists for roles that must choose one", () => {
  const needed = buildChecklist({ ...base, kpis: [], values: [], reviewer: { required: true, chosen: false } });
  assert.equal(group(needed, "reviewer").items[0].done, false);
  const chosen = buildChecklist({ ...base, kpis: [], values: [], reviewer: { required: true, chosen: true } });
  assert.equal(group(chosen, "reviewer").items[0].done, true);
  assert.equal(group(buildChecklist({ ...base, kpis: [], values: [] }), "reviewer"), undefined);
});

test("groups carry the wizard step they are filled in on, so a gap can link to it", () => {
  const groups = buildChecklist({ ...base, selfReviewWritten: false }, { kpis: 1, values: 2, selfReview: 4 });
  assert.deepEqual([group(groups, "kpis").step, group(groups, "values").step, group(groups, "self-review").step], [1, 2, 4]);
});

test("a manager's checklist is just the items to rate and explain, in the order given", () => {
  const groups = buildChecklist({ ...base, values: [{ id: 7, name: "Ownership" }] });
  assert.deepEqual(groups.map((g) => g.key), ["kpis", "values"]);
  assert.deepEqual(summarizeGroup(group(groups, "kpis")), { done: 0, total: 2 });
});
