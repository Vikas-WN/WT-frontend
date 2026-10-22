import assert from "node:assert/strict";
import test from "node:test";

import { BODY_SPRING, bodyTransform, breathe, ease, landingKick, leanForSpeed, settled, stepSpring, stretchForSpeed, waddle } from "../../src/utils/petMotion.ts";

const run = (target, tuning, seconds, dt = 1 / 60, from = { x: 0, v: 0 }) => {
  let s = from;
  const trace = [];
  for (let t = 0; t < seconds; t += dt) {
    s = stepSpring(s, target, dt, tuning);
    trace.push(s.x);
  }
  return { s, trace };
};

test("a spring settles on its target and overshoots a little on the way", () => {
  const { s, trace } = run(1, BODY_SPRING, 1.5);
  assert.ok(Math.abs(s.x - 1) < 0.001);
  assert.ok(Math.max(...trace) > 1.005, "it should overshoot slightly");
  assert.ok(Math.max(...trace) < 1.3, "but not wildly");
});

test("the result does not depend on the frame rate", () => {
  const a = run(1, BODY_SPRING, 0.5, 1 / 30).s.x;
  const b = run(1, BODY_SPRING, 0.5, 1 / 144).s.x;
  assert.ok(Math.abs(a - b) < 0.01, `${a} vs ${b}`);
});

test("a very slow frame cannot make it blow up", () => {
  const s = stepSpring({ x: 0, v: 0 }, 1, 0.5, BODY_SPRING);
  assert.ok(Number.isFinite(s.x) && Math.abs(s.x) < 5);
});

test("settled recognises a spring at rest", () => {
  assert.equal(settled({ x: 1, v: 0 }, 1), true);
  assert.equal(settled({ x: 0.5, v: 0 }, 1), false);
  assert.equal(settled({ x: 1, v: 3 }, 1), false);
});

test("ease moves towards the target at a rate that does not depend on frame size", () => {
  const one = ease(0, 1, 0.1, 10);
  let two = 0;
  two = ease(two, 1, 0.05, 10);
  two = ease(two, 1, 0.05, 10);
  assert.ok(Math.abs(one - two) < 1e-9);
});

test("falling fast stretches the body, a harder landing squashes harder", () => {
  assert.ok(stretchForSpeed(0) === 0);
  assert.ok(stretchForSpeed(2000) > stretchForSpeed(600));
  assert.ok(stretchForSpeed(99999) <= 0.16);
  assert.ok(landingKick(1500) < landingKick(500) && landingKick(500) < 0);
});

test("it leans into the way it is moving, up to a limit", () => {
  assert.ok(leanForSpeed(500) > 0 && leanForSpeed(-500) < 0);
  assert.equal(leanForSpeed(99999), 12);
});

test("breathing is small, and deeper and slower asleep", () => {
  const awake = Math.max(...Array.from({ length: 400 }, (_, i) => breathe(i / 100, false)));
  const asleep = Math.max(...Array.from({ length: 600 }, (_, i) => breathe(i / 100, true)));
  assert.ok(awake > 0 && awake < 0.02);
  assert.ok(asleep > awake);
});

test("the waddle follows distance walked, so a faster walk waddles faster", () => {
  const w0 = waddle(0);
  assert.equal(w0.bob, 0);
  const quarter = waddle(26 / 4);
  assert.ok(quarter.bob > 3 && Math.abs(quarter.sway) > 4);
});

test("the body preserves volume and never collapses or reflects during a turn", () => {
  const tall = bodyTransform({ turn: 1, stretch: 0.15, breath: 0, tilt: 0, bob: 0 });
  assert.match(tall, /scale\(0\.93\d+, 1\.1500\)/);
  const mid = bodyTransform({ turn: 0, stretch: 0, breath: 0, tilt: 0, bob: 0 });
  assert.match(mid, /scale\(1\.0000, 1\.0000\)/);
  for (let turn = -1; turn <= 1; turn += .1) {
    const frame = bodyTransform({ turn, stretch: 0, breath: 0, tilt: 0, bob: 0 });
    assert.match(frame, /scale\(1\.0000, 1\.0000\)/);
  }
});
