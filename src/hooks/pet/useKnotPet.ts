"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import type { KnotMood } from "@/components/mascot/Knot";
import { PET_COPY, PET_LINES } from "@/constants/petCopy";
import { fireConfetti } from "@/lib/confetti";
import { PET_EVENT, type PetEventKind } from "@/lib/petEvents";
import {
  clampX,
  floorY,
  lookOffset,
  pickWanderTarget,
  stepFalling,
  stepWalk,
  throwVelocity,
  type PetBody,
  type PetWorld,
  type PointerSample,
} from "@/utils/petPhysics";

type Mode = "idle" | "walk" | "fall" | "drag" | "sleep";
export type BubbleAlign = "left" | "center" | "right";

const WALK_SPEED = 54;
const WANDER_MIN_MS = 5_000;
const WANDER_MAX_MS = 12_000;
const SLEEP_AFTER_MS = 90_000;
const BUBBLE_MS = 2_600;
const DRAG_THRESHOLD = 6;
const PET_HOLD_MS = 650;
const DOUBLE_CLICK_MS = 350;
const DIZZY_CLICKS = 5;
const DIZZY_WINDOW_MS = 1_800;
const HOP_SPEED = 640;

function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function worldFor(size: number): PetWorld {
  const small = window.innerWidth < 640;
  return { width: window.innerWidth, height: window.innerHeight, size, margin: 6, floorGap: small ? 20 : 14 };
}

/**
 * Knot's brain: where it is, what it is doing and how it reacts. Position and animation run on a requestAnimationFrame loop that
 * writes straight to the DOM (no re-render per frame); only what the screen must *show* — mood, speech, hearts — is React state.
 */
