import { ApprovalDetailsPopover } from "@/components/dashboard/leave/ApprovalDetailsPopover";
import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { APPROVAL_DETAILS_COPY } from "@/constants/approvalDetails";
import { readApprovalDetails } from "@/utils/approvalHistory";
import { formatUiStatusLabel, normalizeStatusKey } from "@/utils/statusLabel";

/**
 * Status tag for leave / WFH / comp-off requests. Pass the request row as `request` and the
 * tag shows who approved (or rejected) it, when, and any comment on hover; for a pending
 * request it shows who it is waiting on. Without a row it is a plain tag.
 */
export function LeaveRequestStatusBadge({
  status,
  request,
  className,
}: {
  status: unknown;
  request?: Record<string, unknown> | null;
  className?: string;
}) {
  const badge = <RequestStatusBadge status={status} className={className} />;
  const details = readApprovalDetails(request);
  if (!details.supported) return badge;

  const label = formatUiStatusLabel(status);
  const decided = normalizeStatusKey(status) !== "PENDING";
  return (
    <ApprovalDetailsPopover
      details={details}
      decided={decided}
      ariaLabel={`Status: ${label}. ${APPROVAL_DETAILS_COPY.triggerHint}`}
    >
      {badge}
    </ApprovalDetailsPopover>
  );
}
