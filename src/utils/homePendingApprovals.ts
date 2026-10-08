export interface PendingApprovalItem {
  id: string;
  requester: string;
  type: string;
  isHalfDay: boolean;
  from: string;
  to: string;
  start: Date | null;
  end: Date | null;
}

function field(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

/**
 * The requests waiting for this person, from several lists that can overlap: each request once, earliest leave first.
 * `parseDate` reads the API's dd/mm/yyyy dates.
 */
export function collectPendingApprovals(
  lists: ReadonlyArray<ReadonlyArray<Record<string, unknown>>>,
  parseDate: (value: string) => Date | null
): PendingApprovalItem[] {
  const seen = new Set<string>();
  const out: PendingApprovalItem[] = [];
  for (const rows of lists) {
    for (const row of rows) {
      const status = field(row, "status", "final_status").toUpperCase();
      if (status !== "PENDING") continue;
      const id = field(row, "user_request_id", "userRequestId", "request_id", "requestId", "id");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const from = field(row, "request_from_date", "requestFromDate");
      const to = field(row, "request_to_date", "requestToDate") || from;
      out.push({
        id,
        requester: field(row, "employee_display", "employee_name", "employeeName", "name", "emp_email", "empEmail", "email") || "—",
        type: field(row, "request_type", "requestType").toUpperCase().replace(/[\s-]+/g, "_"),
        isHalfDay: ["true", "1"].includes(field(row, "is_half_day", "isHalfDay").toLowerCase()),
        from,
        to,
        start: parseDate(from),
        end: parseDate(to),
      });
    }
  }
  return out.sort((a, b) => (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity));
}
