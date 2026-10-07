import assert from "node:assert/strict";
import { test } from "node:test";

import { clampX, floorY, lookOffset, pickWanderTarget, stepFalling, stepWalk, throwVelocity } from "../../src/utils/petPhysics.ts";

const world = { width: 1000, height: 700, size: 64, margin: 8, floorGap: 12 };

function settle(body) {
  let b = body;
  for (let i = 0; i < 600; i += 1) {
    const r = stepFalling(b, 1 / 60, world);
    b = r.body;
    if (r.resting) return { body: b, steps: i };
  }
  return { body: b, steps: 600 };
}

test("a dropped pet falls, bounces and comes to rest on the floor", () => {
  const { body, steps } = settle({ x: 400, y: 100, vx: 0, vy: 0 });
  assert.equal(body.y, floorY(world));
  assert.equal(body.vy, 0);
  assert.ok(steps < 600, "should settle within ten seconds");
});

test("it never leaves the window, even when thrown hard", () => {
  let b = { x: 500, y: 300, vx: 2600, vy: -2600 };
  for (let i = 0; i < 300; i += 1) {
    b = stepFalling(b, 1 / 60, world).body;
    assert.ok(b.x >= world.margin && b.x <= world.width - world.size - world.margin, `x=${b.x}`);
    assert.ok(b.y >= 0 && b.y <= floorY(world), `y=${b.y}`);
  }
});

test("a throw slides a little and stops", () => {
  const { body } = settle({ x: 100, y: floorY(world), vx: 900, vy: 0 });
  assert.ok(body.x > 100 && body.x <= world.width);
  assert.equal(body.vx, 0);
});

test("walking arrives exactly and reports direction", () => {
  const first = stepWalk(100, 300, 60, 0.5);
  assert.equal(first.direction, 1);
  assert.equal(first.arrived, false);
  assert.equal(stepWalk(299, 300, 60, 0.5).arrived, true);
  assert.equal(stepWalk(300, 100, 60, 0.1).direction, -1);
});

test("wander targets stay inside the window and are not right next to the pet", () => {
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 50; i += 1) {
    const t = pickWanderTarget(500, world, random);
    assert.ok(t >= world.margin && t <= world.width - world.size - world.margin);
  }
  assert.equal(pickWanderTarget(0, { ...world, width: 60 }, () => 0.5), world.margin);
});

test("throw velocity comes from recent movement only, and is capped", () => {
  const samples = [{ x: 0, y: 0, t: 0 }, { x: 10, y: 0, t: 500 }, { x: 60, y: 0, t: 540 }, { x: 110, y: 0, t: 580 }];
  const v = throwVelocity(samples, 600);
  assert.ok(v.vx > 1000 && v.vx < 2600, String(v.vx));
  assert.deepEqual(throwVelocity(samples, 5000), { vx: 0, vy: 0 });
  assert.equal(throwVelocity([{ x: 0, y: 0, t: 0 }, { x: 9999, y: 0, t: 10 }], 20).vx, 2600);
});

test("eyes look towards the pointer, gently, and are still when it is on top of the pet", () => {
  const right = lookOffset({ x: 100, y: 100 }, { x: 400, y: 100 });
  assert.ok(right.x > 2 && Math.abs(right.y) < 0.01);
  assert.deepEqual(lookOffset({ x: 5, y: 5 }, { x: 5, y: 5 }), { x: 0, y: 0 });
  const near = lookOffset({ x: 0, y: 0 }, { x: 20, y: 0 });
  assert.ok(near.x < right.x);
});

test("clampX keeps a position in range", () => {
  assert.equal(clampX(-50, world), world.margin);
  assert.equal(clampX(5000, world), world.width - world.size - world.margin);
});
