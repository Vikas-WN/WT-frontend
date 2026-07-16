import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import {
  formatEmployeeStatusLabel,
  getEmployeeStatusBadgeClassName,
  normalizeEmployeeStatusKey,
} from "@/utils/userStatus";
import { formatUiStatusLabel, normalizeStatusKey, uiStatusTone } from "@/utils/statusLabel";

function formatTrainingStatusLabel(status: string): string {
  return formatUiStatusLabel(status);
}

function trainingStatusTone(status: string): string {
  return filledBadgeClass(uiStatusTone(status));
}

export function EmployeeStatusBadge({ status }: { status: string }) {
  const key = normalizeEmployeeStatusKey(status);
  if (!key) {
    return <span className="text-sm text-wt-text-muted">—</span>;
  }

  const label = formatEmployeeStatusLabel(status);

  return (
    <span
      className={cn(getEmployeeStatusBadgeClassName(status), "wt-status-badge-motion")}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}

/** Training / session lifecycle statuses in Learning & Development tables. */
export function TrainingStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn(trainingStatusTone(status), "wt-status-badge-motion")}>
      {formatTrainingStatusLabel(status)}
    </Badge>
  );
}

/**
 * Workflow status badge — leave, WFH, timelog, extension, allocation, etc.
 * Always renders a human label (never raw enums like PENDING / SERVING_NOTICE).
 */
export function RequestStatusBadge({
  status,
  className,
}: {
  status: unknown;
  className?: string;
}) {
  const key = normalizeStatusKey(status);
  const label = formatUiStatusLabel(status);
  if (!key || label === "—") {
    return <span className="text-sm text-wt-text-muted">—</span>;
  }

  return (
    <Badge
      variant="secondary"
      className={cn(filledBadgeClass(uiStatusTone(key)), "wt-status-badge-motion", className)}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {label}
    </Badge>
  );
}

/** Generic filled badge for simple status labels in tables. */
export function WtStatusBadge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: Parameters<typeof filledBadgeClass>[0];
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(filledBadgeClass(tone), "wt-status-badge-motion", className)}
    >
      {children}
    </Badge>
  );
}
