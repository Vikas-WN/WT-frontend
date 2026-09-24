"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, UserRoundX, Layers3, Inbox } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import { hrmsService, type ActionCenterItem } from "@/services/hrms.service";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";

const KIND_META: Record<
  ActionCenterItem["kind"],
  { label: string; icon: React.ReactNode; tone: string }
> = {
  LEAVE_REQUEST: {
    label: "Leave / WFH",
    icon: <CalendarClock className="size-4" />,
    tone: "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]",
  },
  COMP_OFF: {
    label: "Comp Off",
    icon: <Layers3 className="size-4" />,
    tone: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  },
  ALLOCATION_EXTENSION: {
    label: "Allocation Extension",
    icon: <Layers3 className="size-4" />,
    tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  EXIT_SURVEY: {
    label: "Exit Survey",
    icon: <UserRoundX className="size-4" />,
    tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
};

const FILTER_OPTIONS: Array<{ value: "ALL" | ActionCenterItem["kind"]; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "LEAVE_REQUEST", label: "Leave / WFH" },
  { value: "COMP_OFF", label: "Comp Off" },
  { value: "ALLOCATION_EXTENSION", label: "Allocation Extension" },
  { value: "EXIT_SURVEY", label: "Exit Survey" },
];

function ActionItemRow({ item }: { item: ActionCenterItem }) {
  const meta = KIND_META[item.kind];
  const content = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-2/40 px-4 py-3 transition-colors hover:bg-wt-surface-2/70">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", meta.tone)}>
          {meta.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-wt-text">{item.title}</p>
          <p className="truncate text-xs text-wt-text-muted">
            {item.employee_name} · {item.detail}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-wt-surface-3 px-2 py-0.5 text-[11px] font-medium text-wt-text-muted">
          {meta.label}
        </span>
        {item.created_at ? (
          <span className="hidden text-xs text-wt-text-muted sm:inline">
            {formatApiDateTimeDisplay(item.created_at)}
          </span>
        ) : null}
      </div>
    </div>
  );
  return item.action_url ? (
    <Link href={item.action_url} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export function ActionCenterPageClient() {
  const [filter, setFilter] = useState<"ALL" | ActionCenterItem["kind"]>("ALL");

  const itemsQ = useQuery({
    queryKey: ["action-center", "items"],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await hrmsService.getActionCenterItems();
      return res.data ?? null;
    },
  });

  const data = itemsQ.data;
  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (filter === "ALL") return data.items;
    return data.items.filter((item) => item.kind === filter);
  }, [data, filter]);

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Home"
        title="Action Center"
        description="Everything that needs your action, in one place — pending approvals, extension requests, and upcoming exit surveys."
      />
      {itemsQ.isLoading ? (
        <SectionLoading label="Loading action items…" />
      ) : itemsQ.isError ? (
        <EmptyState title="Could not load action items" description="Please retry in a moment." className="py-10" />
      ) : !data || data.total === 0 ? (
        <EmptyState
          title="All caught up"
          description="Nothing needs your action right now."
          className="py-14"
        />
      ) : (
        <div className={cn("flex flex-col gap-4 p-5 sm:p-6", CONTENT_CARD_CLASS)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Inbox className="size-4 text-[var(--wt-brand)]" />
              <p className="text-sm font-semibold text-wt-text">{data.total} item{data.total === 1 ? "" : "s"}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === opt.value
                      ? "bg-[var(--wt-brand)] text-white"
                      : "bg-wt-surface-2 text-wt-text-muted hover:bg-wt-surface-3"
                  )}
                >
                  {opt.label}
                  {opt.value !== "ALL" && data.by_kind[opt.value] ? ` (${data.by_kind[opt.value]})` : ""}
                </button>
              ))}
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-wt-text-muted">Nothing in this filter.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredItems.map((item, index) => (
                <ActionItemRow key={`${item.kind}-${item.request_id ?? item.employee_email}-${index}`} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardPageShell>
  );
}
