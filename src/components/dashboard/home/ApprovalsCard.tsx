"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CardEmpty, CardMessage, CardSkeleton, HomeCard } from "@/components/dashboard/home/HomeCard";
import { HOME_APPROVALS_COPY, HOME_APPROVALS_MAX_ROWS, HOME_APPROVALS_QUERY_KEY, HOME_APPROVALS_TABS, type HomeApprovalsTab } from "@/constants/homeCards";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { giveFeedback } from "@/lib/feedback";
import { notifyError, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { formatUserRequestTypeLabel } from "@/utils/actionToast";
import { approvalTab, canApproveInline } from "@/utils/homePendingApprovals";
import type { PendingApprovalItem } from "@/utils/homePendingApprovals";
import { formatShortRange } from "@/utils/shortDateRange";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { updateUserRequestStatus } from "@/utils/userRequest";
import { CheckCircle2 } from "lucide-react";

const TYPE_CHIP: Record<Exclude<HomeApprovalsTab, "all">, string> = {
  comp_off: "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]",
  wfh: "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300",
  leave: "bg-amber-500/14 text-amber-800 dark:text-amber-300",
};
const AVATAR_TONE = ["bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]", "bg-emerald-500/14 text-emerald-800 dark:text-emerald-300", "bg-amber-500/16 text-amber-800 dark:text-amber-300", "bg-violet-500/14 text-violet-800 dark:text-violet-300"] as const;

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

function PendingRow({ item, onApproved }: { item: PendingApprovalItem; onApproved: () => void }) {
  // UI state: whether the approve call is in flight.
  const [busy, setBusy] = useState(false);
  const tab = approvalTab(item.type);
  const range = item.start && item.end ? formatShortRange(item.start, item.end) : item.from;
  const tone = AVATAR_TONE[item.requester.length % AVATAR_TONE.length];
  const reviewHref = DASHBOARD_ROUTES["leave-team"];
  const inline = canApproveInline(item.type);

  const approve = async () => {
    setBusy(true);
    try {
      await updateUserRequestStatus(Number(item.id), "APPROVED");
      giveFeedback("approve");
      notifySuccess(HOME_APPROVALS_COPY.approved);
      onApproved();
    } catch (error) {
      notifyError(toUserFriendlyApiErrorMessage(error, HOME_APPROVALS_COPY.approveFailed));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex items-center gap-3.5 border-t border-wt-border py-3.5 first:border-t-0">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold", tone)} aria-hidden>
        {initials(item.requester)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-wt-text">{item.requester}</span>
        <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-wt-text-muted">
          {tab !== "all" ? <span className={cn("rounded-md px-2 py-0.5 text-[13px] font-medium", TYPE_CHIP[tab])}>{formatUserRequestTypeLabel(item.type, item.isHalfDay)}</span> : <span>{formatUserRequestTypeLabel(item.type, item.isHalfDay)}</span>}
          <span className="truncate">{range}</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Link href={reviewHref} className="inline-flex h-10 items-center rounded-xl border border-wt-border bg-wt-surface-1 px-4 text-sm font-medium text-wt-text hover:bg-wt-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]" title={HOME_APPROVALS_COPY.declineHint}>
          {HOME_APPROVALS_COPY.decline}
        </Link>
        {inline ? (
          <button
            type="button"
            disabled={busy}
            onClick={approve}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--wt-brand-soft)] px-4 text-sm font-semibold text-[var(--wt-brand)] transition-colors hover:bg-[color-mix(in_srgb,var(--wt-brand)_18%,white)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
            {HOME_APPROVALS_COPY.approve}
          </button>
        ) : (
          <Link href={reviewHref} className="inline-flex h-10 items-center rounded-xl bg-[var(--wt-brand-soft)] px-4 text-sm font-semibold text-[var(--wt-brand)] hover:bg-[color-mix(in_srgb,var(--wt-brand)_18%,white)]">
            {HOME_APPROVALS_COPY.review}
          </Link>
        )}
      </span>
    </li>
  );
}

/** Approvers: what is waiting for a decision — filter by kind, and approve right here; declining (which needs a reason) opens the full review. */
export function ApprovalsCard({ status, count, items }: { status: "loading" | "done" | "error"; count: number | null; items: readonly PendingApprovalItem[] }) {
  const queryClient = useQueryClient();
  // UI state: which tab of kinds is selected.
  const [tab, setTab] = useState<HomeApprovalsTab>("all");
  const filtered = useMemo(() => (tab === "all" ? items : items.filter((i) => approvalTab(i.type) === tab)), [items, tab]);
  const shown = filtered.slice(0, HOME_APPROVALS_MAX_ROWS);
  const rest = (count ?? items.length) - shown.length;

  return (
    <HomeCard
      title={HOME_APPROVALS_COPY.title}
      featured={Boolean(count)}
      titleBadge={
        count ? (
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[var(--wt-brand)] px-2 text-[13px] font-semibold tabular-nums text-[var(--wt-brand-text)]" aria-label={`${count} pending`}>
            {count}
          </span>
        ) : null
      }
      headerRight={
        count ? (
          <div role="tablist" aria-label="Kind of request" className="inline-flex shrink-0 rounded-xl bg-wt-surface-3 p-1">
            {HOME_APPROVALS_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn("rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors", tab === t.id ? "bg-wt-surface-1 text-wt-text shadow-[var(--wt-shadow-sm)]" : "text-wt-text-muted hover:text-wt-text")}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : undefined
      }
    >
      {status === "loading" ? (
        <CardSkeleton />
      ) : status === "error" || count === null ? (
        <CardMessage text={HOME_APPROVALS_COPY.unavailable} />
      ) : count === 0 ? (
        <CardEmpty icon={<CheckCircle2 className="size-5 text-emerald-600" />} title={HOME_APPROVALS_COPY.allCaughtUp} hint={HOME_APPROVALS_COPY.allCaughtUpHint} />
      ) : (
        <div className="-mt-2">
          {shown.length === 0 ? (
            <p className="py-6 text-center text-sm text-wt-text-muted">{HOME_APPROVALS_COPY.nothingOfKind}</p>
          ) : (
            <ul>
              {shown.map((item) => (
                <PendingRow key={item.id} item={item} onApproved={() => void queryClient.invalidateQueries({ queryKey: HOME_APPROVALS_QUERY_KEY })} />
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-wt-border pt-3.5 text-sm">
            <span className="text-wt-text-muted">{rest > 0 ? HOME_APPROVALS_COPY.moreInQueue(rest) : ""}</span>
            <Link href={DASHBOARD_ROUTES["leave-team"]} className="inline-flex items-center gap-1 font-semibold text-[var(--wt-brand)] hover:underline">
              {HOME_APPROVALS_COPY.reviewAll}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </HomeCard>
  );
}
