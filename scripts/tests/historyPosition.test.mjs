import assert from "node:assert/strict";
import { test } from "node:test";

import { canGoBackFrom, canGoForwardFrom, stepHistory } from "../../src/utils/historyPosition.ts";

test("the first page has nothing behind or ahead", () => {
  const { position, stamp } = stepHistory(null, undefined);
  assert.deepEqual(position, { index: 0, max: 0 });
  assert.equal(stamp, 0);
  assert.equal(canGoBackFrom(position), false);
  assert.equal(canGoForwardFrom(position), false);
});

test("navigating forward adds an entry and enables Back", () => {
  let p = stepHistory(null, undefined).position;
  p = stepHistory(p, undefined).position;
  p = stepHistory(p, undefined).position;
  assert.deepEqual(p, { index: 2, max: 2 });
  assert.equal(canGoBackFrom(p), true);
  assert.equal(canGoForwardFrom(p), false);
});

test("going back lands on a stamped entry: Forward turns on", () => {
  let p = { index: 2, max: 2 };
  p = stepHistory(p, 1).position;
  assert.deepEqual(p, { index: 1, max: 2 });
  assert.equal(canGoForwardFrom(p), true);
  p = stepHistory(p, 0).position;
  assert.equal(canGoBackFrom(p), false);
  assert.equal(canGoForwardFrom(p), true);
});

test("a new page after going back throws away what was ahead", () => {
  const back = stepHistory({ index: 2, max: 2 }, 1).position; // now at 1, forward to 2
  const fresh = stepHistory(back, undefined);
  assert.deepEqual(fresh.position, { index: 2, max: 2 });
  assert.equal(canGoForwardFrom(fresh.position), false);
});

test("a reload on a stamped entry keeps what we knew about the way forward", () => {
  const p = stepHistory({ index: 1, max: 3 }, 1).position;
  assert.equal(p.max, 3);
});
