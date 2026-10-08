"use client";

import { ChevronDown, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { BUG_CONTEXT_COPY as COPY } from "@/constants/bugReports";
import type { BugContext } from "@/types/bugContext";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-xs">
      <dt className="w-20 shrink-0 text-wt-text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-wt-text">{value}</dd>
    </div>
  );
}

/** The technical details that will go with the report — a checkbox to leave them out, and a way to see exactly what they are. */
export function BugContextSummary({ context, included, onIncludedChange }: { context: BugContext; included: boolean; onIncludedChange: (next: boolean) => void }) {
  // UI state: whether the full list is expanded.
  const [open, setOpen] = useState(false);
  const when = new Date(context.captured_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
  const { recent } = context;
  return (
    <div className="rounded-xl bg-wt-surface-2 px-3.5 py-3">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input type="checkbox" checked={included} onChange={(e) => onIncludedChange(e.target.checked)} className="mt-0.5 size-4 accent-[var(--wt-brand)]" />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-medium text-wt-text">
            <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
            {COPY.include}
          </span>
          <span className="mt-0.5 block text-xs text-wt-text-muted">{COPY.includeHint}</span>
        </span>
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--wt-brand)] hover:underline"
      >
        {open ? COPY.hide : COPY.show}
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <dl className="mt-2 space-y-1.5 border-t border-wt-border pt-2">
          <Row label={COPY.captured} value={`${when} (${context.time_zone})`} />
          <Row label={COPY.page} value={context.page.url} />
          <Row label={COPY.browser} value={context.browser.user_agent} />
          <Row label={COPY.screen} value={`${context.display.viewport} window, ${context.display.screen} screen, ${context.display.pixel_ratio}x`} />
          <Row label={COPY.network} value={`${context.network.online ? "online" : "offline"}${context.network.type ? ` · ${context.network.type}` : ""}`} />
          <Row label={COPY.recent} value={COPY.recentSummary(recent.pages.length, recent.errors.length, recent.api_calls.length)} />
        </dl>
      ) : null}
    </div>
  );
}
