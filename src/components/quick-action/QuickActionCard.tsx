"use client";

import { useState } from "react";
import { CalendarDays, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QUICK_ACTION_COPY as COPY } from "@/constants/quickAction";
import type { QuickActionDecision, QuickActionPreview } from "@/types/quickAction";

function Row({ label, children, index }: { label: string; children: React.ReactNode; index: number }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5" style={{ ["--i" as string]: index }}>
      <dt className="text-xs font-medium uppercase tracking-wide text-wt-text-faint">{label}</dt>
      <dd className="text-right text-sm font-medium text-wt-text">{children}</dd>
    </div>
  );
}

/** The request and the two choices. Rejecting asks for a reason first (the backend requires one). */
export function QuickActionCard({
  preview,
  busy,
  onDecide,
}: {
  preview: QuickActionPreview;
  busy: boolean;
  onDecide: (action: QuickActionDecision, message?: string) => void;
}) {
  // UI-only: whether the reject-reason step is showing, and what's been typed.
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const request = preview.request;
  if (!request) return null;
  const range = request.from_date === request.to_date ? request.from_date : `${request.from_date} → ${request.to_date}`;

  return (
    <div className="px-6 pb-6 pt-7 sm:px-8">
      <div className="wt-fade-up flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
          <CalendarDays className="size-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-snug text-wt-text">{COPY.title(request.requester, request.type)}</h1>
          <p className="text-sm text-wt-text-muted">{COPY.greeting(preview.approver_name ?? "there")}</p>
        </div>
      </div>

      <dl className="wt-stagger mt-5 divide-y divide-wt-border rounded-2xl border border-wt-border bg-wt-surface-2 px-4">
        <Row label="Dates" index={0}>
          {range}
          {request.is_half_day ? <span className="ml-2 text-xs font-normal text-wt-text-muted">{COPY.halfDay}</span> : null}
        </Row>
        {request.reason ? (
          <Row label={COPY.reason} index={1}>
            <span className="whitespace-pre-wrap font-normal text-wt-text-muted">{request.reason}</span>
          </Row>
        ) : null}
      </dl>

      {rejecting ? (
        <div className="wt-fade-up mt-5 space-y-3">
          <label htmlFor="reject-reason" className="text-sm font-medium text-wt-text">
            {COPY.rejectReasonLabel}
          </label>
          <textarea
            id="reject-reason"
            autoFocus
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={COPY.rejectReasonPlaceholder}
            className="w-full rounded-xl border border-wt-border-md bg-wt-surface-1 px-3.5 py-2.5 text-sm text-wt-text outline-none placeholder:text-wt-text-faint focus:border-[var(--wt-brand)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)]"
          />
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" className="flex-1" disabled={busy} onClick={() => setRejecting(false)}>
              {COPY.back}
            </Button>
            <Button type="button" variant="destructive" className="flex-1" disabled={busy || !reason.trim()} onClick={() => onDecide("REJECTED", reason)}>
              {COPY.rejectConfirm}
            </Button>
          </div>
        </div>
      ) : (
        <div className="wt-fade-up mt-5 grid grid-cols-2 gap-2.5" style={{ animationDelay: "160ms" }}>
          <Button type="button" variant="outline" size="lg" disabled={busy} onClick={() => setRejecting(true)}>
            <X className="size-4" /> {COPY.reject}
          </Button>
          <Button type="button" variant="brand" size="lg" disabled={busy} onClick={() => onDecide("APPROVED")}>
            <Check className="size-4" /> {COPY.approve}
          </Button>
        </div>
      )}
      <p className="mt-4 text-center text-xs text-wt-text-faint">{COPY.secureNote}</p>
    </div>
  );
}
