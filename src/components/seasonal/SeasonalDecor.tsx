"use client";

import type { CSSProperties, ReactNode } from "react";

import type { SeasonalThemeId } from "@/types/seasonal";

/**
 * The festive artwork: a decorative layer over the whole app that never takes a click (pointer-events none) and keeps to
 * the edges so it never sits on top of what people are reading. Every piece is drawn in CSS/SVG (nothing to download) and
 * stands still for people who prefer reduced motion (see the `wt-deco-*` rules in globals.css).
 */

const BULBS = 22;

/** A string of small lights along the top edge — warm for Diwali, red and green for Christmas. */
function LightString({ colors }: { colors: string[] }) {
  return (
    <div className="wt-deco-lights" aria-hidden>
      <svg className="wt-deco-wire" viewBox="0 0 100 6" preserveAspectRatio="none">
        <path d="M0 1 Q 2.3 5.5 4.5 1 T 9 1 T 13.5 1 T 18 1 T 22.5 1 T 27 1 T 31.5 1 T 36 1 T 40.5 1 T 45 1 T 49.5 1 T 54 1 T 58.5 1 T 63 1 T 67.5 1 T 72 1 T 76.5 1 T 81 1 T 85.5 1 T 90 1 T 94.5 1 T 100 1" fill="none" stroke="currentColor" strokeWidth="0.35" />
      </svg>
      {Array.from({ length: BULBS }, (_, i) => (
        <span
          key={i}
          className="wt-deco-bulb"
          style={
            {
              left: `${(i + 0.5) * (100 / BULBS)}%`,
              top: i % 2 === 0 ? "10px" : "16px",
              "--bulb": colors[i % colors.length],
              animationDelay: `${(i * 0.37) % 2.4}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function Lantern({ className, hue }: { className: string; hue: string }) {
  return (
    <svg className={`wt-deco-sway ${className}`} width="46" height="92" viewBox="0 0 46 92" aria-hidden>
      <line x1="23" y1="0" x2="23" y2="22" stroke="#b45309" strokeWidth="1.5" />
      <rect x="17" y="20" width="12" height="5" rx="2" fill="#92400e" />
      <path d="M23 24 C 4 28 2 58 8 66 L 38 66 C 44 58 42 28 23 24 Z" fill={hue} opacity=".92" />
      <path d="M23 24 C 15 34 15 56 17 66 M23 24 C 31 34 31 56 29 66" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" fill="none" />
      <rect x="12" y="66" width="22" height="5" rx="2" fill="#92400e" />
      <line x1="17" y1="71" x2="17" y2="84" stroke="#f59e0b" strokeWidth="1.4" />
      <line x1="23" y1="71" x2="23" y2="88" stroke="#f59e0b" strokeWidth="1.4" />
      <line x1="29" y1="71" x2="29" y2="84" stroke="#f59e0b" strokeWidth="1.4" />
    </svg>
  );
}

function Diya({ className }: { className: string }) {
  return (
    <svg className={className} width="84" height="64" viewBox="0 0 84 64" aria-hidden>
      <ellipse className="wt-deco-glow" cx="42" cy="28" rx="30" ry="22" fill="#fbbf24" opacity=".28" />
      <path className="wt-deco-flame" d="M42 6 C 34 18 33 26 42 32 C 51 26 50 18 42 6 Z" fill="#f97316" />
      <path className="wt-deco-flame" d="M42 14 C 38 21 38 26 42 29 C 46 26 46 21 42 14 Z" fill="#fde68a" />
      <path d="M8 36 C 10 54 26 60 42 60 C 58 60 74 54 76 36 C 62 42 22 42 8 36 Z" fill="#c2410c" />
      <path d="M8 36 C 22 42 62 42 76 36 C 70 31 14 31 8 36 Z" fill="#ea580c" />
      <circle cx="42" cy="50" r="2.4" fill="#fbbf24" />
    </svg>
  );
}

const SPLASHES: Array<{ cls: string; color: string }> = [
  { cls: "left-[-60px] top-[60px] h-56 w-56", color: "#ec4899" },
  { cls: "left-[40px] top-[-70px] h-48 w-48", color: "#8b5cf6" },
  { cls: "right-[-50px] top-[80px] h-52 w-52", color: "#22c1c3" },
  { cls: "right-[10%] bottom-[-80px] h-56 w-56", color: "#f5c451" },
  { cls: "left-[24%] bottom-[-90px] h-52 w-52", color: "#f97066" },
];

function Powder() {
  return (
    <>
      {SPLASHES.map((s, i) => (
        <span
          key={i}
          aria-hidden
          className={`wt-deco-powder absolute rounded-full ${s.cls}`}
          style={{ background: `radial-gradient(circle at 50% 50%, ${s.color}, transparent 68%)`, animationDelay: `${i * 1.3}s` }}
        />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={`dot-${i}`}
          aria-hidden
          className="wt-deco-float absolute rounded-full"
          style={
            {
              left: `${(i * 37 + 7) % 100}%`,
              top: `${(i * 53 + 11) % 100}%`,
              width: 6 + (i % 4) * 3,
              height: 6 + (i % 4) * 3,
              background: ["#ec4899", "#8b5cf6", "#22c1c3", "#f5c451", "#f97066"][i % 5],
              animationDelay: `${(i % 7) * 0.8}s`,
              animationDuration: `${7 + (i % 5)}s`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

function Snow() {
  return (
    <>
      {Array.from({ length: 26 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="wt-deco-snow absolute top-[-12px] rounded-full"
          style={
            {
              left: `${(i * 41 + 3) % 100}%`,
              width: 3 + (i % 4) * 1.5,
              height: 3 + (i % 4) * 1.5,
              animationDuration: `${9 + (i % 6) * 2}s`,
              animationDelay: `${-(i % 9) * 1.7}s`,
              opacity: 0.55 + (i % 3) * 0.15,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}

function Tree({ className }: { className: string }) {
  return (
    <svg className={className} width="74" height="96" viewBox="0 0 74 96" aria-hidden>
      <path d="M37 4 L 58 34 H 48 L 64 60 H 50 L 68 84 H 6 L 24 60 H 10 L 26 34 H 16 Z" fill="#15803d" />
      <rect x="32" y="84" width="10" height="10" rx="2" fill="#78350f" />
      <polygon points="37,0 39.6,6 46,6.4 41,10.4 42.8,16.6 37,13 31.2,16.6 33,10.4 28,6.4 34.4,6" fill="#fbbf24" />
      {[[30, 34], [44, 46], [26, 60], [48, 68], [36, 76]].map(([x, y], i) => (
        <circle key={i} className="wt-deco-twinkle" cx={x} cy={y} r="3" fill={["#ef4444", "#fbbf24", "#3b82f6", "#ef4444", "#fbbf24"][i]} style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
    </svg>
  );
}

function Cricket({ className }: { className: string }) {
  return (
    <svg className={className} width="150" height="92" viewBox="0 0 150 92" aria-hidden>
      {/* stumps */}
      <g stroke="#d6a45a" strokeWidth="3" strokeLinecap="round">
        <line x1="104" y1="30" x2="104" y2="86" />
        <line x1="116" y1="30" x2="116" y2="86" />
        <line x1="128" y1="30" x2="128" y2="86" />
      </g>
      <line x1="106" y1="29" x2="114" y2="29" stroke="#fbbf24" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="118" y1="29" x2="126" y2="29" stroke="#fbbf24" strokeWidth="2.4" strokeLinecap="round" />
      {/* bat */}
      <g transform="rotate(-24 40 60)">
        <rect x="35" y="6" width="9" height="26" rx="4" fill="#7c4a1d" />
        <path d="M30 30 H 49 L 51 84 Q 40 90 28 84 Z" fill="#e8c27a" />
        <path d="M40 34 V 84" stroke="#b9893e" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

function Ball({ className }: { className: string }) {
  return (
    <svg className={`wt-deco-bounce ${className}`} width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#dc2626" />
      <path d="M5 6 Q 12 12 5 18 M19 6 Q 12 12 19 18" stroke="#fff" strokeOpacity=".85" strokeWidth="1.2" fill="none" strokeDasharray="2 2" />
    </svg>
  );
}

function Layer({ children }: { children: ReactNode }) {
  return <div className="wt-deco-layer pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>{children}</div>;
}

export function SeasonalDecor({ season }: { season: SeasonalThemeId }) {
  switch (season) {
    case "DIWALI":
      return (
        <Layer>
          <LightString colors={["#fbbf24", "#f97316", "#fde68a", "#f59e0b"]} />
          <Lantern className="absolute left-[18%] top-0 hidden sm:block" hue="#ea580c" />
          <Lantern className="absolute right-[14%] top-0 hidden sm:block" hue="#dc2626" />
          <Diya className="absolute bottom-3 right-5 hidden sm:block" />
          <Diya className="absolute bottom-3 right-[7.5rem] hidden scale-75 sm:block" />
        </Layer>
      );
    case "HOLI":
      return (
        <Layer>
          <Powder />
        </Layer>
      );
    case "CHRISTMAS":
      return (
        <Layer>
          <LightString colors={["#ef4444", "#22c55e", "#fbbf24", "#3b82f6"]} />
          <Snow />
          <Tree className="absolute bottom-3 right-5 hidden sm:block" />
          <Tree className="absolute bottom-3 right-[5.5rem] hidden scale-75 sm:block" />
        </Layer>
      );
    case "CRICKET":
      return (
        <Layer>
          <div className="wt-deco-pitch absolute inset-x-0 bottom-0 h-24" />
          <Cricket className="absolute bottom-2 right-4 hidden sm:block" />
          <Ball className="absolute bottom-4 right-[11rem] hidden sm:block" />
        </Layer>
      );
    default:
      return null;
  }
}
