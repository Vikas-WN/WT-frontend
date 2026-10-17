/**
 * The smoothing behind Knot's movement: springs that settle with a little overshoot, an eased look-at, breathing and the walk
 * cycle. Pure functions (no React, no DOM) so they can be tested, and so the same maths can drive a rendered preview.
 * Seconds and CSS pixels throughout.
 */

export interface Spring {
  /** Current value. */
  x: number;
  /** Current speed of change (units per second). */
  v: number;
}

export interface SpringTuning {
  /** How hard it is pulled toward the target (higher = snappier). */
  stiffness: number;
  /** How quickly the wobble dies out (higher = less overshoot). Below 2·√stiffness it overshoots. */
  damping: number;
}

/** A little overshoot, settles in about a third of a second — the squash and stretch of the body. */
export const BODY_SPRING: SpringTuning = { stiffness: 420, damping: 19 };
/** Quicker and tighter — turning round, tilting into a move. */
export const TURN_SPRING: SpringTuning = { stiffness: 300, damping: 30 };
export const TILT_SPRING: SpringTuning = { stiffness: 180, damping: 15 };

const MAX_SUBSTEP = 1 / 240;

/**
 * Advance a spring by `dt` towards `target`. Done in small fixed sub-steps (semi-implicit Euler), so a slow frame — a busy tab,
 * a phone — cannot make it blow up or jitter.
 */
export function stepSpring(spring: Spring, target: number, dt: number, tuning: SpringTuning): Spring {
  let { x, v } = spring;
  let remaining = Math.max(0, dt);
  while (remaining > 1e-9) {
    const h = Math.min(MAX_SUBSTEP, remaining);
    v += (tuning.stiffness * (target - x) - tuning.damping * v) * h;
    x += v * h;
    remaining -= h;
  }
  return { x, v };
}

/** True once a spring has effectively stopped, so the loop can skip it. */
export function settled(spring: Spring, target: number, epsilon = 0.001): boolean {
  return Math.abs(spring.x - target) < epsilon && Math.abs(spring.v) < epsilon * 10;
}

/** Frame-rate independent easing of `current` towards `target`: `rate` is roughly "per second" (higher = quicker). */
export function ease(current: number, target: number, dt: number, rate: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * Math.max(0, dt)));
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** How stretched the body is for a vertical speed (up to 16%): tall and thin while falling or rising fast. */
export function stretchForSpeed(vy: number): number {
  return clamp(Math.abs(vy) / 2600, 0, 1) * 0.16;
}

/** The kick given to the stretch spring on landing: a harder landing squashes harder (returns a velocity for the spring). */
export function landingKick(impactSpeed: number): number {
  return -clamp(impactSpeed / 1800, 0.25, 1.6) * 5.5;
}

/** Degrees of lean for a horizontal speed (px/s): leaning into the direction of travel, never more than `max`. */
export function leanForSpeed(vx: number, max = 12): number {
  return clamp(vx / 1100, -1, 1) * max;
}

/** A slow breath: a tiny rise and fall of the chest. `t` is seconds; `asleep` makes it slower and deeper. */
export function breathe(t: number, asleep: boolean): number {
  const period = asleep ? 4.6 : 3.2;
  const depth = asleep ? 0.022 : 0.012;
  return Math.sin((t * Math.PI * 2) / period) * depth;
}

export interface Waddle {
  /** Lift off the ground, px (always >= 0). */
  bob: number;
  /** Sway, degrees. */
  sway: number;
}

/** The walk cycle from how far the pet has walked: one full waddle every `stride` px, so it matches its speed instead of a fixed loop. */
export function waddle(distance: number, stride = 26): Waddle {
  const phase = (distance / stride) * Math.PI * 2;
  return { bob: Math.abs(Math.sin(phase)) * 3.2, sway: Math.sin(phase) * 4.2 };
}

export interface Pose {
  turn: number;
  stretch: number;
  breath: number;
  tilt: number;
  bob: number;
}

/** The body's horizontal and vertical scale for a pose. Volume is kept roughly constant (taller means thinner), and the
 *  horizontal scale carries `turn`, so turning round passes smoothly through the pet's edge instead of flipping. */
export function bodyScale(pose: Pick<Pose, "turn" | "stretch" | "breath">): { sx: number; sy: number } {
  const sy = 1 + pose.stretch + pose.breath;
  return { sx: pose.turn * (1 / Math.sqrt(Math.max(0.5, sy))), sy };
}

/** The CSS transform for the pet's body from its current pose. */
export function bodyTransform(pose: Pose): string {
  const { sx, sy } = bodyScale(pose);
  return `translate3d(0, ${(-pose.bob).toFixed(2)}px, 0) rotate(${pose.tilt.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
}
