import type { SidebarIconName } from "@/constants/sidebarIcons";
import { toTitleCase } from "@/utils/titleCase";

export type NavChild = {
  id: string;
  label: string;
  roles: string[];
  icon: SidebarIconName;
};

export type NavGroup = {
  kind: "group";
  id: "employee" | "projects" | "personal";
  label: string;
  icon: SidebarIconName;
  children: NavChild[];
};

export type NavLink = {
  kind: "link";
  id: string;
  label: string;
  roles: string[];
  icon: SidebarIconName;
  externalUrl?: string;
};

export type NavExpandable = {
  kind: "expandable";
  id: string;
  label: string;
  roles: string[];
  icon: SidebarIconName;
  children: Array<{ id: string; label: string; icon?: SidebarIconName; roles?: string[] }>;
};

export type NavItem = NavGroup | NavLink | NavExpandable;

export const dashboardNavigation: NavItem[] = [
  {
    kind: "group",
    id: "employee",
    label: "Employee",
    icon: "users",
    children: [
      {
        id: "employee",
        label: "Onboarding",
        roles: ["ROLE_HR", "ROLE_ADMIN"],
        icon: "userPlus",
      },
      {
        id: "employee-directory",
        label: "Directory",
        roles: ["ROLE_HR", "ROLE_ADMIN"],
        icon: "bookUser",
      },
      {
        id: "holiday-calendars",
        label: "Holiday Calendar",
        roles: ["ROLE_HR", "ROLE_ADMIN"],
        icon: "calendarDays",
      },
      {
        id: "offboarding",
        label: "Offboarding",
        roles: ["ROLE_HR"],
        icon: "userMinus",
      },
      {
        id: "leave-team",
        label: "Leave Requests",
        roles: ["ROLE_MANAGER", "ROLE_DM", "ROLE_HR", "ROLE_ADMIN"],
        icon: "calendarDays",
      },
      {
        id: "timelog-team",
        label: "Time Logs",
        roles: ["ROLE_MANAGER", "ROLE_HR", "ROLE_ADMIN"],
        icon: "clock",
      },
    ],
  },
  {
    kind: "group",
    id: "projects",
    label: "Projects",
    icon: "folder",
    children: [
      {
        id: "clients",
        label: "Clients",
        roles: ["ROLE_HR", "ROLE_ADMIN"],
        icon: "bookUser",
      },
      {
        id: "allocation",
        label: "Project Allocation",
        roles: ["ROLE_HR", "ROLE_ADMIN"],
        icon: "layoutGrid",
      },
      {
        id: "allocation-extension",
        label: "Extend Project Allocation",
        roles: ["ROLE_MANAGER", "ROLE_AM", "ROLE_HR", "ROLE_ADMIN"],
        icon: "calendarRange",
      },
      {
        id: "talent-pool",
        label: "Talent Pool",
        roles: ["ROLE_HR"],
        icon: "users",
      },
    ],
  },
  {
    kind: "group",
    id: "personal",
    label: "Personal",
    icon: "user",
    children: [
      {
        id: "timelog",
        label: "Time Logs",
        roles: ["ROLE_EMPLOYEE", "ROLE_AM", "ROLE_MANAGER", "ROLE_HR", "ROLE_ADMIN"],
        icon: "clock",
      },
      {
        id: "leave",
        label: "Leave Requests",
        roles: ["ROLE_EMPLOYEE", "ROLE_AM", "ROLE_MANAGER", "ROLE_DM", "ROLE_HR", "ROLE_ADMIN"],
        icon: "calendarDays",
      },
      {
        id: "my-allocations",
        label: "My Allocations",
        roles: ["ROLE_EMPLOYEE", "ROLE_AM", "ROLE_MANAGER", "ROLE_DM", "ROLE_HR", "ROLE_ADMIN"],
        icon: "layoutGrid",
      },
      {
        id: "annual-calendar",
        label: "Annual Calendar",
        roles: [
          "ROLE_EMPLOYEE",
          "ROLE_MANAGER",
          "ROLE_DM",
          "ROLE_HR",
          "ROLE_ADMIN",
          "ROLE_FINANCE",
          "ROLE_AM",
        ],
        icon: "calendarDays",
      },
      {
        id: "exit-interview",
        label: "Exit Survey",
        roles: ["ROLE_EMPLOYEE"],
        icon: "fileText",
      },
    ],
  },
  { kind: "link", id: "resumes", label: "Resumes", roles: ["ROLE_AM"], icon: "fileText" },
  {
    kind: "link",
    id: "background-verification",
    label: "Background Verification",
    roles: ["ROLE_EMPLOYEE", "ROLE_AM", "ROLE_MANAGER", "ROLE_DM", "ROLE_HR", "ROLE_ADMIN", "ROLE_FINANCE"],
    icon: "shield",
  },
  {
    kind: "expandable",
    id: "learning",
    label: "Learning & Development",
    roles: ["ROLE_EMPLOYEE", "ROLE_AM", "ROLE_MANAGER", "ROLE_HR", "ROLE_ADMIN"],
    icon: "graduationCap",
    children: [],
  },
  {
    kind: "expandable",
    id: "reports",
    label: "Reports",
    roles: ["ROLE_HR", "ROLE_ADMIN"],
    icon: "barChart",
    children: [
      { id: "reports-workforce", label: "Workforce Overview" },
      { id: "reports-section-2", label: "Utilization vs Effort" },
      { id: "reports-bench", label: "Bench", roles: ["ROLE_HR"] },
      { id: "reports-section-3", label: "Attrition & Retention" },
      { id: "reports-section-4", label: "Skill & Capacity Report" },
      { id: "reports-section-6", label: "Compliance & Risk Support Report" },
      { id: "reports-section-7", label: "BGV Report Dashboard" },
    ],
  },
  { kind: "link", id: "uploads", label: "Uploads", roles: ["ROLE_HR", "ROLE_ADMIN"], icon: "upload" },
  { kind: "link", id: "apps", label: "Apps", roles: ["ROLE_ADMIN"], icon: "code" },
  {
    kind: "link",
    id: "referral",
    label: "Referral",
    roles: [
      "ROLE_EMPLOYEE",
      "ROLE_AM",
      "ROLE_MANAGER",
      "ROLE_DM",
      "ROLE_HR",
      "ROLE_ADMIN",
      "ROLE_FINANCE",
    ],
    icon: "referral",
  },
  {
    kind: "link",
    id: "pulse",
    label: "Pulse",
    roles: ["ROLE_EMPLOYEE", "ROLE_AM", "ROLE_MANAGER", "ROLE_DM", "ROLE_HR", "ROLE_ADMIN"],
    icon: "trendingUp",
  },
];

