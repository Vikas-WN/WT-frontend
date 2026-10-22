import assert from "node:assert/strict";
import { test } from "node:test";
import { companionGait, COMPANION_MOTION } from "../../src/utils/companionMotion.ts";

test("a stationary companion has no sliding feet, arm swing or body wobble", () => {
  for (const id of Object.keys(COMPANION_MOTION)) {
    for (const value of Object.values(companionGait(id, 123, 0))) assert.equal(Math.abs(value), 0);
  }
});
test("left and right steps alternate and the gait repeats after one stride", () => {
  for (const [id, profile] of Object.entries(COMPANION_MOTION)) {
    const step = companionGait(id, profile.stride / 4, 1);
    assert.ok(step.leftY < 0);
    assert.equal(Math.abs(step.rightY), 0);
    assert.equal(step.leftX, -step.rightX);
    const again = companionGait(id, profile.stride * 1.25, 1);
    for (const key of Object.keys(step)) assert.ok(Math.abs(step[key] - again[key]) < 1e-10);
  }
});
test("different characters have distinct step cadence and speed", () => {
  assert.ok(COMPANION_MOTION.pikachu.speed > COMPANION_MOTION.charmander.speed);
  assert.ok(COMPANION_MOTION.virat.bob < COMPANION_MOTION.pikachu.bob);
});