export function useKnotPet({ size, firstName }: { size: number; firstName: string | null }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const body = useRef<PetBody>({ x: 0, y: 0, vx: 0, vy: 0 });
  const mode = useRef<Mode>("idle");
  const facing = useRef<1 | -1>(-1);
  const target = useRef(0);
  const nextWanderAt = useRef(0);
  const lastActiveAt = useRef(0);
  const squashUntil = useRef(0);
  const drag = useRef({ offX: 0, offY: 0, startX: 0, startY: 0, moved: false, petted: false, samples: [] as PointerSample[] });
  const clicks = useRef<number[]>([]);
  const timers = useRef<number[]>([]);
  const ready = useRef(false);

  const [mood, setMoodState] = useState<KnotMood>("hello");
  const moodRef = useRef<KnotMood>("hello");
  const [bubble, setBubble] = useState<string | null>(null);
  const [align, setAlign] = useState<BubbleAlign>("center");
  const [hearts, setHearts] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const heartId = useRef(0);
  const bubbleTimer = useRef<number | null>(null);
  const moodTimer = useRef<number | null>(null);

  const setMood = useCallback((next: KnotMood, forMs?: number) => {
    moodRef.current = next;
    setMoodState(next);
    if (moodTimer.current) window.clearTimeout(moodTimer.current);
    moodTimer.current = forMs
      ? window.setTimeout(() => {
          const resting: KnotMood = mode.current === "sleep" ? "sleep" : "hello";
          moodRef.current = resting;
          setMoodState(resting);
        }, forMs)
      : null;
  }, []);

  const say = useCallback((text: string) => {
    const world = worldFor(size);
    const ratio = body.current.x / Math.max(1, world.width - size);
    setAlign(ratio < 0.2 ? "left" : ratio > 0.8 ? "right" : "center");
    setBubble(text);
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), BUBBLE_MS);
  }, [size]);

  const sprinkleHearts = useCallback((count: number) => {
    const ids = Array.from({ length: count }, () => (heartId.current += 1));
    setHearts((h) => [...h, ...ids]);
    window.setTimeout(() => setHearts((h) => h.filter((id) => !ids.includes(id))), 1300);
  }, []);

  const touch = useCallback(() => {
    lastActiveAt.current = performance.now();
  }, []);

  const wake = useCallback(() => {
    if (mode.current !== "sleep") return false;
    mode.current = "idle";
    setMood("hello");
    say(PET_COPY.wake);
    return true;
  }, [say, setMood]);

  const hop = useCallback((speed = HOP_SPEED) => {
    body.current.vy = -speed;
    mode.current = "fall";
  }, []);

  const party = useCallback(() => {
    setMood("party", 2200);
    hop(720);
    const world = worldFor(size);
    fireConfetti({ originYRatio: Math.min(0.9, (body.current.y + size / 2) / Math.max(1, world.height)), particleCount: 90 });
  }, [hop, setMood, size]);

  const poke = useCallback(() => {
    touch();
    if (wake()) return;
    const now = performance.now();
    clicks.current = [...clicks.current.filter((t) => now - t < DIZZY_WINDOW_MS), now];
    const recent = clicks.current;
    if (recent.length >= DIZZY_CLICKS) {
      clicks.current = [];
      setMood("dizzy", 2400);
      say(PET_COPY.dizzy);
      return;
    }
    if (recent.length >= 2 && now - recent[recent.length - 2] < DOUBLE_CLICK_MS) {
      party();
      return;
    }
    hop();
    if (Math.random() < 0.3) {
      setMood("love", 1800);
      sprinkleHearts(3);
    }
    say(PET_LINES[Math.floor(Math.random() * PET_LINES.length)]);
  }, [hop, party, say, setMood, sprinkleHearts, touch, wake]);

  const nap = useCallback(() => {
    setMenuOpen(false);
    mode.current = "sleep";
    setMood("sleep");
    say(PET_COPY.napping);
  }, [say, setMood]);

  const talk = useCallback(() => {
    setMenuOpen(false);
    touch();
    wake();
    say(PET_LINES[Math.floor(Math.random() * PET_LINES.length)]);
  }, [say, touch, wake]);

  // ---- the loop ----------------------------------------------------------------------------------------------
  useEffect(() => {
    const world = () => worldFor(size);
    const place = () => {
      const root = rootRef.current;
      const inner = innerRef.current;
      if (!root || !inner) return;
      root.style.transform = `translate3d(${body.current.x.toFixed(1)}px, ${body.current.y.toFixed(1)}px, 0)`;
      const squashed = performance.now() < squashUntil.current;
      inner.style.transform = `scaleX(${facing.current}) scale(${squashed ? "1.14, 0.86" : "1, 1"})`;
      inner.classList.toggle("wt-pet-walking", mode.current === "walk");
    };

    const w = world();
    body.current = { x: Math.max(w.margin, w.width - size - 28), y: floorY(w), vx: 0, vy: 0 };
    lastActiveAt.current = performance.now();
    nextWanderAt.current = performance.now() + 3500;
    ready.current = true;
    place();

    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ww = world();

      if (mode.current === "fall") {
        const r = stepFalling(body.current, dt, ww);
        const landed = body.current.vy > 300 && r.body.y >= floorY(ww) - 0.5;
        body.current = r.body;
        if (landed) squashUntil.current = now + 140;
        if (r.resting) {
          mode.current = "idle";
          nextWanderAt.current = now + 2500 + Math.random() * 3000;
        }
      } else if (mode.current === "walk") {
        const r = stepWalk(body.current.x, target.current, WALK_SPEED, dt);
        body.current.x = clampX(r.x, ww);
        if (r.direction !== 0) facing.current = r.direction === 1 ? 1 : -1;
        if (r.arrived) {
          mode.current = "idle";
          nextWanderAt.current = now + WANDER_MIN_MS + Math.random() * (WANDER_MAX_MS - WANDER_MIN_MS);
        }
      } else if (mode.current === "idle") {
        if (now - lastActiveAt.current > SLEEP_AFTER_MS) {
          mode.current = "sleep";
          setMood("sleep");
        } else if (!reducedMotion() && now > nextWanderAt.current && moodRef.current === "hello") {
          target.current = pickWanderTarget(body.current.x, ww, Math.random);
          mode.current = "walk";
        }
      }
      place();
    };
    frame = requestAnimationFrame(tick);

    const onResize = () => {
      const nw = world();
      body.current.x = clampX(body.current.x, nw);
      if (mode.current !== "drag") mode.current = "fall";
    };
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    // The eyes follow the pointer (one write per animation frame, straight to CSS variables).
    let pending: { x: number; y: number } | null = null;
    let lookFrame = 0;
    const onPointerMove = (e: PointerEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (lookFrame) return;
      lookFrame = requestAnimationFrame(() => {
        lookFrame = 0;
        const inner = innerRef.current;
        if (!pending || !inner) return;
        const centre = { x: body.current.x + size / 2, y: body.current.y + size / 2 };
        // The inner box is mirrored when the pet faces left, so flip the horizontal look with it.
        const offset = lookOffset(centre, pending);
        inner.style.setProperty("--wt-knot-look-x", `${(offset.x * facing.current).toFixed(2)}px`);
        inner.style.setProperty("--wt-knot-look-y", `${offset.y.toFixed(2)}px`);
      });
    };

    const onPetEvent = (e: Event) => {
      const kind = (e as CustomEvent<PetEventKind>).detail;
      touch();
      if (mode.current === "drag") return;
      wake();
      if (kind === "approve") {
        party();
        say(PET_COPY.approve);
      } else if (kind === "reject") {
        setMood("oops", 1600);
        say(PET_COPY.reject);
      } else if (kind === "undo") {
        setMood("hello");
        hop(480);
        say(PET_COPY.undo);
      } else {
        hop(520);
        say(PET_COPY.success);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener(PET_EVENT, onPetEvent);

    const allTimers = timers.current;
    const hello = window.setTimeout(() => {
      try {
        if (firstName && !sessionStorage.getItem("wt-pet-hello")) {
          sessionStorage.setItem("wt-pet-hello", "1");
          say(PET_COPY.firstHello(firstName));
          hop(520);
        }
      } catch {
        /* storage blocked: skip the hello rather than repeat it on every page */
      }
    }, 1400);
    allTimers.push(hello);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(lookFrame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener(PET_EVENT, onPetEvent);
      allTimers.forEach((t) => window.clearTimeout(t));
      if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
      if (moodTimer.current) window.clearTimeout(moodTimer.current);
    };
    // The loop is built once per pet size; everything it needs changes through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // ---- pointer: drag, throw, click, pet ----------------------------------------------------------------------
  const holdTimer = useRef<number | null>(null);
  const clearHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    touch();
    setMenuOpen(false);
    const wasAsleep = mode.current === "sleep";
    mode.current = "drag";
    body.current.vx = 0;
    body.current.vy = 0;
    drag.current = {
      offX: e.clientX - body.current.x,
      offY: e.clientY - body.current.y,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      petted: false,
      samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
    };
    if (wasAsleep) {
      setMood("hello");
      say(PET_COPY.wake);
    }
    clearHold();
    // Holding still is petting.
    holdTimer.current = window.setTimeout(() => {
      if (mode.current === "drag" && !drag.current.moved) {
        drag.current.petted = true;
        setMood("love");
        sprinkleHearts(4);
        say(PET_COPY.love);
      }
    }, PET_HOLD_MS);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (mode.current !== "drag") return;
    const d = drag.current;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return;
    if (!d.moved) {
      d.moved = true;
      clearHold();
      setMood("held");
    }
    const w = worldFor(size);
    body.current.x = clampX(e.clientX - d.offX, w);
    body.current.y = Math.min(Math.max(0, e.clientY - d.offY), floorY(w));
    d.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (d.samples.length > 12) d.samples.shift();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (mode.current !== "drag") return;
    clearHold();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const d = drag.current;
    if (!d.moved) {
      mode.current = "idle";
      if (d.petted) {
        setMood("hello", 1200);
      } else {
        poke();
      }
      return;
    }
    const v = throwVelocity(d.samples, performance.now());
    body.current.vx = v.vx;
    body.current.vy = v.vy;
    mode.current = "fall";
    setMood("hello");
    if (Math.hypot(v.vx, v.vy) > 900) say(PET_COPY.thrown);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen((open) => !open);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      poke();
    } else if (e.key === "Escape") {
      setMenuOpen(false);
    }
  };

  return {
    rootRef,
    innerRef,
    mood,
    bubble,
    align,
    hearts,
    menuOpen,
    setMenuOpen,
    asleep: mood === "sleep",
    nap,
    talk,
    wake,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onContextMenu, onKeyDown },
  };
}
