import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";

export function LeaveRequestStatusBadge({ status }: { status: unknown }) {
  return <RequestStatusBadge status={status} />;
}
