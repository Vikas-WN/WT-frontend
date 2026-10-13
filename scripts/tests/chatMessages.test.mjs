import assert from "node:assert/strict";
import { test } from "node:test";

import { buildThreadRows, dayLabel, lastRealId, mergeMessages } from "../../src/utils/chatMessages.ts";

const LABELS = { today: "Today", yesterday: "Yesterday" };
const NOW = new Date(2026, 9, 13, 15, 0, 0);
const at = (d, h, m) => new Date(2026, 9, d, h, m).toISOString();
const msg = (id, sender, iso) => ({ id, sender_id: sender, created_at: iso });

test("day labels", () => {
  assert.equal(dayLabel(at(13, 9, 0), NOW, LABELS), "Today");
  assert.equal(dayLabel(at(12, 23, 0), NOW, LABELS), "Yesterday");
  assert.match(dayLabel(at(8, 9, 0), NOW, LABELS), /8/);
});

test("a day separator opens each day, and runs from one person are grouped", () => {
  const rows = buildThreadRows(
    [msg(1, 5, at(12, 10, 0)), msg(2, 5, at(12, 10, 2)), msg(3, 6, at(12, 10, 3)), msg(4, 6, at(13, 9, 0))],
    { now: NOW, firstUnreadId: null, groupWithinMs: 5 * 60_000, labels: LABELS }
  );
  assert.deepEqual(rows.map((r) => r.kind), ["day", "message", "message", "message", "day", "message"]);
  const starts = rows.filter((r) => r.kind === "message").map((r) => r.startsGroup);
  assert.deepEqual(starts, [true, false, true, true]);
});

test("a long pause breaks a run even for the same person", () => {
  const rows = buildThreadRows([msg(1, 5, at(13, 9, 0)), msg(2, 5, at(13, 9, 30))], { now: NOW, firstUnreadId: null, groupWithinMs: 5 * 60_000, labels: LABELS });
  assert.deepEqual(rows.filter((r) => r.kind === "message").map((r) => r.startsGroup), [true, true]);
});

test("the unread divider sits before the first unread message, once, and starts a new group", () => {
  const rows = buildThreadRows([msg(1, 5, at(13, 9, 0)), msg(2, 5, at(13, 9, 1)), msg(3, 5, at(13, 9, 2))], { now: NOW, firstUnreadId: 2, groupWithinMs: 5 * 60_000, labels: LABELS });
  assert.deepEqual(rows.map((r) => r.kind), ["day", "message", "unread", "message", "message"]);
  const second = rows.filter((r) => r.kind === "message")[1];
  assert.equal(second.startsGroup, true);
});

test("merging keeps one copy per id, newest data wins, in order", () => {
  const merged = mergeMessages([{ id: 1, body: "a" }, { id: 3, body: "c" }], [{ id: 2, body: "b" }, { id: 3, body: "c!" }]);
  assert.deepEqual(merged, [{ id: 1, body: "a" }, { id: 2, body: "b" }, { id: 3, body: "c!" }]);
});

test("the last real id ignores pending placeholders", () => {
  assert.equal(lastRealId([{ id: 4 }, { id: -1799 }, { id: 9 }]), 9);
  assert.equal(lastRealId([]), 0);
});
