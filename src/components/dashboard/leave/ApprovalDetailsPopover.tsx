"use client";

import type { ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  APPROVAL_ACTION,
  APPROVAL_DETAILS_CLOSE_DELAY_MS,
  APPROVAL_DETAILS_COPY,
  APPROVAL_DETAILS_HOVER_DELAY_MS,
} from "@/constants/approvalDetails";
import { cn } from "@/lib/utils";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";
import type { ApprovalDetails } from "@/utils/approvalHistory";
import type { ApprovalHistoryEntry, ApprovalPerson } from "@/types/userRequest";

const DOT_BY_ACTION: Record<string, string> = {
  [APPROVAL_ACTION.approved]: "bg-emerald-500",
  [APPROVAL_ACTION.rejected]: "bg-rose-500",
  [APPROVAL_ACTION.auto]: "bg-sky-500",
};

function personLabel(name: string | null, email: string | null): string {
  return name ?? email ?? APPROVAL_DETAILS_COPY.noName;
}

function PersonLines({ person }: { person: ApprovalPerson }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-wt-text">
        {personLabel(person.name, person.email)}
      </p>
      {person.name && person.email ? (
        <p className="truncate text-xs text-wt-text-muted">{person.email}</p>
      ) : null}
    </div>
  );
}

function HistoryEntry({ entry }: { entry: ApprovalHistoryEntry }) {
  const isAuto = entry.action === APPROVAL_ACTION.auto;
  const verb =
    APPROVAL_DETAILS_COPY.verbByAction[entry.action as keyof typeof APPROVAL_DETAILS_COPY.verbByAction] ??
    entry.action;
  const when = entry.acted_at ? formatApiDateTimeDisplay(entry.acted_at) : null;

  return (
    <li className="flex gap-2.5">
      <span
        aria-hidden
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT_BY_ACTION[entry.action] ?? "bg-wt-text-faint")}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
          {isAuto ? APPROVAL_DETAILS_COPY.autoApprovedTitle : verb}
          {entry.actioner_role && !isAuto ? ` · ${entry.actioner_role}` : ""}
        </p>
        {isAuto ? (
          <p className="text-xs text-wt-text-muted">{APPROVAL_DETAILS_COPY.autoApprovedNote}</p>
        ) : null}
        {isAuto ? (
          <p className="text-[11px] text-wt-text-faint">{APPROVAL_DETAILS_COPY.autoApprovedOnBehalf}</p>
        ) : null}
        <PersonLines person={{ name: entry.actioner_name, email: entry.actioner_email }} />
        {when ? <p className="text-xs text-wt-text-muted">{when}</p> : null}
        {entry.message && !isAuto ? (
          <p className="mt-1 rounded-md bg-wt-surface-3 px-2 py-1 text-xs text-wt-text">
            <span className="font-medium">{APPROVAL_DETAILS_COPY.comment}: </span>
            {entry.message}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function PopoverBody({ details, decided }: { details: ApprovalDetails; decided: boolean }) {
  if (details.history.length > 0) {
    return (
      <ul className="space-y-3">
        {details.history.map((entry, index) => (
          <HistoryEntry key={`${entry.action}-${entry.acted_at ?? index}-${index}`} entry={entry} />
        ))}
      </ul>
    );
  }
  if (!decided && details.pending.length > 0) {
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
          {APPROVAL_DETAILS_COPY.waitingOn}
        </p>
        <ul className="space-y-2">
          {details.pending.map((person) => (
            <li key={person.email ?? person.name ?? "approver"}>
              <PersonLines person={person} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <p className="text-xs text-wt-text-muted">
      {decided ? APPROVAL_DETAILS_COPY.noDetailsDecided : APPROVAL_DETAILS_COPY.noDetails}
    </p>
  );
}

/** Wraps a status tag so hovering (or tapping / focusing) it shows who decided and when. */
export function ApprovalDetailsPopover({
  details,
  decided,
  ariaLabel,
  children,
}: {
  details: ApprovalDetails;
  decided: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={APPROVAL_DETAILS_HOVER_DELAY_MS}
        closeDelay={APPROVAL_DETAILS_CLOSE_DELAY_MS}
        aria-label={ariaLabel}
        className="inline-flex cursor-help rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]"
      >
        {children}
      </PopoverTrigger>
      <PopoverPortal>
        {/* Click-through: the details are read-only, and a solid popup under the tag would
            sit over the tags of the rows below and block hovering them. */}
        <PopoverPositioner side="bottom" align="start" sideOffset={6} className="pointer-events-none">
          <PopoverContent className="pointer-events-none w-72 p-3">
            <PopoverBody details={details} decided={decided} />
          </PopoverContent>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
