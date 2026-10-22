import type { CompanionId } from "../constants/companions";

export const COMPANION_MOTION = {
  knot: { speed: 44, stride: 30, lift: 2.2, bob: 1.3, sway: 1.8, arm: 6 },
  virat: { speed: 57, stride: 43, lift: 2.7, bob: .45, sway: .5, arm: 11 },
  goku: { speed: 62, stride: 46, lift: 3.1, bob: .6, sway: .7, arm: 14 },
  pikachu: { speed: 68, stride: 27, lift: 2.4, bob: 1.5, sway: 1.2, arm: 5 },
  charmander: { speed: 38, stride: 35, lift: 2, bob: .9, sway: 1.7, arm: 7 },
} as const;

/** Distance-driven gait keeps feet synchronized to travel, independent of refresh rate. */
export function companionGait(character: CompanionId, distance: number, blend: number) {
  const profile = COMPANION_MOTION[character];
  const phase = distance / profile.stride * Math.PI * 2;
  const weight = Math.max(0, Math.min(1, blend));
  const swing = Math.sin(phase);
  return {
    leftX: swing * 3 * weight,
    rightX: -swing * 3 * weight,
    leftY: -Math.max(0, swing) * profile.lift * weight,
    rightY: -Math.max(0, -swing) * profile.lift * weight,
    leftArm: -swing * profile.arm * weight,
    rightArm: swing * profile.arm * weight,
    bob: Math.abs(swing) * profile.bob * weight,
    sway: Math.cos(phase) * profile.sway * weight,
  };
}
