"use client";

import { useEffect, useMemo, useRef } from "react";
import { Cake, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { fireConfetti } from "@/lib/confetti";
import { useCelebrationsQuery, useReactToCelebration } from "@/hooks/celebrations/useCelebrations";
import type { CelebrationEntry, CelebrationKind } from "@/services/hrms.service";

const REACTION_EMOJIS = ["🎉", "🎂", "❤️", "🥳"];

type TodayEntry = CelebrationEntry & { kind: CelebrationKind };

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

function ReactionBar({ entry }: { entry: TodayEntry }) {
  const react = useReactToCelebration();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {REACTION_EMOJIS.map((emoji) => {
        const count = entry.reactions.find((r) => r.emoji === emoji)?.count ?? 0;
        const mine = entry.my_reaction === emoji;
        return (
          <button
            key={emoji}
            type="button"
            disabled={react.isPending}
            onClick={() =>
              react.mutate({
                celebrant_user_id: entry.user_id,
                kind: entry.kind,
                occurrence_year: entry.occurrence_year,
                emoji,
              })
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              mine
                ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
                : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:bg-wt-surface-2"
            )}
            aria-pressed={mine}
            aria-label={`React with ${emoji}`}
          >
            <span>{emoji}</span>
            {count > 0 ? <span className="tabular-nums">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function TodayRow({ entry }: { entry: TodayEntry }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-wt-border bg-wt-surface-1/80 px-3.5 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-wt-surface-3 text-[11px] font-semibold text-wt-text-muted">
          {initials(entry.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-wt-text">{entry.name}</p>
          <p className="flex items-center gap-1 text-xs text-wt-text-muted">
            {entry.kind === "birthday" ? (
              <Cake className="size-3 text-rose-500" aria-hidden />
            ) : (
              <PartyPopper className="size-3 text-[var(--wt-brand)]" aria-hidden />
            )}
            {entry.kind === "birthday"
              ? "Birthday today"
              : `${entry.years} year${entry.years === 1 ? "" : "s"} today`}
          </p>
        </div>
      </div>
      <ReactionBar entry={entry} />
    </li>
  );
}

export function TodaysCelebrationsBanner() {
  const { user } = useAuth();
  const { data, isLoading } = useCelebrationsQuery();
  const firedConfettiRef = useRef(false);

  const todays = useMemo<TodayEntry[]>(() => {
    if (!data) return [];
    const merged: TodayEntry[] = [
      ...data.birthdays.map((e) => ({ ...e, kind: "birthday" as const })),
      ...data.anniversaries.map((e) => ({ ...e, kind: "anniversary" as const })),
    ];
    return merged.filter((e) => e.days_until === 0);
  }, [data]);

  const myEntry = useMemo(
    () => todays.find((e) => e.email.toLowerCase() === (user?.email ?? "").toLowerCase()),
    [todays, user?.email]
  );

  useEffect(() => {
    if (!myEntry || firedConfettiRef.current) return;
    const storageKey = `wt-celebration-confetti-${myEntry.kind}-${myEntry.user_id}-${myEntry.occurrence_year}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Private browsing / blocked storage — fire anyway, just without the once-per-session guard.
    }
    firedConfettiRef.current = true;
    fireConfetti({ originYRatio: 0.18, particleCount: 220 });
  }, [myEntry]);

  if (isLoading || todays.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-[var(--wt-brand)]/25 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--wt-brand)_10%,var(--wt-surface-1)),var(--wt-surface-1)_60%)] p-5 shadow-sm">
      {myEntry ? (
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--wt-brand)] text-white shadow-sm">
            {myEntry.kind === "birthday" ? (
              <Cake className="size-5" aria-hidden />
            ) : (
              <PartyPopper className="size-5" aria-hidden />
            )}
          </span>
          <div>
            <p className="text-base font-semibold text-wt-text">
              {myEntry.kind === "birthday"
                ? "Happy Birthday!"
                : `Happy ${myEntry.years}-Year Work Anniversary!`}
            </p>
            <p className="text-sm text-wt-text-muted">
              Wishing you a great one — from everyone at WebTrak.
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm font-semibold text-wt-text">Today&apos;s Celebrations</p>
      )}

      <ul className="space-y-2">
        {todays.map((entry) => (
          <TodayRow key={`${entry.kind}-${entry.user_id}`} entry={entry} />
        ))}
      </ul>
    </div>
  );
}
