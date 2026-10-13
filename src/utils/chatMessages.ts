/** Pure helpers that turn a flat list of chat messages into what the thread shows (day separators, grouped runs). */

export interface MessageLike {
  id: number;
  sender_id: number;
  created_at: string;
}

export type ThreadRow<T extends MessageLike> =
  | { kind: "day"; key: string; label: string }
  | { kind: "unread"; key: string }
  | { kind: "message"; key: string; message: T; startsGroup: boolean };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today", "Yesterday", or "Mon, 12 Oct" (with the year when it is not this year). */
export function dayLabel(iso: string, now: Date, labels: { today: string; yesterday: string }): string {
  const date = new Date(iso);
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return labels.today;
  if (diffDays === 1) return labels.yesterday;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

/**
 * Day separators between days, a "new messages" divider before the first unread, and consecutive messages from one person
 * (close in time, same day) marked as one group so only the first shows the name and avatar.
 */
export function buildThreadRows<T extends MessageLike>(
  messages: readonly T[],
  options: { now: Date; firstUnreadId: number | null; groupWithinMs: number; labels: { today: string; yesterday: string } }
): ThreadRow<T>[] {
  const rows: ThreadRow<T>[] = [];
  let previous: T | null = null;
  let dividerShown = false;
  for (const message of messages) {
    const day = startOfDay(new Date(message.created_at));
    const previousDay = previous ? startOfDay(new Date(previous.created_at)) : null;
    const newDay = previousDay === null || previousDay !== day;
    if (newDay) rows.push({ kind: "day", key: `day-${day}`, label: dayLabel(message.created_at, options.now, options.labels) });
    if (!dividerShown && options.firstUnreadId !== null && message.id >= options.firstUnreadId) {
      rows.push({ kind: "unread", key: "unread" });
      dividerShown = true;
    }
    const sameRun =
      previous !== null &&
      !newDay &&
      previous.sender_id === message.sender_id &&
      new Date(message.created_at).getTime() - new Date(previous.created_at).getTime() <= options.groupWithinMs &&
      !(dividerShown && options.firstUnreadId === message.id);
    rows.push({ kind: "message", key: `m-${message.id}`, message, startsGroup: !sameRun });
    previous = message;
  }
  return rows;
}

/** Merge newly fetched messages into the list we already have: by id, newer data wins, ordered by id. */
export function mergeMessages<T extends { id: number }>(current: readonly T[], incoming: readonly T[]): T[] {
  const byId = new Map<number, T>();
  for (const m of current) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

/** The highest real (server) message id in a list; pending placeholders have negative ids and are ignored. */
export function lastRealId(messages: readonly { id: number }[]): number {
  let last = 0;
  for (const m of messages) if (m.id > last) last = m.id;
  return last;
}
