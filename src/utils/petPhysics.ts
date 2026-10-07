/**
 * The movement rules of Knot, the desk pet — kept free of React and the DOM so they can be tested. Everything is in CSS
 * pixels and seconds. y grows downwards; the pet stands on the floor line near the bottom of the window.
 */

export interface PetBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PetWorld {
  width: number;
  height: number;
  /** The pet is square: this is its side. */
  size: number;
  /** Space kept clear at the left and right edges. */
  margin: number;
  /** Space between the pet's feet and the bottom of the window (clears a phone's browser bar / the page edge). */
  floorGap: number;
}

export const GRAVITY = 2200;
const BOUNCE = 0.42;
const FRICTION_PER_SECOND = 4.5;
const REST_SPEED = 55;
const MAX_THROW = 2600;

export function floorY(world: PetWorld): number {
  return Math.max(0, world.height - world.size - world.floorGap);
}

export function clampX(x: number, world: PetWorld): number {
  return Math.min(Math.max(x, world.margin), Math.max(world.margin, world.width - world.size - world.margin));
}

/** One physics step for a pet that has been let go: gravity, bouncing off the floor and the side walls, sliding to a halt. */
export function stepFalling(body: PetBody, dt: number, world: PetWorld): { body: PetBody; resting: boolean } {
  let { x, y, vx, vy } = body;
  vy += GRAVITY * dt;
  x += vx * dt;
  y += vy * dt;

  const left = world.margin;
  const right = Math.max(left, world.width - world.size - world.margin);
  if (x < left) {
    x = left;
    vx = Math.abs(vx) * BOUNCE;
  } else if (x > right) {
    x = right;
    vx = -Math.abs(vx) * BOUNCE;
  }
  if (y < 0) {
    y = 0;
    vy = Math.abs(vy) * BOUNCE;
  }

  const floor = floorY(world);
  let resting = false;
  if (y >= floor) {
    y = floor;
    if (Math.abs(vy) < REST_SPEED * 2) {
      vy = 0;
    } else {
      vy = -Math.abs(vy) * BOUNCE;
    }
    vx *= Math.max(0, 1 - FRICTION_PER_SECOND * dt);
    if (vy === 0 && Math.abs(vx) < REST_SPEED) {
      vx = 0;
      resting = true;
    }
  }
  return { body: { x, y, vx, vy }, resting };
}

/** Somewhere to wander to: not too close to where it already is, and always inside the window. */
export function pickWanderTarget(x: number, world: PetWorld, random: () => number): number {
  const range = Math.max(0, world.width - world.size - 2 * world.margin);
  if (range <= 0) return world.margin;
  const minHop = Math.min(120, range / 3);
  for (let i = 0; i < 6; i += 1) {
    const candidate = world.margin + random() * range;
    if (Math.abs(candidate - x) >= minHop) return candidate;
  }
  return world.margin + random() * range;
}

/** Walk towards `target` at `speed` px/s. `direction` is -1 (left), 1 (right) or 0 when already there. */
export function stepWalk(x: number, target: number, speed: number, dt: number): { x: number; arrived: boolean; direction: -1 | 0 | 1 } {
  const gap = target - x;
  if (Math.abs(gap) <= speed * dt) return { x: target, arrived: true, direction: gap === 0 ? 0 : gap > 0 ? 1 : -1 };
  const direction = gap > 0 ? 1 : -1;
  return { x: x + direction * speed * dt, arrived: false, direction };
}

export interface PointerSample {
  x: number;
  y: number;
  t: number;
}

/** How fast the pet was moving when it was let go, from the last few pointer positions (px/s), capped so it can't be flung out of sight. */
export function throwVelocity(samples: readonly PointerSample[], now: number, windowMs = 90): { vx: number; vy: number } {
  const recent = samples.filter((s) => now - s.t <= windowMs);
  if (recent.length < 2) return { vx: 0, vy: 0 };
  const first = recent[0];
  const last = recent[recent.length - 1];
  const dt = (last.t - first.t) / 1000;
  if (dt <= 0) return { vx: 0, vy: 0 };
  const cap = (v: number) => Math.max(-MAX_THROW, Math.min(MAX_THROW, v));
  return { vx: cap((last.x - first.x) / dt), vy: cap((last.y - first.y) / dt) };
}

/** Where the eyes look: a small offset towards the pointer, at most `max` px. */
export function lookOffset(petCenter: { x: number; y: number }, pointer: { x: number; y: number }, max = 2.4): { x: number; y: number } {
  const dx = pointer.x - petCenter.x;
  const dy = pointer.y - petCenter.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return { x: 0, y: 0 };
  const strength = Math.min(1, distance / 220);
  return { x: (dx / distance) * max * strength, y: (dy / distance) * max * strength };
}
