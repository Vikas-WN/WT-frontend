// Run: pnpm test:unit   (node --experimental-strip-types --test scripts/tests/*.test.mjs)
// Which "What's new" releases a user is shown — once per release, never twice.
import test from "node:test";
import assert from "node:assert/strict";
import {
  formatReleaseDate, isPreviewRequested, newestSeenId, readSeenLocally, releasesToShow, writeSeenLocally,
} from "../../src/utils/whatsNew.ts";

const r = (id) => ({ id });
const ids = (list) => list.map((x) => x.id);
const R3 = r("2026-10-05-01"), R2 = r("2026-09-30-01"), R1 = r("2026-09-01-01");
const all = [R3, R2, R1];

test("a user who has read nothing is shown only the latest release, not the whole history", () => {
  assert.deepEqual(ids(releasesToShow(all, [null, undefined, ""], 3)), ["2026-10-05-01"]);
});

test("a user who has read the latest release is shown nothing — this is the 'never again'", () => {
  assert.deepEqual(releasesToShow(all, ["2026-10-05-01"], 3), []);
});

test("a new deployment shows the new release once; after that it is gone", () => {
  const before = [R2, R1];
  assert.deepEqual(releasesToShow(before, ["2026-09-30-01"], 3), []);            // up to date
  assert.deepEqual(ids(releasesToShow(all, ["2026-09-30-01"], 3)), ["2026-10-05-01"]); // deploy R3
  assert.deepEqual(releasesToShow(all, ["2026-10-05-01"], 3), []);                // dismissed
});

test("someone who skipped updates sees each one they missed, newest first", () => {
  assert.deepEqual(ids(releasesToShow(all, ["2026-09-01-01"], 3)), ["2026-10-05-01", "2026-09-30-01"]);
});

test("the number shown is capped so the dialog stays readable", () => {
  const many = ["05", "04", "03", "02", "01"].map((n) => r(`2026-10-${n}-01`));
  assert.equal(releasesToShow(many, ["2026-09-01-01"], 3).length, 3);
  assert.deepEqual(ids(releasesToShow(many, ["2026-09-01-01"], 3)), ["2026-10-05-01", "2026-10-04-01", "2026-10-03-01"]);
});

test("input order does not matter", () => {
  assert.deepEqual(ids(releasesToShow([R1, R3, R2], ["2026-09-01-01"], 3)), ["2026-10-05-01", "2026-09-30-01"]);
});

test("the local copy counts too: a failed server save must not make the dialog come back", () => {
  assert.deepEqual(releasesToShow(all, [null, "2026-10-05-01"], 3), []);
  assert.equal(newestSeenId("2026-09-30-01", "2026-10-05-01", null), "2026-10-05-01"); // newest source wins
});

test("an id newer than anything in this build (a rollback, another environment) shows nothing old", () => {
  assert.deepEqual(releasesToShow(all, ["2027-01-01-01"], 3), []);
});

test("an id this build has never seen, but older than its releases, still shows the newer ones", () => {
  assert.deepEqual(ids(releasesToShow(all, ["2026-08-15-01"], 3)), ["2026-10-05-01", "2026-09-30-01", "2026-09-01-01"]);
});

test("no releases, or a cap below one, shows nothing rather than failing", () => {
  assert.deepEqual(releasesToShow([], [null], 3), []);
  assert.deepEqual(releasesToShow(all, [null], 0), []);
});

test("the same-day counter orders correctly", () => {
  const a = r("2026-10-05-01"), b = r("2026-10-05-02");
  assert.deepEqual(ids(releasesToShow([a, b], ["2026-10-05-01"], 3)), ["2026-10-05-02"]);
});

test("?whatsNew=preview is recognised, and nothing else is", () => {
  assert.equal(isPreviewRequested("?whatsNew=preview", "whatsNew", "preview"), true);
  assert.equal(isPreviewRequested("?a=1&whatsNew=preview", "whatsNew", "preview"), true);
  for (const s of ["", "?whatsNew=1", "?whatsNew=", "?other=preview", "?WHATSNEW=preview"]) {
    assert.equal(isPreviewRequested(s, "whatsNew", "preview"), false, s);
  }
});

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v; } };
}

test("the local copy can be written and read back, and only ever moves forward", () => {
  const s = fakeStorage();
  assert.equal(readSeenLocally(s, "k"), null);
  writeSeenLocally(s, "k", "2026-09-30-01");
  assert.equal(readSeenLocally(s, "k"), "2026-09-30-01");
  writeSeenLocally(s, "k", "2026-09-01-01"); // a stale tab
  assert.equal(readSeenLocally(s, "k"), "2026-09-30-01");
  writeSeenLocally(s, "k", "2026-10-05-01");
  assert.equal(readSeenLocally(s, "k"), "2026-10-05-01");
});

test("blocked or broken storage never throws", () => {
  const broken = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } };
  assert.equal(readSeenLocally(broken, "k"), null);
  assert.doesNotThrow(() => writeSeenLocally(broken, "k", "x"));
  assert.equal(readSeenLocally(null, "k"), null);
  assert.doesNotThrow(() => writeSeenLocally(null, "k", "x"));
});

test("release dates are shown as written, whatever timezone the viewer is in", () => {
  assert.equal(formatReleaseDate("2026-09-30"), "30 Sep 2026");
  assert.equal(formatReleaseDate("2026-01-05"), "5 Jan 2026");
  assert.equal(formatReleaseDate("not a date"), "not a date");
  assert.equal(formatReleaseDate("2026-13-01"), "2026-13-01");
});
