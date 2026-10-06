"use client";

import { useMyForms } from "@/hooks/forms/useForms";
import { useUnreadAnnouncements } from "@/hooks/announcements/useAnnouncements";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * One calm sentence under the greeting: what is waiting for this person. `approvals` is the pending-approval count
 * (null when they aren't an approver or it hasn't loaded). Returns null until there is something true to say.
 */
export function useHomeAttention(approvals: number | null): string | null {
  const todo = useMyForms({ status: "todo", size: 1 }).data?.total_elements;
  const unread = useUnreadAnnouncements().data;
  if (todo === undefined && unread === undefined && approvals === null) return null;

  const parts: string[] = [];
  if (approvals) parts.push(`${plural(approvals, "approval", "approvals")} waiting`);
  if (todo) parts.push(`${plural(todo, "form", "forms")} to fill`);
  if (unread) parts.push(`${plural(unread, "new announcement", "new announcements")}`);
  return parts.length ? parts.join(" · ") : "You're all caught up.";
}
