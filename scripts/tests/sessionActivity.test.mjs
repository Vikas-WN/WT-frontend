// Run: pnpm test:unit   (node --experimental-strip-types --test scripts/tests/*.test.mjs)
// Pure rules behind the 4-hour inactivity timer, including the cross-tab bug.
import test from "node:test";
import assert from "node:assert/strict";
import {
  idleForMs, isIdleExpired, isInWarningWindow, latestActivity, parseStoredActivity,
  resolveInitialActivity, shouldPingActivity,
} from "../../src/utils/sessionActivity.ts";

const H = 60 * 60 * 1000, MIN = 60 * 1000, LIMIT = 4 * H;

test("exactly 4 hours of inactivity ends the session; one second less does not", () => {
  const last = 1_000_000_000_000;
  assert.equal(isIdleExpired(last + LIMIT - 1000, last, LIMIT), false);
  assert.equal(isIdleExpired(last + LIMIT, last, LIMIT), true);
  assert.equal(isIdleExpired(last + 7 * H, last, LIMIT), true);
});

test("there is no age cap: 30 hours after login but active a minute ago is NOT expired", () => {
  const now = 1_000_000_000_000 + 30 * H;
  assert.equal(isIdleExpired(now, now - MIN, LIMIT), false);
});

test("THE BUG: activity in another tab keeps this idle tab signed in", () => {
  const now = 1_000_000_000_000;
  const thisTabLast = now - 5 * H;          // this background tab has had no input for 5h
  const otherTabLast = now - 2 * MIN;       // but the user is working in another tab
  assert.equal(isIdleExpired(now, thisTabLast, LIMIT), true, "judged on its own clock it would sign out");
  assert.equal(isIdleExpired(now, latestActivity(thisTabLast, otherTabLast), LIMIT), false, "shared activity keeps it");
});

test("latestActivity ignores missing/invalid values", () => {
  assert.equal(latestActivity(null, undefined, NaN, 5, 9, 3), 9);
  assert.equal(latestActivity(), 0);
});

test("a stale stored timestamp from a previous visit does not sign a fresh load out", () => {
  const now = 1_000_000_000_000;
  assert.equal(resolveInitialActivity(now - 20 * H, now, LIMIT), now);       // yesterday's leftover
  assert.equal(resolveInitialActivity(now - 10 * MIN, now, LIMIT), now - 10 * MIN); // recent: honoured
  assert.equal(resolveInitialActivity(null, now, LIMIT), now);
  assert.equal(resolveInitialActivity(now + 5 * H, now, LIMIT), now);        // clock skew / garbage
});

test("stored timestamp parsing", () => {
  assert.equal(parseStoredActivity("1700000000000"), 1700000000000);
  for (const bad of [null, undefined, "", "abc", "-5", "0", "NaN"]) assert.equal(parseStoredActivity(bad), null);
});

test("warning window is the last stretch before the limit, and ends at the limit", () => {
  const last = 1_000_000_000_000, warn = 5 * MIN;
  assert.equal(isInWarningWindow(last + LIMIT - 6 * MIN, last, LIMIT, warn), false);
  assert.equal(isInWarningWindow(last + LIMIT - 5 * MIN, last, LIMIT, warn), true);
  assert.equal(isInWarningWindow(last + LIMIT, last, LIMIT, warn), false);
  assert.equal(idleForMs(last - 5, last), 0);
});

test("an idle tab does not ping the server; one with new activity does, at most every interval", () => {
  const t0 = 1_000_000_000_000;
  assert.equal(shouldPingActivity(t0 + 10 * MIN, t0 - MIN, t0, 2 * MIN), false, "no activity since last ping");
  assert.equal(shouldPingActivity(t0 + 1 * MIN, t0 + 30_000, t0, 2 * MIN), false, "too soon");
  assert.equal(shouldPingActivity(t0 + 3 * MIN, t0 + 30_000, t0, 2 * MIN), true);
});
