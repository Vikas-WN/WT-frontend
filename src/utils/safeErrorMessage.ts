/**
 * Last line of defence: error text that reaches a toast / splash must be plain
 * language. Database, driver, SQL, stack-trace or Python-exception text belongs
 * in the API response's `error` field (visible in DevTools), never in front of
 * the user — a raw `DBAPIError … INSERT INTO notifications …` toast leaked table
 * names and read like the app was broken.
 */
// Library / driver / exception markers — case-insensitive.
const TECHNICAL_ERROR_PATTERN =
  /(sqlalchemy|asyncpg|psycopg|DBAPIError|IntegrityError|ProgrammingError|OperationalError|StringDataRightTruncation|UniqueViolation|ForeignKeyViolation|NotNullViolation|\[SQL:|\[parameters:|Traceback \(most recent call last\)|<class '|character varying\(\d+\)|violates (unique|foreign key|not-null|check) constraint|duplicate key value)/i;

// Raw SQL — case-SENSITIVE (uppercase, as drivers print it) so ordinary
// sentences like "Please select a project from the list" never match.
const RAW_SQL_PATTERN = /\b(INSERT INTO|UPDATE \w+ SET|DELETE FROM|SELECT [\s\S]+ FROM)\b/;

export const GENERIC_ERROR_MESSAGE =
  "Something went wrong while saving. Please retry in a moment; contact support if it keeps happening.";

export function looksTechnical(message: string): boolean {
  return TECHNICAL_ERROR_PATTERN.test(message) || RAW_SQL_PATTERN.test(message);
}

/** Returns `message` unchanged when it's user-friendly, else a plain fallback.
 *  A leading context prefix such as "someone@company.com: " is preserved. */
export function toSafeErrorMessage(message: string, fallback: string = GENERIC_ERROR_MESSAGE): string {
  const text = String(message ?? "").trim();
  if (!text) return fallback;
  if (!looksTechnical(text)) return text;
  const prefix = text.match(/^([^:\s]{1,120}@[^:\s]{1,120}):\s/);
  return prefix ? `${prefix[1]}: ${fallback}` : fallback;
}
