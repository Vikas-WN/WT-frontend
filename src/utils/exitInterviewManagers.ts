/** Parse comma-separated manager names from exit survey submit payload. */
export function parseReportingManagerNames(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatReportingManagerNames(names: string[]): string {
  return names
    .map((name) => name.trim())
    .filter(Boolean)
    .join(", ");
}

/** Onboard option labels use `Name (email@domain)`. */
export function nameFromOnboardOptionLabel(label: string): string {
  const trimmed = label.trim();
  const match = /^(.+?)\s+\([^)]+\)\s*$/.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}
