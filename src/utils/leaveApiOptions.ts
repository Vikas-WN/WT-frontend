/** Unwrap `{ message, data: T[] }` from BFF/API responses. */
export function unwrapApiDataArray<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as Record<string, unknown>).data;
  return Array.isArray(data) ? (data as T[]) : [];
}

/** Unwrap `{ message, data: { items } }` (and one nested data layer) from BFF/API responses.
 * Also accepts `data` as a bare array (legacy `/employees/managers`).
 */
export function unwrapLeaveOptionItems<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  let data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>;
    if (nested.items == null && nested.data && typeof nested.data === "object") {
      data = nested.data;
    }
  }
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const items = record.items ?? record.managers;
  return Array.isArray(items) ? (items as T[]) : [];
}
