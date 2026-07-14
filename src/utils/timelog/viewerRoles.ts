/** Session roles allowed to view another employee's timelog details. */
export const TIMELOG_EMPLOYEE_VIEW_ROLES = ["ROLE_HR", "ROLE_ADMIN", "ROLE_MANAGER"] as const;

export function timelogViewerRoles(sessionRoles: string[]): string[] {
  const allowed = new Set<string>(TIMELOG_EMPLOYEE_VIEW_ROLES);
  return sessionRoles.filter((role) => allowed.has(role));
}

export function timelogViewerRolesQueryValue(sessionRoles: string[]): string | undefined {
  const roles = timelogViewerRoles(sessionRoles);
  return roles.length ? roles.join(",") : undefined;
}
