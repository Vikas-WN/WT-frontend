
/** Path for each dashboard nav id (route-based; no ?tab=). */
export const DASHBOARD_ROUTES: Record<string, string> = {
  home: "/dashboard/home",
  overview: "/dashboard/overview",
  "employee-directory": "/dashboard/employee-directory",
  resumes: "/dashboard/resumes",
  "employee-assign-am": "/dashboard/employee/assign-account-manager",
  employee: "/dashboard/employee",
  allocation: "/dashboard/allocation",
  clients: "/dashboard/clients",
  "talent-pool": "/dashboard/allocation/talent-pool",
  "allocation-extension": "/dashboard/allocation-extension",
  "my-allocations": "/dashboard/my-allocations",
  colleague: "/dashboard/colleague",
  offboarding: "/dashboard/offboarding",
  "background-verification": "/dashboard/background-verification",
  timelog: "/dashboard/timelog",
  "timelog-team": "/dashboard/timelog/projects",
  leave: "/dashboard/leave",
  "leave-team": "/dashboard/leave/team",
  "whos-out": "/dashboard/whos-out",
  "annual-calendar": "/dashboard/annual-calendar",
  "holiday-calendars": "/dashboard/holiday-calendars",
  wiki: "/dashboard/wiki",
  policies: "/dashboard/policies",
  learning: "/dashboard/learning-development",
  "reports-workforce": "/dashboard/reports/workforce",
  "reports-section-2": "/dashboard/reports/utilization",
  "reports-bench": "/dashboard/reports/bench",
  "reports-section-3": "/dashboard/reports/attrition",
  "reports-section-4": "/dashboard/reports/skills",
  "reports-section-5": "/dashboard/reports/engagement",
  "reports-section-6": "/dashboard/reports/compliance",
  "reports-section-7": "/dashboard/reports/bgv-dashboard",
  "reports-lop": "/dashboard/reports/lop",
  uploads: "/dashboard/uploads",
  apps: "/dashboard/apps",
  pulse: "/dashboard/pulse",
  referral: "/dashboard/referral",
  masters: "/dashboard/masters",
  profile: "/dashboard/profile",
  settings: "/dashboard/settings",
  "exit-interview": "/dashboard/exit-interview",
  guide: "/guide",
};

export const DASHBOARD_DEFAULT_PATH = DASHBOARD_ROUTES["home"];

const PATH_TO_NAV_ID: Array<{ prefix: string; id: string }> = [
  { prefix: "/dashboard/learning-development", id: "learning" },
  { prefix: "/dashboard/reports/workforce", id: "reports-workforce" },
  { prefix: "/dashboard/reports/utilization", id: "reports-section-2" },
  { prefix: "/dashboard/reports/bench", id: "reports-bench" },
  { prefix: "/dashboard/reports/attrition", id: "reports-section-3" },
  { prefix: "/dashboard/reports/skills", id: "reports-section-4" },
  { prefix: "/dashboard/reports/engagement", id: "reports-section-5" },
  { prefix: "/dashboard/reports/compliance", id: "reports-section-6" },
  { prefix: "/dashboard/reports/bgv-dashboard", id: "reports-section-7" },
  { prefix: "/dashboard/reports/lop", id: "reports-lop" },
  { prefix: "/dashboard/home", id: "home" },
  { prefix: "/dashboard/overview", id: "overview" },
  { prefix: "/dashboard/employee-directory", id: "employee-directory" },
  { prefix: "/dashboard/resumes", id: "resumes" },
  { prefix: "/dashboard/employee/assign-account-manager", id: "employee" },
  { prefix: "/dashboard/employee", id: "employee" },
  { prefix: "/dashboard/clients", id: "clients" },
  { prefix: "/dashboard/allocation/talent-pool", id: "talent-pool" },
  { prefix: "/dashboard/allocation-extension", id: "allocation-extension" },
  { prefix: "/dashboard/my-allocations", id: "my-allocations" },
  { prefix: "/dashboard/colleague", id: "my-allocations" },
  { prefix: "/dashboard/allocation", id: "allocation" },
  { prefix: "/dashboard/offboarding", id: "offboarding" },
  { prefix: "/dashboard/background-verification", id: "background-verification" },
  { prefix: "/dashboard/timelog/team", id: "timelog-team" },
  { prefix: "/dashboard/timelog/projects", id: "timelog-team" },
  { prefix: "/dashboard/timelog", id: "timelog" },
  { prefix: "/dashboard/leave/team", id: "leave-team" },
  { prefix: "/dashboard/leave", id: "leave" },
  { prefix: "/dashboard/whos-out", id: "whos-out" },
  { prefix: "/dashboard/annual-calendar", id: "annual-calendar" },
  { prefix: "/dashboard/holiday-calendars", id: "holiday-calendars" },
  { prefix: "/dashboard/wiki", id: "wiki" },
  { prefix: "/dashboard/policies", id: "policies" },
  { prefix: "/dashboard/uploads", id: "uploads" },
  { prefix: "/dashboard/apps", id: "apps" },
  { prefix: "/dashboard/masters", id: "masters" },
  { prefix: "/dashboard/referral", id: "referral" },
  { prefix: "/dashboard/pulse", id: "pulse" },
  { prefix: "/dashboard/profile", id: "profile" },
  { prefix: "/dashboard/settings", id: "settings" },
  { prefix: "/guide", id: "guide" },
  { prefix: "/dashboard/exit-interview", id: "exit-interview" },
];

export function dashboardNavIdFromPathname(pathname: string): string {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return "employee-directory";
  }
  for (const { prefix, id } of PATH_TO_NAV_ID) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return id;
    }
  }
  return "employee-directory";
}

export function isDashboardNavChildActive(
  childId: string,
  activeSection: string,
  pathname: string,
  options?: { hasHrAccess?: boolean; hasManagerAccess?: boolean; hasDmAccess?: boolean }
): boolean {
  if (activeSection === childId) return true;
  const onTeamLeave =
    pathname === "/dashboard/leave/team" || pathname.startsWith("/dashboard/leave/team/");
  if (!onTeamLeave) return false;
  if (childId === "leave-team" && onTeamLeave) return true;
  return false;
}

export function dashboardHref(navId: string): string {
  return DASHBOARD_ROUTES[navId] ?? DASHBOARD_DEFAULT_PATH;
}

export function employeeDirectoryProfilePath(empId: string): string {
  const id = encodeURIComponent(String(empId).trim());
  return `/dashboard/employee-directory/${id}`;
}

export function colleagueProfilePath(empId: string): string {
  const id = encodeURIComponent(String(empId).trim());
  return `/dashboard/colleague/${id}`;
}

/** Landing route after login based on the user's roles. */
export function defaultDashboardPathForRoles(_roles: string[]): string {
  // Every authenticated user now lands on the Home dashboard. (INVITED /
  // ONBOARDING employees are still routed to the onboarding form earlier, by
  // shouldRequireSelfOnboardingForUser.) To restore the old per-role landings,
  // revert this commit — the mapping was: HR/Admin/Finance → Directory,
  // AM → Resumes, DM → Team Leave, Manager → Time Logs, Employee → Profile.
  return DASHBOARD_ROUTES.home;
}
