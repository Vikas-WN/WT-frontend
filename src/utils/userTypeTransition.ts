export function normalizeDirectoryUserType(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
}

export function requiresUserTypeTransitionDialog(fromType: string, toType: string): boolean {
  const from = normalizeDirectoryUserType(fromType);
  const to = normalizeDirectoryUserType(toType);
  return to === "FULLTIME" && (from === "INTERN" || from === "CONSULTANT");
}
