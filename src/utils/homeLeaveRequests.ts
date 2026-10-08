export interface HomeLeaveRequestItem {
  id: string;
  type: string;
  isHalfDay: boolean;
  from: string;
  to: string;
  status: string;
  /** Start and end dates (the end equals the start for a single day); the start is also used for ordering. */
  start: Date;
  end: Date;
}

export interface HomeLeaveRequestRules {
  types: readonly string[];
  openStatuses: readonly string[];
  /** Reads the final (all-approvers) status of a row. */
  statusOf: (row: Record<string, unknown>) => string;
  parseDate: (value: string) => Date | null;
}

function field(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

/**
 * The leave requests worth a glance on the home screen: still waiting for a decision, or approved and not over yet,
 * soonest first. Past, rejected, cancelled and non-leave requests are left out.
 */
export function selectOpenLeaveRequests(
  rows: ReadonlyArray<Record<string, unknown>>,
  today: Date,
  rules: HomeLeaveRequestRules
): HomeLeaveRequestItem[] {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const items: HomeLeaveRequestItem[] = [];
  for (const row of rows) {
    const type = field(row, "request_type", "requestType").toUpperCase().replace(/[\s-]+/g, "_");
    if (!rules.types.includes(type)) continue;
    const status = rules.statusOf(row);
    if (!rules.openStatuses.includes(status)) continue;
    const from = field(row, "request_from_date", "requestFromDate");
    const to = field(row, "request_to_date", "requestToDate") || from;
    const start = rules.parseDate(from);
    const end = rules.parseDate(to) ?? start;
    if (!start || !end || end < startOfToday) continue;
    items.push({
      id: field(row, "user_request_id", "userRequestId", "request_id", "requestId", "id") || `${type}-${from}-${to}`,
      type,
      isHalfDay: ["true", "1"].includes(field(row, "is_half_day", "isHalfDay").toLowerCase()),
      from,
      to,
      status,
      start,
      end,
    });
  }
  return items.sort((a, b) => a.start.getTime() - b.start.getTime());
}
