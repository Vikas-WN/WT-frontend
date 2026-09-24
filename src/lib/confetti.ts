"use client";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  size: number;
  color: string;
  shape: "rect" | "circle";
  life: number;
};

const COLORS = ["#5b8def", "#f97066", "#f5c451", "#3ccb7f", "#a78bfa", "#22c1c3"];

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function makeParticles(count: number, originX: number, originY: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.random() * Math.PI) / 1.3 + Math.PI / 2 - Math.PI / 5.2;
    const speed = 4 + Math.random() * 7;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
      vy: -Math.abs(Math.sin(angle) * speed) - 2,
      rotation: Math.random() * 360,
      vr: (Math.random() - 0.5) * 14,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() < 0.5 ? "rect" : "circle",
      life: 1,
    });
  }
  return particles;
}

/**
 * Lightweight, dependency-free confetti burst. Draws to a full-viewport
 * canvas overlay for ~2s, then tears itself down. No-ops under
 * prefers-reduced-motion or during SSR.
 */
export function fireConfetti(options?: { originYRatio?: number; particleCount?: number }): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (prefersReducedMotion()) return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "2147483647";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const originY = window.innerHeight * (options?.originYRatio ?? 0.25);
  const particles = [
    ...makeParticles(Math.round((options?.particleCount ?? 140) / 2), window.innerWidth * 0.22, originY),
    ...makeParticles(Math.round((options?.particleCount ?? 140) / 2), window.innerWidth * 0.78, originY),
  ];

  const gravity = 0.16;
  const drag = 0.992;
  const duration = 2200;
  const start = performance.now();
  let frameId = 0;

  function frame(now: number) {
    const elapsed = now - start;
    ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.vy += gravity;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      p.life = Math.max(0, 1 - elapsed / duration);

      ctx!.save();
      ctx!.globalAlpha = p.life;
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx!.fillRect(-p.size / 2, -p.size / 3, p.size, (p.size * 2) / 3);
      } else {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    if (elapsed < duration) {
      frameId = window.requestAnimationFrame(frame);
    } else {
      window.cancelAnimationFrame(frameId);
      canvas.remove();
    }
  }

  frameId = window.requestAnimationFrame(frame);
}
