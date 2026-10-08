"use client";

import { useEffect, useState } from "react";

import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HOME_LEAVE_CARD, HOME_LEAVE_ENTITLEMENT, LEAVE_COLORS } from "@/constants/homeLeaveCard";
import { formatBalanceDays } from "@/utils/leaveRequestDisplay";

const SIZE = 132;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3; // a hairline of space between the two colours

/** How much of the yearly entitlement is left, as a ring split into primary and secondary. The balance sits in the middle. */
export function LeaveRing({ primary, secondary, balance }: { primary: number; secondary: number; balance: number }) {
  // UI state: flips to true one frame after mount so the arcs grow from empty (a CSS transition needs a "before" value).
  const [drawn, setDrawn] = useState(false);
  // Side effect: schedules that one frame; there is no render-time equivalent.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const scale = Math.max(HOME_LEAVE_ENTITLEMENT, primary + secondary, 1);
  const primaryLen = (Math.max(0, primary) / scale) * CIRCUMFERENCE;
  const secondaryLen = (Math.max(0, secondary) / scale) * CIRCUMFERENCE;
  const arc = (len: number, offset: number, color: string) => (
    <circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeDasharray={`${drawn ? Math.max(0, len - GAP) : 0} ${CIRCUMFERENCE}`}
      strokeDashoffset={-offset}
      className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-[900ms] motion-safe:ease-out"
    />
  );

  return (
    <div
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={HOME_LEAVE_CARD.ringLabel(formatBalanceDays(balance).amount, String(HOME_LEAVE_ENTITLEMENT))}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-wt-surface-3" />
        {primaryLen > 0 ? arc(primaryLen, 0, LEAVE_COLORS.primary.stroke) : null}
        {secondaryLen > 0 ? arc(secondaryLen, primaryLen, LEAVE_COLORS.secondary.stroke) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-semibold leading-none tabular-nums tracking-tight text-wt-text">
          <AnimatedNumber value={balance} decimals={Number.isInteger(balance) ? 0 : 1} />
        </span>
        <span className="mt-1 text-[11px] font-medium text-wt-text-muted">{HOME_LEAVE_CARD.ringCaption}</span>
      </div>
    </div>
  );
}
