/** Accept the list envelopes used by the BFF and paginated API responses. */
export function apiCollection<T>(input: unknown, depth = 0): T[] {
  if (Array.isArray(input)) return input as T[];
  if (!input || typeof input !== "object" || depth >= 5) return [];
  const record = input as Record<string, unknown>;
  for (const key of ["data", "items", "content", "results", "categories"]) {
    if (record[key] != null) {
      const result = apiCollection<T>(record[key], depth + 1);
      if (result.length || Array.isArray(record[key])) return result;
    }
  }
  return [];
}

export function apiRecord<T>(input: unknown): T | null {
  let current = input;
  for (let depth = 0; depth < 5 && current && typeof current === "object" && !Array.isArray(current); depth += 1) {
    const record = current as Record<string, unknown>;
    if ("data" in record) current = record.data;
    else return record as T;
  }
  return null;
}
