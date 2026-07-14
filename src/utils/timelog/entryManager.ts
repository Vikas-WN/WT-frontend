import { pickManagerEmailList } from "@/utils/leaveManagerDisplay";
import type { DayTimelogEntry } from "@/hooks/timelog/useDayTimelog.types";

export function projectManagerEmailFromEntry(entry: DayTimelogEntry): string {
  const direct = entry.project_manager?.trim();
  if (direct) return direct;
  const fromArray =
    entry.primary_manager_emails?.map((email) => email.trim()).find(Boolean) ??
    entry.primaryManagerEmails?.map((email) => email.trim()).find(Boolean);
  if (fromArray) return fromArray;
  const picked = pickManagerEmailList(entry as unknown as Record<string, unknown>, "primary");
  return picked[0] ?? "";
}

export type TimelogEntryWritePayload = {
  project_code: string;
  project_name: string | null;
  log_date: string;
  hours: number;
  task_category: string;
  sub_category: string | null;
  description: string | null;
  primary_manager_emails?: string[];
  primaryManagerEmails?: string[];
};

export function buildTimelogEntryPayload(
  form: {
    project_code: string;
    project_name: string;
    project_manager: string;
    task_category: string;
    sub_category: string;
    description: string;
  },
  logDate: string,
  hours: number
): TimelogEntryWritePayload {
  const managerEmail = form.project_manager.trim();
  const primaryManagerEmails = managerEmail ? [managerEmail] : undefined;
  const payload: TimelogEntryWritePayload = {
    project_code: form.project_code,
    project_name: form.project_name.trim() || null,
    log_date: logDate,
    hours,
    task_category: form.task_category,
    sub_category: form.sub_category || null,
    description: form.description || null,
  };
  if (primaryManagerEmails?.length) {
    payload.primary_manager_emails = primaryManagerEmails;
    payload.primaryManagerEmails = primaryManagerEmails;
  }
  return payload;
}
