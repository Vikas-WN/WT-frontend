"use client";

import type { ReactNode } from "react";
import { CalendarDays, Clock, Paperclip, ShieldCheck } from "lucide-react";

import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LeaveRequestDetailView = {
  requestId: string;
  employee: string;
  email: string | null;
  isAccountManager: boolean;
  requestTypeLabel: string;
  /** Overall request status (PENDING / APPROVED / REJECTED). */
  status: string;
  managerStatus: string;
  secondaryStatus: string;
  hasDualManagers: boolean;
  duration: string;
  isHalfDay: boolean;
  days: string;
  appliedOn: string;
  employeeComments: string;
  managerReason: string;
  hrReason: string;
  attachmentUrl: string;
  canApprove: boolean;
  canReject: boolean;
  blockedHint: string | null;
  /** Passed straight back to the approve / reject handlers. */
  requestType: unknown;
};

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  const joined = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return joined || "?";
}

const STATUS_STRIPE: Record<string, string> = {
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-rose-500",
  PENDING: "bg-amber-500",
};

function DetailField({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-wt-text-faint">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-wt-text [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

export function LeaveRequestDetailDialog({
  open,
  view,
  busy = false,
  onClose,
  onApprove,
  onReject,
}: {
  open: boolean;
  view: LeaveRequestDetailView | null;
  busy?: boolean;
  onClose: () => void;
  onApprove: (view: LeaveRequestDetailView) => void;
  onReject: (view: LeaveRequestDetailView) => void;
}) {
  if (!open || !view) return null;

  const headStatus = view.status || view.managerStatus || "PENDING";
  const stripe = STATUS_STRIPE[headStatus.toUpperCase()] ?? "bg-wt-border";
  const canAct = (view.canApprove || view.canReject) && Boolean(view.requestId);
  const hasDecisionReason = Boolean(view.managerReason || view.hrReason);

  return (
    <div
      className={MODAL_OVERLAY_CLASS}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-request-detail-title"
        className={cn(MODAL_PANEL_CLASS, "max-w-xl")}
        onClick={(event) => event.stopPropagation()}
      >
        <span
          aria-hidden
          className={cn("absolute inset-x-0 top-0 h-1 rounded-t-2xl", stripe)}
        />

        <div className={cn(MODAL_HEADER_CLASS, "flex items-start gap-4")}>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-sm font-semibold text-[var(--wt-brand)]">
            {initialsOf(view.employee)}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="leave-request-detail-title"
              className="flex items-center gap-2 text-base font-semibold text-wt-text"
            >
              <span className="truncate">{view.employee}</span>
              {view.isAccountManager ? (
                <span className="shrink-0 rounded-md bg-wt-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-wt-text-muted">
                  AM
                </span>
              ) : null}
            </h2>
            <p className="mt-0.5 truncate text-xs text-wt-text-muted">
              {view.requestTypeLabel || "Request"}
              {view.email ? ` · ${view.email}` : ""}
            </p>
          </div>
          <RequestStatusBadge status={headStatus} className="shrink-0" />
        </div>

        <div className={cn(MODAL_BODY_CLASS, "space-y-5")}>
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 min-[420px]:grid-cols-2">
            <DetailField
              icon={<CalendarDays className="size-3.5" />}
              label="Duration"
              value={view.duration || "—"}
            />
            <DetailField
              icon={<Clock className="size-3.5" />}
              label="Days"
              value={
                <>
                  {view.days}
                  {view.isHalfDay ? (
                    <span className="ml-1 text-xs font-normal text-wt-text-muted">(half day)</span>
                  ) : null}
                </>
              }
            />
            <DetailField label="Applied on" value={view.appliedOn || "—"} />
            <DetailField label="Request type" value={view.requestTypeLabel || "—"} />
          </div>

          {view.hasDualManagers ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-wt-border bg-wt-surface-2/50 px-3 py-2.5">
              <ShieldCheck className="size-4 text-wt-text-muted" />
              <span className="text-xs text-wt-text-muted">Primary</span>
              <RequestStatusBadge status={view.managerStatus || "PENDING"} />
              <span className="text-xs text-wt-text-muted">Secondary</span>
              <RequestStatusBadge status={view.secondaryStatus || "PENDING"} />
            </div>
          ) : null}

          {view.employeeComments ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-faint">
                Employee note
              </p>
              <blockquote className="mt-1.5 rounded-xl border-l-2 border-[var(--wt-brand)]/50 bg-wt-surface-2/50 px-3.5 py-2.5 text-sm text-wt-text [overflow-wrap:anywhere]">
                {view.employeeComments}
              </blockquote>
            </div>
          ) : null}

          {hasDecisionReason ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-faint">
                Decision reason
              </p>
              {view.managerReason ? (
                <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400 [overflow-wrap:anywhere]">
                  {view.managerReason}
                </p>
              ) : null}
              {view.hrReason ? (
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-400 [overflow-wrap:anywhere]">
                  {view.hrReason}
                </p>
              ) : null}
            </div>
          ) : null}

          {view.attachmentUrl ? (
            <a
              href={view.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--wt-brand)] hover:underline"
            >
              <Paperclip className="size-4" />
              View attachment
            </a>
          ) : null}
        </div>

        <div className={MODAL_FOOTER_CLASS}>
          {!canAct && view.blockedHint ? (
            <p className="mr-auto self-center text-xs text-wt-text-muted [overflow-wrap:anywhere]">
              {view.blockedHint}
            </p>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Close
          </Button>
          {view.canReject && view.requestId ? (
            <Button
              type="button"
              variant="outline"
              className="border-rose-600/30 text-rose-700 hover:bg-rose-500/10 dark:text-rose-400"
              disabled={busy}
              onClick={() => onReject(view)}
            >
              Reject
            </Button>
          ) : null}
          {view.canApprove && view.requestId ? (
            <Button
              type="button"
              variant="brand"
              disabled={busy}
              onClick={() => onApprove(view)}
            >
              {busy ? "Approving…" : "Approve"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
