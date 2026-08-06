// Mirrors backend ASSIGNABLE_API_KEY_ROLES (AUTHENTICATED_ROLES minus ROLE_ADMIN).
// If the backend list changes, update this and vice versa.
export const ASSIGNABLE_APP_ROLES: readonly string[] = [
  "ROLE_EMPLOYEE",
  "ROLE_HR",
  "ROLE_MANAGER",
  "ROLE_FINANCE",
  "ROLE_AM",
  "ROLE_DM",
] as const;
