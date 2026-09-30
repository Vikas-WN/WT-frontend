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
  const local = { kpi: { 1: 3 }, values: {}, kpiComments: {}, valueComments: {}, comments: "" };
  const out = mergeRemoteDraft(local, remote({ "1": 4, "2": 5 }, { "7": 3 }, "Agreed offline", 2), none);
  assert.deepEqual(out, { kpi: { 1: 4, 2: 5 }, values: { 7: 3 }, kpiComments: {}, valueComments: {}, comments: "Agreed offline" });
});

test("a field I am changing right now is not overwritten by the poll", () => {
  const local = { kpi: { 1: 5 }, values: {}, kpiComments: {}, valueComments: {}, comments: "my typing" };
  const dirty = new Set(["k:1", "comments"]);
  const out = mergeRemoteDraft(local, remote({ "1": 2, "2": 4 }, {}, "their comment", 3), dirty);
  assert.equal(out.kpi[1], 5, "my unsaved rating wins");
  assert.equal(out.kpi[2], 4, "but their other rating still arrives");
  assert.equal(out.comments, "my typing");
});

test("a missing remote rating never erases a local one; ratings cannot be un-set", () => {
  const local = { kpi: { 1: 3, 2: 4 }, values: { 7: 2 }, kpiComments: {}, valueComments: {}, comments: "" };
  assert.deepEqual(mergeRemoteDraft(local, remote({}), none).kpi, { 1: 3, 2: 4 });
  assert.deepEqual(mergeRemoteDraft(local, remote({}), none).values, { 7: 2 });
});

test("no remote draft yet leaves local untouched; an unversioned draft does not blank my comments", () => {
  const local = { kpi: { 1: 3 }, values: {}, kpiComments: {}, valueComments: {}, comments: "note" };
  assert.equal(mergeRemoteDraft(local, null, none), local);
  assert.equal(mergeRemoteDraft(local, remote({}, {}, "", 0), none).comments, "note");
});

test("the patch carries only what changed, so co-managers' other ratings are not sent", () => {
  const fields = { kpi: { 1: 4, 2: 5, 3: 2 }, values: { 7: 3 }, kpiComments: { 2: "why" }, valueComments: {}, comments: "c" };
  const patch = buildPatch(fields, new Set(["k:2", "v:7"]));
  assert.deepEqual(patch, { kpi_ratings: [{ kpi_id: 2, rating: 5 }], value_ratings: [{ value_id: 7, rating: 3, comment: "" }], kpi_comments: [], value_comments: [] });
  assert.equal(isEmptyPatch(patch), false);
  assert.equal(isEmptyPatch(buildPatch(fields, none)), true);
  assert.equal(buildPatch(fields, new Set(["comments"])).comments, "c");
});

test("a rating changed again while a save was in flight stays dirty; settled ones clear", () => {
  const sent = { kpi: { 1: 4, 2: 5 }, values: {}, kpiComments: {}, valueComments: {}, comments: "a" };
  const current = { kpi: { 1: 4, 2: 1 }, values: {}, kpiComments: {}, valueComments: {}, comments: "a" }; // #2 changed mid-flight
  const still = settleDirty(new Set(["k:1", "k:2", "comments"]), sent, current);
  assert.deepEqual([...still], ["k:2"]);
});

test("three managers editing different ratings converge on the same draft", () => {
  // Server state after everyone's saves; each client merges it into what they have.
  const server = remote({ "1": 4, "2": 5, "3": 2 }, { "7": 3 }, "Final: offline", 5);
  const ravi = { kpi: { 1: 4 }, values: {}, kpiComments: {}, valueComments: {}, comments: "" };
  const bina = { kpi: { 2: 5 }, values: { 7: 3 }, kpiComments: {}, valueComments: {}, comments: "" };
  const chetan = { kpi: { 3: 2 }, values: {}, kpiComments: {}, valueComments: {}, comments: "Final: offline" };
  const expected = fieldsFromDraft(server);
  for (const c of [ravi, bina, chetan]) assert.deepEqual(mergeRemoteDraft(c, server, none), expected);
});

test("snapshot is independent of later edits", () => {
  const live = { kpi: { 1: 1 }, values: {}, kpiComments: {}, valueComments: {}, comments: "x" };
  const snap = snapshotFields(live);
  live.kpi[1] = 5;
  assert.equal(snap.kpi[1], 1);
});

test("a comment typed before its rating is kept and sent; the rating need not exist yet", () => {
  const fields = { kpi: {}, values: {}, kpiComments: { 1: "Strong PRs" }, valueComments: { 7: "Owned it" }, comments: "" };
  const patch = buildPatch(fields, new Set(["kc:1", "vc:7"]));
  assert.deepEqual(patch.kpi_comments, [{ id: 1, comment: "Strong PRs" }]);
  assert.deepEqual(patch.value_comments, [{ id: 7, comment: "Owned it" }]);
  assert.deepEqual(patch.kpi_ratings, []);
  assert.equal(isEmptyPatch(patch), false);
});

test("another manager's reasons arrive, but the one I am typing is not overwritten", () => {
  const local = { kpi: {}, values: {}, kpiComments: { 1: "mine, half typed" }, valueComments: {}, comments: "" };
  const remote = { kpi_ratings: {}, value_ratings: {}, kpi_comments: { "1": "theirs", "2": "also theirs" }, value_comments: { "7": "v" }, comments: "", version: 2 };
  const out = mergeRemoteDraft(local, remote, new Set(["kc:1"]));
  assert.equal(out.kpiComments[1], "mine, half typed");
  assert.equal(out.kpiComments[2], "also theirs");
  assert.equal(out.valueComments[7], "v");
});

test("a comment edited again while a save was in flight stays dirty", () => {
  const sent = { kpi: {}, values: {}, kpiComments: { 1: "abc" }, valueComments: {}, comments: "" };
  const current = { kpi: {}, values: {}, kpiComments: { 1: "abcdef" }, valueComments: {}, comments: "" };
  assert.deepEqual([...settleDirty(new Set(["kc:1"]), sent, current)], ["kc:1"]);
  assert.deepEqual([...settleDirty(new Set(["kc:1"]), sent, sent)], []);
});

test("an old draft with no comment fields still loads", () => {
  const f = fieldsFromDraft({ kpi_ratings: { "1": 4 }, value_ratings: {}, comments: "c", version: 1 });
  assert.deepEqual(f.kpiComments, {});
  assert.deepEqual(f.valueComments, {});
});
