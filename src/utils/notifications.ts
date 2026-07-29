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
  if (message) return message;
  return String(row.title ?? "").trim() || "—";
}

/**
 * Rewrite stored notification text that embeds project codes so the UI shows
 * project names. Codes are replaced only when a distinct name is available.
 */
export function humanizeNotificationProjectRefs(
  message: string,
  projectNameByCode: Map<string, string> | Record<string, string>
): string {
  const text = String(message ?? "").trim();
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
  return String(row.title ?? "").trim();
}
