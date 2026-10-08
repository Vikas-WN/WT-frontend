"use client";

import { CheckCircle2, ChevronRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { CardEmpty, CardMessage, CardSkeleton, HomeCard } from "@/components/dashboard/home/HomeCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HOME_APPROVALS_COPY, HOME_APPROVALS_MAX_ROWS } from "@/constants/homeCards";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { formatUserRequestTypeLabel } from "@/utils/actionToast";
import type { PendingApprovalItem } from "@/utils/homePendingApprovals";
import { formatShortRange } from "@/utils/shortDateRange";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function PendingRow({ item }: { item: PendingApprovalItem }) {
  const range = item.start && item.end ? formatShortRange(item.start, item.end) : item.from;
  return (
    <li>
      <Link
        href={DASHBOARD_ROUTES["leave-team"]}
        className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-[var(--wt-duration)] hover:bg-[var(--wt-brand)]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-wt-surface-1 text-[11px] font-semibold text-[var(--wt-brand)] shadow-[var(--wt-shadow-sm)]" aria-hidden>
          {initials(item.requester)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-wt-text">{item.requester}</span>
          <span className="block truncate text-xs text-wt-text-muted">
            {formatUserRequestTypeLabel(item.type, item.isHalfDay)} · {range}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-wt-text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}

/** Approvers: how many requests are waiting, and the soonest few, each one tap from the review screen. */
export function ApprovalsCard({ status, count, items }: { status: "loading" | "done" | "error"; count: number | null; items: readonly PendingApprovalItem[] }) {
  const shown = items.slice(0, HOME_APPROVALS_MAX_ROWS);
  return (
    <HomeCard
      title={HOME_APPROVALS_COPY.title}
      tone="amber"
      icon={<ClipboardCheck className="size-4" />}
      href={DASHBOARD_ROUTES["leave-team"]}
      cta={HOME_APPROVALS_COPY.cta}
      featured={Boolean(count)}
    >
      {status === "loading" ? (
        <CardSkeleton />
      ) : status === "error" || count === null ? (
        <CardMessage text={HOME_APPROVALS_COPY.unavailable} />
      ) : count === 0 ? (
        <CardEmpty icon={<CheckCircle2 className="size-[18px] text-emerald-600" />} title={HOME_APPROVALS_COPY.allCaughtUp} hint={HOME_APPROVALS_COPY.allCaughtUpHint} />
      ) : (
        <div>
          <p className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold leading-none tabular-nums tracking-tight text-wt-text">
              <AnimatedNumber value={count} />
            </span>
            <span className="text-sm text-wt-text-muted">{HOME_APPROVALS_COPY.awaiting(count)}</span>
          </p>
          <ul className="mt-3 space-y-0.5">
            {shown.map((item) => (
              <PendingRow key={item.id} item={item} />
            ))}
          </ul>
          {count > shown.length ? <p className="mt-1.5 px-2 text-xs font-medium text-wt-text-faint">{HOME_APPROVALS_COPY.moreRequests(count - shown.length)}</p> : null}
        </div>
      )}
    </HomeCard>
  );
}
