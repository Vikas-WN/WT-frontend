export function normalizeDirectoryUserType(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
}

/**
 * Whether converting between these types needs a confirmation dialog
 * (transition date and/or band change).
 */
export function requiresUserTypeTransitionDialog(
  fromType: string,
  toType: string,
  options?: { currentBandIsInternOnly?: boolean }
): boolean {
  const from = normalizeDirectoryUserType(fromType);
  const to = normalizeDirectoryUserType(toType);
  if (to === "FULLTIME" && (from === "INTERN" || from === "CONSULTANT")) return true;
  // Full-time / consultant → Intern needs B8 when the current band is not already intern-only.
  if (to === "INTERN" && from !== "INTERN" && !options?.currentBandIsInternOnly) return true;
  // Intern / Full-time → Consultant clears band and may clear an invalid designation.
  if (to === "CONSULTANT" && (from === "INTERN" || from === "FULLTIME")) return true;
  return false;
}
