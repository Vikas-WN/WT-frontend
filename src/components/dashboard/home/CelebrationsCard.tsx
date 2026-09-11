"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Cake, PartyPopper, Sparkles } from "lucide-react";

import { HomeCard, CardMessage, CardSkeleton } from "@/components/dashboard/home/HomeCard";
import {
  MODAL_BODY_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { Button } from "@/components/ui/button";
import type { CelebrationEntry, CelebrationsData } from "@/services/hrms.service";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Kind = "birthday" | "anniversary";
type MergedEntry = CelebrationEntry & { kind: Kind };

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

function relativeLabel(daysUntil: number, nextDate: string): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil <= 6) return `In ${daysUntil} days`;
  const d = new Date(`${nextDate}T00:00:00`);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function KindIcon({ kind }: { kind: Kind }) {
  return kind === "birthday" ? (
    <Cake className="size-4 text-rose-500" aria-hidden />
  ) : (
    <PartyPopper className="size-4 text-[var(--wt-brand)]" aria-hidden />
  );
}

function EntryRow({ entry }: { entry: MergedEntry }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-wt-surface-3 text-[11px] font-semibold text-wt-text-muted">
        {initials(entry.name)}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-wt-text">{entry.name}</span>
      {entry.kind === "anniversary" && entry.years ? (
        <span className="shrink-0 rounded-md bg-[var(--wt-brand-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--wt-brand)]">
          {entry.years} yr{entry.years === 1 ? "" : "s"}
        </span>
      ) : null}
      <KindIcon kind={entry.kind} />
      <span className="w-16 shrink-0 text-right text-xs text-wt-text-muted">
        {relativeLabel(entry.days_until, entry.next_date)}
      </span>
    </li>
  );
}

function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

function CelebrationsDialog({
  open,
  merged,
  onClose,
}: {
  open: boolean;
  merged: MergedEntry[];
  onClose: () => void;
}) {
  useEscapeToClose(open, onClose);
  const currentMonthRef = useRef<HTMLDivElement>(null);
  const currentMonth = new Date().getMonth() + 1;

  const byMonth = useMemo(() => {
    const map = new Map<number, MergedEntry[]>();
    for (const e of merged) {
      const list = map.get(e.month) ?? [];
      list.push(e);
      map.set(e.month, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.day - b.day || a.name.localeCompare(b.name));
    }
    return map;
  }, [merged]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      currentMonthRef.current?.scrollIntoView({ block: "start" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(MODAL_OVERLAY_CLASS, "z-[110]")}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebrations-dialog-title"
        className={cn(MODAL_PANEL_CLASS, "max-w-lg")}
      >
        <div className={cn(MODAL_HEADER_CLASS, "flex items-center justify-between gap-3")}>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div>
              <h2 id="celebrations-dialog-title" className="text-base font-semibold text-wt-text">
                Celebrations
              </h2>
              <p className="text-xs text-wt-text-muted">Birthdays and work anniversaries, by month</p>
            </div>
          </div>
        </div>

        <div className={MODAL_BODY_CLASS}>
          {byMonth.size === 0 ? (
            <p className="py-8 text-center text-sm text-wt-text-muted">
              No birthdays or anniversaries on file yet.
            </p>
          ) : (
            <div className="space-y-5">
              {MONTHS.map((label, idx) => {
                const monthNum = idx + 1;
                const rows = byMonth.get(monthNum);
                if (!rows?.length) return null;
                const isCurrent = monthNum === currentMonth;
                return (
                  <div key={label} ref={isCurrent ? currentMonthRef : undefined}>
                    <p
                      className={cn(
                        "mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide",
                        isCurrent ? "text-[var(--wt-brand)]" : "text-wt-text-faint"
                      )}
                    >
                      {label}
                      {isCurrent ? (
                        <span className="rounded-full bg-[var(--wt-brand-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--wt-brand)]">
                          This month
                        </span>
                      ) : null}
                    </p>
                    <ul className="space-y-2 rounded-xl border border-wt-border bg-wt-surface-1 p-3">
                      {rows.map((entry) => (
                        <EntryRow key={`${entry.kind}-${entry.emp_id ?? entry.name}`} entry={entry} />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-wt-border px-5 py-4 sm:px-7 dark:border-wt-border/80">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function CelebrationsCard({
  data,
  status,
}: {
  data: CelebrationsData | null;
  status: "loading" | "done" | "error";
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const merged = useMemo<MergedEntry[]>(() => {
    const birthdays = (data?.birthdays ?? []).map((e) => ({ ...e, kind: "birthday" as const }));
    const anniversaries = (data?.anniversaries ?? []).map((e) => ({
      ...e,
      kind: "anniversary" as const,
    }));
    return [...birthdays, ...anniversaries].sort((a, b) => a.days_until - b.days_until);
  }, [data]);

  const upcoming = merged.slice(0, 4);

  return (
    <HomeCard
      title="Celebrations"
      icon={<Cake className="size-4" />}
      cta="View all"
      onAction={() => setDialogOpen(true)}
    >
      {status === "loading" ? (
        <CardSkeleton />
      ) : status === "error" ? (
        <CardMessage text="Unavailable" />
      ) : upcoming.length === 0 ? (
        <p className="text-sm text-wt-text-muted">No birthdays or anniversaries coming up.</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((entry) => (
            <EntryRow key={`${entry.kind}-${entry.emp_id ?? entry.name}`} entry={entry} />
          ))}
        </ul>
      )}

      <CelebrationsDialog open={dialogOpen} merged={merged} onClose={() => setDialogOpen(false)} />
    </HomeCard>
  );
}
