import assert from "node:assert/strict";
import { test } from "node:test";
import { announceDataChange, DATA_CHANGED, DATA_REVISION_KEY } from "../../src/lib/dataRefresh.ts";

test("data-change signals are safe during server rendering", () => {
  assert.doesNotThrow(() => announceDataChange());
});

test("successful-write signal reaches this tab and writes a cross-tab revision", () => {
  const events = [];
  const writes = [];
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  globalThis.localStorage = { setItem: (...args) => writes.push(args) };
  try {
    announceDataChange();
    assert.deepEqual(events, [DATA_CHANGED]);
    assert.equal(writes[0][0], DATA_REVISION_KEY);
    assert.ok(Number.isFinite(Number(writes[0][1])));
  } finally { delete globalThis.window; delete globalThis.localStorage; }
});

test("blocked browser storage does not prevent this tab from updating", () => {
  let received = false;
  globalThis.window = { dispatchEvent: () => { received = true; } };
  globalThis.localStorage = { setItem: () => { throw new Error("storage denied"); } };
  try {
    assert.doesNotThrow(() => announceDataChange());
    assert.equal(received, true);
  } finally { delete globalThis.window; delete globalThis.localStorage; }
});
