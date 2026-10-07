"use client";

/**
 * Sparks and powder at any point on the screen — crackers and rockets for Diwali, colour for Holi. One shared full-screen canvas that
 * exists only while something is flying, and is skipped entirely for people who prefer reduced motion.
 */

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  age: number;
  life: number;
  gravity: number;
  trail: boolean;
  powder: boolean;
};

type Rocket = { x: number; y: number; vy: number; targetY: number; colors: string[]; count: number; speed: number; trail: Spark[] };

export const DIWALI_COLORS = ["#f59e0b", "#f97316", "#ef4444", "#eab308", "#ec4899", "#8b5cf6"];
export const HOLI_COLORS = ["#ec4899", "#8b5cf6", "#22c1c3", "#f5c451", "#f97066", "#3ccb7f"];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let frame = 0;
let last = 0;
const sparks: Spark[] = [];
const rockets: Rocket[] = [];

function reduced(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function ensureCanvas(): boolean {
  if (canvas && ctx) return true;
  const el = document.createElement("canvas");
  el.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483646";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  el.width = window.innerWidth * dpr;
  el.height = window.innerHeight * dpr;
  const c = el.getContext("2d");
  if (!c) return false;
  c.scale(dpr, dpr);
  document.body.appendChild(el);
  canvas = el;
  ctx = c;
  return true;
}

function release() {
  cancelAnimationFrame(frame);
  frame = 0;
  canvas?.remove();
  canvas = null;
  ctx = null;
}

function step(now: number) {
  if (!ctx || !canvas) return;
  const dt = Math.min(0.05, (now - last) / 1000) * 60; // in 60 fps frames
  last = now;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = rockets.length - 1; i >= 0; i -= 1) {
    const r = rockets[i];
    r.y += r.vy * dt;
    r.vy *= 0.985;
    sparks.push({ x: r.x + (Math.random() - 0.5) * 2, y: r.y, vx: (Math.random() - 0.5) * 0.6, vy: 0.8 + Math.random() * 0.8, color: "#f59e0b", size: 2.2, age: 0, life: 24, gravity: 0.02, trail: false, powder: false });
    ctx.fillStyle = "#ea580c";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (r.y <= r.targetY || Math.abs(r.vy) < 1.2) {
      rockets.splice(i, 1);
      explode(r.x, r.y, r.colors, r.count, r.speed);
    }
  }

  for (let i = sparks.length - 1; i >= 0; i -= 1) {
    const s = sparks[i];
    s.age += dt;
    if (s.age >= s.life) {
      sparks.splice(i, 1);
      continue;
    }
    s.vy += s.gravity * dt;
    s.vx *= 0.985;
    s.vy *= 0.985;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    const alpha = Math.max(0, 1 - s.age / s.life);
    ctx.globalAlpha = s.powder ? alpha * 0.8 : alpha;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.powder ? s.size * (1 + s.age / s.life) : s.size * (0.5 + alpha / 2), 0, Math.PI * 2);
    ctx.fill();
    if (s.trail) {
      ctx.globalAlpha = alpha * 0.4;
      ctx.beginPath();
      ctx.arc(s.x - s.vx * 1.6, s.y - s.vy * 1.6, s.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  if (sparks.length || rockets.length) frame = requestAnimationFrame(step);
  else release();
}

function run() {
  if (frame) return;
  last = performance.now();
  frame = requestAnimationFrame(step);
}

function explode(x: number, y: number, colors: string[], count: number, speed: number) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
    const power = speed * (0.45 + Math.random() * 0.65);
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power,
      color: colors[i % colors.length],
      size: 2 + Math.random() * 1.6,
      age: 0,
      life: 42 + Math.random() * 26,
      gravity: 0.09,
      trail: true,
      powder: false,
    });
  }
}

/** A ring of sparks at (x, y) — a cracker going off. */
export function burstSparks(options: { x: number; y: number; colors?: string[]; count?: number; speed?: number }): void {
  if (typeof window === "undefined" || reduced() || !ensureCanvas()) return;
  explode(options.x, options.y, options.colors ?? DIWALI_COLORS, options.count ?? 54, options.speed ?? 5.2);
  run();
}

/** A rocket that climbs from (x, y) to `targetY` and bursts. */
export function launchRocket(options: { x: number; y: number; targetY: number; colors?: string[]; count?: number }): void {
  if (typeof window === "undefined" || reduced() || !ensureCanvas()) return;
  rockets.push({ x: options.x, y: options.y, vy: -9.5, targetY: options.targetY, colors: options.colors ?? DIWALI_COLORS, count: options.count ?? 72, speed: 6.2, trail: [] });
  run();
}

/** A soft cloud of coloured powder at (x, y) — Holi. */
export function throwPowder(options: { x: number; y: number; colors?: string[]; count?: number }): void {
  if (typeof window === "undefined" || reduced() || !ensureCanvas()) return;
  const colors = options.colors ?? HOLI_COLORS;
  const count = options.count ?? 70;
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const power = 1.2 + Math.random() * 4.2;
    sparks.push({
      x: options.x,
      y: options.y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power - 1.5,
      color: colors[i % colors.length],
      size: 4 + Math.random() * 5,
      age: 0,
      life: 60 + Math.random() * 40,
      gravity: 0.03,
      trail: false,
      powder: true,
    });
  }
  run();
}
