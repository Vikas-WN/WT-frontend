// Run: pnpm test:unit   (node --experimental-strip-types --test scripts/tests/*.test.mjs)
// Pure merge logic behind the shared manager-review draft.
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPatch, fieldsFromDraft, isEmptyPatch, mergeRemoteDraft, settleDirty, snapshotFields,
} from "../../src/utils/managerReviewDraft.ts";

const remote = (kpi, values = {}, comments = "", version = 1) =>
  ({ kpi_ratings: kpi, value_ratings: values, comments, version });
const none = new Set();

test("another manager's ratings appear for fields I have not touched", () => {
  const local = { kpi: { 1: 3 }, values: {}, comments: "" };
  const out = mergeRemoteDraft(local, remote({ "1": 4, "2": 5 }, { "7": 3 }, "Agreed offline", 2), none);
  assert.deepEqual(out, { kpi: { 1: 4, 2: 5 }, values: { 7: 3 }, comments: "Agreed offline" });
});

test("a field I am changing right now is not overwritten by the poll", () => {
  const local = { kpi: { 1: 5 }, values: {}, comments: "my typing" };
  const dirty = new Set(["k:1", "comments"]);
  const out = mergeRemoteDraft(local, remote({ "1": 2, "2": 4 }, {}, "their comment", 3), dirty);
  assert.equal(out.kpi[1], 5, "my unsaved rating wins");
  assert.equal(out.kpi[2], 4, "but their other rating still arrives");
  assert.equal(out.comments, "my typing");
});

test("a missing remote rating never erases a local one; ratings cannot be un-set", () => {
  const local = { kpi: { 1: 3, 2: 4 }, values: { 7: 2 }, comments: "" };
  assert.deepEqual(mergeRemoteDraft(local, remote({}), none).kpi, { 1: 3, 2: 4 });
  assert.deepEqual(mergeRemoteDraft(local, remote({}), none).values, { 7: 2 });
});

test("no remote draft yet leaves local untouched; an unversioned draft does not blank my comments", () => {
  const local = { kpi: { 1: 3 }, values: {}, comments: "note" };
  assert.equal(mergeRemoteDraft(local, null, none), local);
  assert.equal(mergeRemoteDraft(local, remote({}, {}, "", 0), none).comments, "note");
});

test("the patch carries only what changed, so co-managers' other ratings are not sent", () => {
  const fields = { kpi: { 1: 4, 2: 5, 3: 2 }, values: { 7: 3 }, comments: "c" };
  const patch = buildPatch(fields, new Set(["k:2", "v:7"]));
  assert.deepEqual(patch, { kpi_ratings: [{ kpi_id: 2, rating: 5 }], value_ratings: [{ value_id: 7, rating: 3, comment: "" }] });
  assert.equal(isEmptyPatch(patch), false);
  assert.equal(isEmptyPatch(buildPatch(fields, none)), true);
  assert.equal(buildPatch(fields, new Set(["comments"])).comments, "c");
});

test("a rating changed again while a save was in flight stays dirty; settled ones clear", () => {
  const sent = { kpi: { 1: 4, 2: 5 }, values: {}, comments: "a" };
  const current = { kpi: { 1: 4, 2: 1 }, values: {}, comments: "a" }; // #2 changed mid-flight
  const still = settleDirty(new Set(["k:1", "k:2", "comments"]), sent, current);
  assert.deepEqual([...still], ["k:2"]);
});

test("three managers editing different ratings converge on the same draft", () => {
  // Server state after everyone's saves; each client merges it into what they have.
  const server = remote({ "1": 4, "2": 5, "3": 2 }, { "7": 3 }, "Final: offline", 5);
  const ravi = { kpi: { 1: 4 }, values: {}, comments: "" };
  const bina = { kpi: { 2: 5 }, values: { 7: 3 }, comments: "" };
  const chetan = { kpi: { 3: 2 }, values: {}, comments: "Final: offline" };
  const expected = fieldsFromDraft(server);
  for (const c of [ravi, bina, chetan]) assert.deepEqual(mergeRemoteDraft(c, server, none), expected);
});

test("snapshot is independent of later edits", () => {
  const live = { kpi: { 1: 1 }, values: {}, comments: "x" };
  const snap = snapshotFields(live);
  live.kpi[1] = 5;
  assert.equal(snap.kpi[1], 1);
});
