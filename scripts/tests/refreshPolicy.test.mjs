import test from "node:test";
import assert from "node:assert/strict";
import { isTransientStatus, retryTransient } from "../../src/utils/refreshPolicy.ts";

const noSleep = async () => {};

test("network failures and server trouble are transient; a real 'no' is not", () => {
  for (const status of [0, 408, 429, 500, 502, 503, 504]) assert.equal(isTransientStatus(status), true, String(status));
  for (const status of [200, 400, 401, 403, 404]) assert.equal(isTransientStatus(status), false, String(status));
});

test("a refresh that fails twice and then works is ridden out", async () => {
  const results = [{ kind: "transient" }, { kind: "transient" }, { kind: "ok", value: "session" }];
  let calls = 0;
  const outcome = await retryTransient(async () => results[calls++], [1, 1, 1], noSleep);
  assert.deepEqual(outcome, { kind: "ok", value: "session" });
  assert.equal(calls, 3);
});

test("a definitive rejection is returned at once, with no retries", async () => {
  let calls = 0;
  const outcome = await retryTransient(async () => (calls++, { kind: "rejected" }), [1, 1, 1], noSleep);
  assert.equal(outcome.kind, "rejected");
  assert.equal(calls, 1);
});

test("an outage that outlasts the retries stays 'transient' (never 'rejected')", async () => {
  let calls = 0;
  const outcome = await retryTransient(async () => (calls++, { kind: "transient" }), [1, 1], noSleep);
  assert.equal(outcome.kind, "transient");
  assert.equal(calls, 3);
});
