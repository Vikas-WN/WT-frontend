import assert from "node:assert/strict";
import { test } from "node:test";

import { rate } from "../../src/lib/telemetry/rating.ts";

test("ratings follow Google's thresholds at and around the boundaries", () => {
  assert.equal(rate("LCP", 2500), "good");
  assert.equal(rate("LCP", 2501), "needs-improvement");
  assert.equal(rate("LCP", 4001), "poor");
  assert.equal(rate("CLS", 0.1), "good");
  assert.equal(rate("CLS", 0.26), "poor");
  assert.equal(rate("INP", 199), "good");
  assert.equal(rate("INP", 501), "poor");
  assert.equal(rate("TTFB", 1000), "needs-improvement");
  assert.equal(rate("FCP", 1800), "good");
});

test("an unknown metric is never reported as bad", () => {
  assert.equal(rate("MADE_UP", 99999), "good");
});
