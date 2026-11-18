/**
 * Naming the employees on a team / org request list without flooding the API.
 *
 * The list rows already carry `employee_name`. The page used to look up every employee it hadn't cached — one
 * `GET /user` per person, all at once — even when the row had the name: 300 parallel calls (~4 s of a 5.3 s load in
 * the Nov 2026 measurement on All Employee Requests). Only rows with no name anywhere need a lookup, and those run a
 * few at a time.
 *
 * Kept free of imports so it can be unit-tested directly.
 */

type Row = Record<string, unknown>;

const EMAIL_KEYS = ["email", "user_email", "userEmail", "emp_email", "empEmail", "employee_email", "employeeEmail"] as const;
const NAME_KEYS = [
  "name",
  "employee_name",
  "employeeName",
  "user_name",
  "userName",
  "emp_name",
  "empName",
  "requested_by_name",
  "requestedByName",
] as const;

export const NAME_LOOKUP_CONCURRENCY = 6;

function firstText(row: Row, keys: readonly string[]): string {
  for (const key of keys) {
    const value = String(row[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

export function requestRowEmail(row: Row): string {
  return firstText(row, EMAIL_KEYS).toLowerCase();
}

export function requestRowName(row: Row): string {
  return firstText(row, NAME_KEYS);
}

/** Emails whose name is neither on any of their rows nor already known — the only ones worth a lookup. */
export function emailsNeedingNameLookup(rows: readonly Row[], knownNames: Readonly<Record<string, string>>): string[] {
  const named = new Set<string>();
  const unnamed = new Set<string>();
  for (const row of rows) {
    const email = requestRowEmail(row);
    if (!email || knownNames[email]) continue;
    if (requestRowName(row)) named.add(email);
    else unnamed.add(email);
  }
  return [...unnamed].filter((email) => !named.has(email));
}

/** Runs `task` over `items` with at most `limit` in flight; results keep the input order. */
export async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
}
