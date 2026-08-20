import type { NotificationItem } from "@/services/hrms.service";
import { toRows } from "@/utils/apiRows";

export function parseNotificationItems(input: unknown): NotificationItem[] {
  if (Array.isArray(input)) {
    return input as NotificationItem[];
  }
  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (Array.isArray(record.items)) {
      return record.items as NotificationItem[];
    }
    if (Array.isArray(record.data)) {
      return record.data as NotificationItem[];
    }
    const nested = record.data;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const nestedRecord = nested as Record<string, unknown>;
      if (Array.isArray(nestedRecord.items)) {
        return nestedRecord.items as NotificationItem[];
      }
      if (Array.isArray(nestedRecord.data)) {
        return nestedRecord.data as NotificationItem[];
      }
    }
  }
  return toRows(input) as unknown as NotificationItem[];
}

export function formatNotificationTimestamp(value: string | undefined): string {
  if (!value?.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function notificationRowId(row: NotificationItem | Record<string, unknown>): string {
  const raw = row.id ?? (row as Record<string, unknown>).notification_id ?? (row as Record<string, unknown>).notificationId;
  return String(raw ?? "").trim();
}

export function notificationIsRead(row: NotificationItem | Record<string, unknown>): boolean {
  return Boolean(row.is_read ?? (row as Record<string, unknown>).isRead ?? false);
}

export function notificationMessage(row: NotificationItem | Record<string, unknown>): string {
  const message = String(row.message ?? (row as Record<string, unknown>).body ?? "").trim();
  if (message) return stripInternalRequestIds(message);
  const title = String(row.title ?? "").trim();
  return title ? stripInternalRequestIds(title) : "—";
}

/**
 * Hide internal request identifiers (e.g. "Request #11") from end-user copy.
 * Raw message text is still available on the row for deep-link parsing.
 */
export function stripInternalRequestIds(text: string): string {
  return String(text ?? "")
    .replace(/\s*\(\s*request\s*#\s*\d+\s*\)/gi, "")
    .replace(/\s*request\s*#\s*\d+/gi, "")
    .replace(/\s*\.?\s*allocation_id=\d+\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

function readNotificationType(row: NotificationItem | Record<string, unknown>): string {
  return String(row.type ?? (row as Record<string, unknown>).notification_type ?? "")
    .trim()
    .toUpperCase();
}

function parseAllocationEndingMessageBody(rawMessage: string): {
  employeeName: string;
  projectLabel: string;
  roleLabel: string;
} {
  const withoutId = String(rawMessage ?? "")
    .replace(/\s*\.?\s*allocation_id=\d+\s*$/i, "")
    .replace(/^allocation_id=\d+\s*$/i, "")
    .trim();
  const segments = withoutId
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);
  const roleSegment = segments.find((part) => /^role:/i.test(part)) ?? "";
  const roleLabel = roleSegment.replace(/^role:\s*/i, "").trim();
  const contentSegments = segments.filter((part) => !/^role:/i.test(part));
  return {
    employeeName: contentSegments[0] ?? "",
    projectLabel: contentSegments[1] ?? "",
    roleLabel,
  };
}

function projectNameFromLabel(projectLabel: string): string {
  const label = String(projectLabel ?? "").trim();
  if (!label) return "";
  if (label.includes(" - ")) {
    return label.split(" - ").slice(1).join(" - ").trim() || label;
  }
  return label;
}

/** User-facing copy for allocation-ending reminders (employee, project, end date). */
export function formatAllocationEndingNotificationDisplay(
  row: NotificationItem | Record<string, unknown>
): { title: string; message: string } {
  const rawTitle = String(row.title ?? "").trim();
  const rawMessage = String(
    row.message ?? (row as Record<string, unknown>).body ?? ""
  ).trim();
  const { employeeName, projectLabel, roleLabel } =
    parseAllocationEndingMessageBody(rawMessage);
  const projectName = projectNameFromLabel(projectLabel);

  const structuredTitleMatch = rawTitle.match(/^(.+?)\s·\s(.+?)\s·\sEnding\s+(.+)$/i);
  if (structuredTitleMatch) {
    const employee = structuredTitleMatch[1].trim();
    const project = structuredTitleMatch[2].trim();
    const endDate = structuredTitleMatch[3].trim();
    return {
      title: `${employee} · ${project}`,
      message: `Allocation ending on ${endDate}${roleLabel ? ` · Role: ${roleLabel}` : ""}`,
    };
  }

  const legacyTitleMatch = rawTitle.match(/^Allocation ending on\s+(.+?)(?:\s*[—-]\s*(.+))?$/i);
  const endDateFromTitle = legacyTitleMatch?.[1]?.trim() ?? "";
  const projectFromTitle = legacyTitleMatch?.[2]?.trim() ?? "";
  const employee = employeeName.trim();
  const project = projectName || projectFromTitle;
  const endDate = endDateFromTitle;

  if (employee && project && endDate) {
    return {
      title: `${employee} · ${project}`,
      message: `Allocation ending on ${endDate}${roleLabel ? ` · Role: ${roleLabel}` : ""}`,
    };
  }

  if (employee && project) {
    return {
      title: `${employee} · ${project}`,
      message: endDate
        ? `Allocation ending on ${endDate}${roleLabel ? ` · Role: ${roleLabel}` : ""}`
        : roleLabel
          ? `Role: ${roleLabel}`
          : "",
    };
  }

  return {
    title: stripInternalRequestIds(rawTitle) || "Allocation Ending Reminder",
    message: roleLabel ? `Role: ${roleLabel}` : "",
  };
}

export function resolveNotificationDisplayCopy(
  row: NotificationItem | Record<string, unknown>,
  projectNameByCode: Map<string, string> | Record<string, string>
): { title: string; message: string } {
  const type = readNotificationType(row);
  if (type === "ALLOCATION_ENDING_REMINDER") {
    const formatted = formatAllocationEndingNotificationDisplay(row);
    return {
      title: humanizeNotificationProjectRefs(formatted.title, projectNameByCode),
      message: humanizeNotificationProjectRefs(formatted.message, projectNameByCode),
    };
  }

  const title = notificationTitle(row);
  const message = humanizeNotificationProjectRefs(notificationMessage(row), projectNameByCode);
  return { title, message };
}

/**
 * Rewrite stored notification text that embeds project codes so the UI shows
 * project names. Codes are replaced only when a distinct name is available.
 */
export function humanizeNotificationProjectRefs(
  message: string,
  projectNameByCode: Map<string, string> | Record<string, string>
): string {
  const text = stripInternalRequestIds(String(message ?? "").trim());
  if (!text) return text;
  const lookup =
    projectNameByCode instanceof Map
      ? projectNameByCode
      : new Map(
          Object.entries(projectNameByCode).map(([code, name]) => [
            code.trim().toUpperCase(),
            name,
          ])
        );
  if (!lookup.size) return text;

  let result = text;
  const codes = Array.from(lookup.keys()).sort((a, b) => b.length - a.length);
  for (const code of codes) {
    const name = String(lookup.get(code) ?? "").trim();
    if (!name || name.toUpperCase() === code) continue;
    // "Project Name (CODE)" → "Project Name"
    result = result.replace(
      new RegExp(`${escapeRegExp(name)}\\s*\\(${escapeRegExp(code)}\\)`, "gi"),
      name
    );
    // bare code token → name
    result = result.replace(new RegExp(`\\b${escapeRegExp(code)}\\b`, "gi"), name);
  }
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function notificationTitle(row: NotificationItem | Record<string, unknown>): string {
  return stripInternalRequestIds(String(row.title ?? "").trim());
}

/**
 * Keep one row per leave/WFH request when the same receiver got duplicate
 * manager/HR fan-out copies. Prefer Request # when present; else type+dates+body.
 */
export function dedupeLeaveRequestNotifications(
  items: NotificationItem[]
): NotificationItem[] {
  const seenRequestKeys = new Set<string>();
  const result: NotificationItem[] = [];

  for (const row of items) {
    const type = String(row.type ?? "")
      .trim()
      .toUpperCase();
    const isLeaveFamily =
      type === "LEAVE_REQUEST" ||
      type === "WFH_REQUEST" ||
      type === "LOP_LEAVE_REQUEST";
    if (!isLeaveFamily) {
      result.push(row);
      continue;
    }

    const rawMessage = String(
      row.message ?? (row as unknown as Record<string, unknown>).body ?? ""
    ).trim();
    const idMatch = rawMessage.match(/request\s*#\s*(\d+)/i);
    const rangeMatch = rawMessage.match(
      /from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i
    );
    const key = idMatch?.[1]
      ? `${type}:${idMatch[1]}`
      : rangeMatch
        ? `${type}:${rangeMatch[1]}:${rangeMatch[2]}:${stripInternalRequestIds(rawMessage)}`
        : `${type}:${notificationRowId(row)}`;
    if (seenRequestKeys.has(key)) continue;
    seenRequestKeys.add(key);
    result.push(row);
  }

  return result;
}
