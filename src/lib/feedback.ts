"use client";

/**
 * Small, optional sound and haptic feedback for approvals — both OFF unless the person switched them on in Settings.
 *
 * Sounds are synthesised with the Web Audio API (no audio files to download); haptics use the Vibration API where the
 * device has one (most phones; desktops do nothing). Anything that goes wrong is swallowed: feedback is a nicety and must
 * never break the action it accompanies.
 */

import { trackFeature } from "@/lib/telemetry/client";
import { emitPetEvent } from "@/lib/petEvents";

export type FeedbackKind = "approve" | "reject" | "undo" | "success";

type FeedbackSettings = { sound: boolean; haptic: boolean };

let settings: FeedbackSettings = { sound: false, haptic: false };
let audio: AudioContext | null = null;

/** Called by the preferences provider whenever the person's choices change. */
export function configureFeedback(next: FeedbackSettings): void {
  settings = next;
}

type Note = { freq: number; at: number; length: number; gain?: number };

const SOUNDS: Record<FeedbackKind, Note[]> = {
  // Two quick rising notes: done, and good.
  approve: [
    { freq: 659.25, at: 0, length: 0.11 },
    { freq: 880, at: 0.1, length: 0.18 },
  ],
  // One soft, low note: noted, not a scolding.
  reject: [{ freq: 220, at: 0, length: 0.22, gain: 0.07 }],
  undo: [
    { freq: 587.33, at: 0, length: 0.09 },
    { freq: 440, at: 0.08, length: 0.12 },
  ],
  success: [{ freq: 783.99, at: 0, length: 0.14 }],
};

const BUZZ: Record<FeedbackKind, number | number[]> = {
  approve: [16, 40, 16],
  reject: 40,
  undo: [10, 30, 10],
  success: 14,
};

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function playSound(kind: FeedbackKind): void {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  audio ??= new Ctor();
  const ctx = audio;
  if (ctx.state === "suspended") void ctx.resume();
  const start = ctx.currentTime;
  for (const note of SOUNDS[kind]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = note.freq;
    const peak = note.gain ?? 0.06;
    // A short fade in and out stops the click you get from starting a tone at full volume.
    gain.gain.setValueAtTime(0.0001, start + note.at);
    gain.gain.exponentialRampToValueAtTime(peak, start + note.at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.at + note.length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start + note.at);
    osc.stop(start + note.at + note.length + 0.02);
  }
}

/** Give the feedback that goes with an action, if the person asked for it. Safe to call anywhere, any time. */
export function giveFeedback(kind: FeedbackKind): void {
  if (typeof window === "undefined") return;
  // Knot, the pet, reacts whether or not the person wants sounds.
  emitPetEvent(kind);
  trackFeature(`approval_${kind}`);
  try {
    if (settings.sound && !prefersReducedMotion()) playSound(kind);
    if (settings.haptic && typeof navigator.vibrate === "function") navigator.vibrate(BUZZ[kind]);
  } catch {
    /* never let a nicety break an approval */
  }
}
