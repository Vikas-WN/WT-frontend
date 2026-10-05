import { formatApiDateTime, parseApiDate } from "@/utils/apiDate";
import type { SubmissionCycleItem, SubmissionCycleScope } from "@/types/kpi";

/** The three portals everyone shares, in the order HR reads them. */
export const SHARED_SCOPES: readonly Exclude<SubmissionCycleScope, "PERSON">[] = ["GLOBAL", "EMPLOYEE", "MANAGER"];

export type WindowState = "open" | "scheduled" | "closed" | "unset";

/** `dd/mm/yyyy HH:MM[:SS]` (API) -> Date, or null. */
export function parseWindowTime(value: string | null | undefined): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const [datePart, timePart] = raw.split(/\s+/);
  const parsed = parseApiDate(datePart);
  if (!parsed) return null;
  if (timePart) {
    const [h, m, s] = timePart.split(":").map((n) => Number(n) || 0);
    parsed.setHours(h, m, s ?? 0, 0);
  }
  return parsed;
}

/** API date-time -> `<input type="datetime-local">` value. */
export function toInputValue(value: string | null | undefined): string {
  const d = parseWindowTime(value);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `<input type="datetime-local">` value -> API date-time, or null if empty/invalid. */
export function fromInputValue(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : formatApiDateTime(d);
}

export function windowState(row: SubmissionCycleItem | null | undefined, nowMs: number): WindowState {
  if (!row) return "unset";
  if (row.is_open) return "open";
  const start = parseWindowTime(row.window_start_at);
  return !row.manual_closed && start !== null && start.getTime() > nowMs ? "scheduled" : "closed";
}

/** The shared window (no person) for a month and scope. */
export function sharedRow(rows: SubmissionCycleItem[], month: string, scope: SubmissionCycleScope) {
  return rows.find((r) => r.cycle_key === month && r.scope === scope && r.user_id == null) ?? null;
}

export function personRows(rows: SubmissionCycleItem[], month: string): SubmissionCycleItem[] {
  return rows
    .filter((r) => r.cycle_key === month && r.scope === "PERSON")
    .sort((a, b) => (a.user?.name ?? "").localeCompare(b.user?.name ?? ""));
}

/** Months that have any window — the dots on the month picker. */
export function monthsWithWindows(rows: SubmissionCycleItem[]): Set<string> {
  return new Set(rows.map((r) => r.cycle_key));
}

/** A close time at or before now would leave a "started" window shut. */
export function endIsStale(row: SubmissionCycleItem | null, nowMs: number): boolean {
  const end = parseWindowTime(row?.window_end_at);
  return end !== null && end.getTime() <= nowMs;
}
