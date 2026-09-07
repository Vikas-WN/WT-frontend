import { compareApiDates, normalizeToApiDate } from "@/utils/apiDate";
import { normalizeCompOffRequestType, normalizeRequestStatus, pickRowField } from "@/utils/compOff";

type ExclusiveRequestType = "LEAVE" | "COMP_OFF";

function exclusiveRequestType(value: unknown): ExclusiveRequestType | null {
  if (normalizeCompOffRequestType(value) === "COMP_OFF") return "COMP_OFF";
  return String(value ?? "").trim().toUpperCase() === "LEAVE" ? "LEAVE" : null;
}

/**
 * A pending or approved leave and Comp Off usage request must not share a date.
 * Rejected requests do not reserve their dates.
 */
export function findOverlappingLeaveOrCompOffRequest(
  rows: Array<Record<string, unknown>>,
  candidate: {
    requestType: unknown;
    fromDate: string;
    toDate: string;
    excludeRequestId?: string;
  }
): Record<string, unknown> | null {
  const candidateType = exclusiveRequestType(candidate.requestType);
  const candidateFrom = normalizeToApiDate(candidate.fromDate);
  const candidateTo = normalizeToApiDate(candidate.toDate);
  if (!candidateType || !candidateFrom || !candidateTo) return null;

  return (
    rows.find((row) => {
      const existingType = exclusiveRequestType(
        pickRowField(row, "request_type", "requestType")
      );
      if (!existingType || existingType === candidateType) return false;
      if (normalizeRequestStatus(pickRowField(row, "user_request_status", "userRequestStatus", "status")) === "REJECTED") {
        return false;
      }

      const requestId = String(
        pickRowField(row, "user_request_id", "userRequestId", "request_id", "requestId", "id") ?? ""
      ).trim();
      if (candidate.excludeRequestId && requestId === candidate.excludeRequestId) return false;

      const existingFrom = normalizeToApiDate(
        String(pickRowField(row, "request_from_date", "requestFromDate") ?? "")
      );
      const existingTo = normalizeToApiDate(
        String(pickRowField(row, "request_to_date", "requestToDate") ?? "")
      );
      return Boolean(
        existingFrom &&
          existingTo &&
          compareApiDates(candidateFrom, existingTo) <= 0 &&
          compareApiDates(candidateTo, existingFrom) >= 0
      );
    }) ?? null
  );
}
