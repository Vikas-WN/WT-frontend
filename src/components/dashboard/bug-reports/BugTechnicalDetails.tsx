"use client";

import { Check, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";

import { BUG_DETAIL_COPY as COPY } from "@/constants/bugReports";
import type { BugReport } from "@/types/bugReport";
import { formatBugForDevelopers } from "@/utils/bugReportText";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";

/** For HR/Admin: everything captured to reproduce the problem, plus one button that copies it as a ready-to-paste ticket. */
export function BugTechnicalDetails({ bug }: { bug: BugReport }) {
  // UI state: whether the details are open, and whether the copy just worked.
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const textFor = (withFiles: boolean) =>
    formatBugForDevelopers({
      id: bug.id,
      title: bug.title,
      description: bug.description,
      severity: bug.severity,
      status: bug.status,
      reporterName: bug.reporter.name,
      reportedAt: formatApiDateTimeDisplay(bug.created_at),
      occurredAt: bug.occurred_at ? formatApiDateTimeDisplay(bug.occurred_at) : null,
      pageUrl: bug.page_url,
      context: bug.context,
      attachments: withFiles ? bug.attachments : [],
    });

  async function copy() {
    try {
      await navigator.clipboard.writeText(textFor(true));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the details are still on screen to read */
    }
  }

  const preview = textFor(false);

  return (
    <div className="mt-3 rounded-xl border border-wt-border">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--wt-brand)] hover:underline">
          <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          {open ? COPY.hideDetails : COPY.showDetails}
        </button>
        <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text">
          {copied ? <Check className="size-3.5 text-emerald-600" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? COPY.copied : COPY.copy}
        </button>
      </div>
      {open ? (
        <div className="border-t border-wt-border px-3 py-2.5">
          {bug.context ? (
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-wt-text">{preview}</pre>
          ) : (
            <p className="text-xs text-wt-text-muted">{COPY.noContext}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
