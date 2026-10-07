"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PartyPopper } from "lucide-react";

import { SEASONAL_COPY, SEASONAL_QUERY_KEYS, SEASONAL_THEME_IDS } from "@/constants/seasonal";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SeasonalThemeId } from "@/types/seasonal";

function formatRange(start: string, end: string): string {
  const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Settings → Seasonal look (HR / Admin): switch the festive touches on, and pick which festivals get one. The date does the rest. */
export function SeasonalThemeSettingsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: SEASONAL_QUERY_KEYS.admin,
    queryFn: () => hrmsService.getSeasonalThemeSettings(),
  });
  // UI state: edits not yet saved.
  const [enabled, setEnabled] = useState(false);
  const [themes, setThemes] = useState<SeasonalThemeId[]>([]);

  // Side effect: take on what the server says, whenever it (re)loads.
  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setThemes(data.themes);
  }, [data]);

  const save = useMutation({
    mutationFn: () => hrmsService.updateSeasonalThemeSettings({ enabled, themes }),
    onSuccess: async () => {
      notifySuccess("Seasonal look saved.");
      await queryClient.invalidateQueries({ queryKey: SEASONAL_QUERY_KEYS.current });
      await queryClient.invalidateQueries({ queryKey: SEASONAL_QUERY_KEYS.admin });
    },
    onError: (error) => notifyError(toUserFriendlyApiErrorMessage(error, "Couldn't save the seasonal look.")),
  });

  const dirty = data ? enabled !== data.enabled || themes.slice().sort().join() !== data.themes.slice().sort().join() : false;
  const toggleTheme = (id: SeasonalThemeId) =>
    setThemes((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  return (
    <section className="rounded-3xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm dark:bg-wt-surface-2 dark:shadow-none sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <PartyPopper className="size-4 text-[var(--wt-brand)]" />
        <h2 className="text-sm font-semibold text-wt-text">Seasonal look</h2>
        <span className="ml-auto text-[11px] text-wt-text-faint">HR / Admin</span>
      </div>
      <p className="mb-4 text-xs text-wt-text-muted">
        A subtle festive touch — a coloured ribbon across the top and a greeting on Home. Off until you switch it on; the date decides
        which one appears, and anyone can turn it off for themselves in their own settings.
      </p>

      {isLoading || !data ? (
        <p className="text-sm text-wt-text-muted">Loading…</p>
      ) : (
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-wt-border bg-wt-surface-2/50 px-4 py-3.5 dark:bg-black/20">
            <span>
              <span className="block text-sm font-medium text-wt-text">Show the seasonal look</span>
              <span className="block text-xs text-wt-text-muted">
                {data.active ? `Showing now: ${SEASONAL_COPY[data.active].label}` : "Nothing is in season right now"}
              </span>
            </span>
            <input type="checkbox" className="size-4 accent-[var(--wt-brand)]" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          </label>

          <div className={cn("grid gap-2 sm:grid-cols-2", !enabled && "opacity-50")}>
            {SEASONAL_THEME_IDS.map((id) => (
              <label key={id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-1 px-3 py-3 dark:bg-wt-surface-3">
                <span>
                  <span className="block text-sm font-medium text-wt-text">{SEASONAL_COPY[id].label}</span>
                  <span className="block text-xs text-wt-text-muted">{SEASONAL_COPY[id].blurb}</span>
                </span>
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--wt-brand)]"
                  checked={themes.includes(id)}
                  disabled={!enabled}
                  onChange={() => toggleTheme(id)}
                />
              </label>
            ))}
          </div>

          {data.upcoming.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-wt-text-faint">Coming up</p>
              <ul className="space-y-1 text-sm text-wt-text-muted">
                {data.upcoming.map((w) => (
                  <li key={`${w.theme}-${w.start}`} className="flex items-center justify-between gap-3">
                    <span className={cn(!w.enabled && "line-through opacity-60")}>{w.label}</span>
                    <span className="tabular-nums text-xs">{formatRange(w.start, w.end)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-wt-text-faint">Preview any look on your own screen by adding ?season=diwali (or holi, christmas, cricket) to the address.</p>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="button" variant="brand" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