function childVisible(
  child: NavChild,
  userRoles: string[],
  options: { hasHrAccess: boolean; showExitSurveyNav?: boolean }
): boolean {
  if (child.id === "employee" && !options.hasHrAccess) return false;
  if (child.id === "exit-interview" && !options.showExitSurveyNav) return false;
  return child.roles.length === 0 ? true : child.roles.some((r) => userRoles.includes(r));
}

export function filterVisibleNavigation(
  items: NavItem[],
  userRoles: string[],
  options: { hasHrAccess: boolean; hasAccountManagerAccess?: boolean; showExitSurveyNav?: boolean }
): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    if (item.kind === "group") {
      // The Employee module (onboarding, directory, HR/manager team views) is an
      // HR/admin/manager surface — never show it to plain employees or non-staff roles.
      if (
        item.id === "employee" &&
        !["ROLE_HR", "ROLE_ADMIN", "ROLE_MANAGER", "ROLE_DM"].some((role) =>
          userRoles.includes(role)
        )
      ) {
        continue;
      }
      const children = item.children.filter((child) => childVisible(child, userRoles, options));
      if (children.length) result.push({ ...item, children });
      continue;
    }

    if (item.kind === "link" || item.kind === "expandable") {
      if (item.id === "employee" && !options.hasHrAccess) continue;
      if (item.roles.length === 0 ? false : !item.roles.some((r) => userRoles.includes(r))) continue;
      if (item.kind === "expandable") {
        const children = item.children.filter(
          (child) =>
            !child.roles?.length || child.roles.some((role) => userRoles.includes(role))
        );
        result.push({ ...item, children });
      } else {
        result.push(item);
      }
    }
  }
  return result;
}

export function getDashboardSectionLabel(sectionId: string): string | undefined {
  for (const item of dashboardNavigation) {
    if (item.kind === "group") {
      const hit = item.children.find((child) => child.id === sectionId);
      if (hit) return hit.label;
      continue;
    }
    if (item.kind === "link" && item.id === sectionId) {
      return item.label;
    }
    if (item.kind === "expandable") {
      if (item.id === sectionId) return item.label;
      const hit = item.children.find((child) => child.id === sectionId);
      if (hit) return hit.label;
    }
  }
  return undefined;
}

/** Map nav id to sidebar group id for accordion auto-expand. */
export function navGroupForSection(sectionId: string): "employee" | "projects" | "personal" | null {
  for (const item of dashboardNavigation) {
    if (item.kind !== "group") continue;
    if (item.children.some((child) => child.id === sectionId)) return item.id;
  }
  return null;
}

/** Expandable sections that participate in the accordion (groups + reports + learning). */
export type AccordionSectionId = "employee" | "projects" | "personal" | "reports" | "learning";

export function accordionSectionForPathname(pathname: string, activeSection: string): AccordionSectionId | null {
  const group = navGroupForSection(activeSection);
  if (group) return group;
  if (activeSection.startsWith("reports-")) return "reports";
  if (pathname.startsWith("/dashboard/learning-development")) return "learning";
  return null;
}

const PAGE_TITLE_OVERRIDES: Record<string, string> = {
  profile: "Profile",
  settings: "Settings",
  overview: "Overview",
  "employee-directory": "Employee Directory",
  employee: "Onboarding",
  offboarding: "Offboarding",
  timelog: "Time Logs",
  leave: "Leave Request",
  "my-allocations": "My Allocations",
  "leave-team": "Leave Requests",
  "exit-interview": "Exit Survey",
};

function groupChildPageTitle(groupLabel: string, childLabel: string): string {
  const child = childLabel.toLowerCase();
  const group = groupLabel.toLowerCase();
  const groupSingular = group.replace(/s$/, "");
  // Skip the group prefix when the child already conveys the group context,
  // matching both plural ("Projects") and singular ("Project Allocation") forms.
  if (child.startsWith(group) || child.startsWith(groupSingular)) {
    return toTitleCase(childLabel);
  }
  return `${groupLabel} ${toTitleCase(childLabel)}`;
}

/** Page header title for the active dashboard section. */
export function dashboardPageTitle(sectionId: string): string {
  if (PAGE_TITLE_OVERRIDES[sectionId]) {
    return PAGE_TITLE_OVERRIDES[sectionId];
  }

  for (const item of dashboardNavigation) {
    if (item.kind === "group") {
      const child = item.children.find((c) => c.id === sectionId);
      if (child) return groupChildPageTitle(item.label, child.label);
    }
    if (item.kind === "link" && item.id === sectionId) {
      return item.label;
    }
    if (item.kind === "expandable") {
      if (item.id === sectionId) return item.label;
      const child = item.children.find((c) => c.id === sectionId);
      if (child) return child.label;
    }
  }

  return toTitleCase(sectionId.replace(/-/g, " "));
}
