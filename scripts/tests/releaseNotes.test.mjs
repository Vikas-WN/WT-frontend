// Run: pnpm test:unit
// Guards the release-notes file itself: a malformed or mis-ordered entry breaks "once per release"
// for every user, so it must fail the test run rather than reach a deployment.
import test from "node:test";
import assert from "node:assert/strict";
import { RELEASE_NOTES } from "../../src/constants/releaseNotes.ts";
import { releasesToShow } from "../../src/utils/whatsNew.ts";

test("there is at least one release to announce", () => {
  assert.ok(RELEASE_NOTES.length >= 1);
});

test("ids are YYYY-MM-DD-NN, unique, and strictly newest-first (the order 'newer than seen' relies on)", () => {
  const ids = RELEASE_NOTES.map((r) => r.id);
  for (const id of ids) assert.match(id, /^\d{4}-\d{2}-\d{2}-\d{2}$/, `bad id ${id}`);
  assert.equal(new Set(ids).size, ids.length, "duplicate release id");
  for (let i = 1; i < ids.length; i += 1) {
    assert.ok(ids[i - 1] > ids[i], `release ${ids[i - 1]} must come before ${ids[i]} and be newer`);
  }
});

test("each release's date is a real calendar date that matches its id", () => {
  for (const r of RELEASE_NOTES) {
    assert.match(r.releasedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(!Number.isNaN(Date.parse(`${r.releasedOn}T00:00:00Z`)), `${r.id}: invalid date ${r.releasedOn}`);
    assert.equal(new Date(`${r.releasedOn}T00:00:00Z`).toISOString().slice(0, 10), r.releasedOn, `${r.id}: not a real date`);
    assert.equal(r.id.slice(0, 10), r.releasedOn, `${r.id}: id date and releasedOn disagree`);
  }
});

test("every release has a title and readable highlights (none empty, none a wall of text)", () => {
  for (const r of RELEASE_NOTES) {
    assert.ok(r.title.trim().length > 0 && r.title.length <= 80, `${r.id}: title`);
    assert.ok(r.highlights.length >= 1 && r.highlights.length <= 8, `${r.id}: 1-8 highlights`);
    for (const h of r.highlights) {
      assert.ok(h.area.trim() && h.area.length <= 24, `${r.id}: area "${h.area}"`);
      assert.ok(h.title.trim() && h.title.length <= 80, `${r.id}: title "${h.title}"`);
      assert.ok(h.description.trim().length >= 20 && h.description.length <= 260, `${r.id}: description of "${h.title}"`);
    }
  }
});

test("highlights within a release are not duplicated", () => {
  for (const r of RELEASE_NOTES) {
    const titles = r.highlights.map((h) => h.title);
    assert.equal(new Set(titles).size, titles.length, `${r.id}: duplicate highlight title`);
  }
});

test("a brand-new user is shown the latest release; a user who read it is shown nothing", () => {
  const latest = RELEASE_NOTES[0].id;
  assert.deepEqual(releasesToShow(RELEASE_NOTES, [null], 3).map((r) => r.id), [latest]);
  assert.deepEqual(releasesToShow(RELEASE_NOTES, [latest], 3), []);
});

test("release ids are valid for the server, which accepts short letter/digit/dot/dash/underscore tokens", () => {
  for (const r of RELEASE_NOTES) assert.match(r.id, /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/);
});
