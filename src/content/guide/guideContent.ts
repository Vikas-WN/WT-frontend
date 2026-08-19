import { DASHBOARD_ROUTES } from "@/constants/routes";

export type GuideAudience = "shared" | "hr" | "manager";

/** Role-specific handbook export / default view. */
export type GuideHandbookKind = "employee" | "hr" | "manager";

export type GuideStep = {
  title: string;
  body: string;
  tip?: string;
};

export type GuideChapter = {
  id: string;
  audience: GuideAudience;
  title: string;
  summary: string;
  steps: GuideStep[];
  relatedHref?: string;
  figureId?: string;
};

export const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: "getting-started",
    audience: "shared",
    title: "Getting started with WebTrak",
    summary:
      "Learn how to sign in, navigate the sidebar, use notifications, and find the right module for your role.",
    figureId: "navigation",
    steps: [
      {
        title: "Sign in",
        body: "Open the WebTrak login page and sign in with your work email. After authentication you land on the default page for your role (Directory for HR, Time Logs for managers, Profile for employees).",
      },
      {
        title: "Use the sidebar",
        body: "The left sidebar groups features into Employee, Projects, and Personal areas. Expand a group to see child links. Collapse the sidebar on desktop using the chevron at the top.",
        tip: "On mobile, open the menu from the header hamburger icon.",
      },
      {
        title: "Notifications",
        body: "Click the bell icon in the header to review allocation reminders, leave updates, exit survey prompts, and other alerts. Click a notification to jump to the related screen when a deep link is available.",
      },
      {
        title: "Open this handbook",
        body: "Return to Help & Guide from the sidebar anytime. Content is filtered by your role — HR and manager sections appear only when your account has those permissions.",
      },
    ],
  },
  {
    id: "profile-onboarding",
    audience: "shared",
    title: "Profile & self onboarding",
    summary: "Complete your profile, add skills, and unlock full portal access after invite.",
    relatedHref: DASHBOARD_ROUTES.profile,
    figureId: "profile",
    steps: [
      {
        title: "Open Profile",
        body: "Go to Personal → Profile (or use the account menu in the sidebar footer). New invites must complete onboarding before Leave and other modules unlock.",
      },
      {
        title: "Fill required fields",
        body: "Enter personal details, contact information, work mode, and skills. Primary and secondary skills use a rating from 1–5.",
        tip: "Save after each major section if you need to pause — required fields are marked with a red asterisk.",
      },
      {
        title: "Submit onboarding",
        body: "When all mandatory fields are valid, submit onboarding. HR receives a notification and your status moves to Active once processing completes.",
      },
    ],
  },
  {
    id: "leave-self",
    audience: "shared",
    title: "Leave requests (self)",
    summary: "Apply for leave, WFH, optional leave, and track approval status.",
    relatedHref: DASHBOARD_ROUTES.leave,
    figureId: "leave-self",
    steps: [
      {
        title: "Create a request",
        body: "Open Personal → Leave Requests. Choose the request type (Leave, WFH, Optional, etc.), dates, and reason. Primary and secondary managers are routed automatically from your profile.",
      },
      {
        title: "Check balances",
        body: "Review available leave balances before submitting. The form shows validation if dates exceed balance or overlap existing requests.",
      },
      {
        title: "Track status",
        body: "Pending requests appear in your list with status badges. You receive notifications when a manager approves or rejects.",
      },
    ],
  },
  {
    id: "comp-off-self",
    audience: "shared",
    title: "Comp Off (self)",
    summary: "Request comp-off credit or utilization against earned balance.",
    relatedHref: "/dashboard/comp-off",
    steps: [
      {
        title: "Open Comp Off",
        body: "Navigate to Comp Off from the dashboard (or follow a notification deep link). Review your earned balance and pending items.",
      },
      {
        title: "Submit earn or use",
        body: "For comp-off credit, provide worked dates and managers. For utilization, select dates to consume earned comp off.",
        tip: "Ensure primary and secondary manager emails are correct on your profile — routing depends on them.",
      },
    ],
  },
  {
    id: "timelog-self",
    audience: "shared",
    title: "Time logs (self)",
    summary: "Log daily hours against project allocations and submit weekly timesheets.",
    relatedHref: DASHBOARD_ROUTES.timelog,
    figureId: "timelog",
    steps: [
      {
        title: "Select the week",
        body: "Open Personal → Time Logs. Use the week picker to view or edit a specific week.",
      },
      {
        title: "Enter hours",
        body: "Fill hours per project row. Totals should align with your allocations. Save drafts frequently.",
      },
      {
        title: "Submit for approval",
        body: "Submit the week when complete. Rejected weeks can be corrected and resubmitted from the same view.",
      },
    ],
  },
  {
    id: "my-allocations",
    audience: "shared",
    title: "My allocations",
    summary: "View current and upcoming project assignments, roles, and end dates.",
    relatedHref: DASHBOARD_ROUTES["my-allocations"],
    steps: [
      {
        title: "Open My Allocations",
        body: "Personal → My Allocations lists active project assignments with percentage, role, and last working day on the project.",
      },
      {
        title: "Plan around end dates",
        body: "Note upcoming allocation end dates. Managers and HR receive reminders before an allocation ends so extensions or reallocation can be planned.",
      },
    ],
  },
  {
    id: "hr-onboarding",
    audience: "hr",
    title: "Employee onboarding (HR)",
    summary: "Invite employees, assign bands and designations, and track onboarding completion.",
    relatedHref: DASHBOARD_ROUTES.employee,
    figureId: "onboarding",
    steps: [
      {
        title: "Start onboarding",
        body: "Employee → Onboarding. Click to add a new employee. Enter work email, user type (Full-Time, Intern, Consultant), department, band (where applicable), and designation.",
      },
      {
        title: "Primary skills",
        body: "Select primary skills from the predefined list using the multi-select control. At least one skill is required for Full-Time and Consultant profiles.",
        tip: "Consultants do not use bands — designation must be valid for consultant user type.",
      },
      {
        title: "Send invite",
        body: "Submit the form to send an onboarding invite. The employee completes self onboarding on Profile. Resend invite from Directory if needed.",
      },
    ],
  },
  {
    id: "hr-directory",
    audience: "hr",
    title: "Employee directory (HR)",
    summary: "Search, filter, edit profiles, and change user type with validation.",
    relatedHref: DASHBOARD_ROUTES["employee-directory"],
    figureId: "directory",
    steps: [
      {
        title: "Find employees",
        body: "Employee → Directory. Search by name, email, or role. Filter by presence, user type, primary skill, or secondary skill.",
      },
      {
        title: "Open a profile",
        body: "Click a row to open the employee profile. Use Edit Profile to update HR-managed fields.",
      },
      {
        title: "Change user type",
        body: "Use the User Type control on the profile. Transitions (e.g. Full-Time → Consultant) may require a confirmation dialog, transition date, and band change. Consultant conversion clears invalid designations.",
        tip: "After changing user type, offboarding and directory views refresh to reflect consultant vs full-time rules.",
      },
      {
        title: "Serving notice",
        body: "When moving status to Serving Notice, enter resignation date and last working day (Full-Time). Both dates are mandatory before save.",
      },
    ],
  },
  {
    id: "hr-holiday-calendars",
    audience: "hr",
    title: "Holiday calendars (HR)",
    summary: "Maintain org holiday calendars used for leave and attendance calculations.",
    relatedHref: DASHBOARD_ROUTES["holiday-calendars"],
    steps: [
      {
        title: "Open Holiday Calendar",
        body: "Employee → Holiday Calendar. Review existing calendars and holidays.",
      },
      {
        title: "Add or edit holidays",
        body: "Create calendar entries for the financial or calendar year. Ensure employees are mapped to the correct calendar on their profile where applicable.",
      },
    ],
  },
  {
    id: "hr-offboarding",
    audience: "hr",
    title: "Offboarding (HR)",
    summary: "Record exits for Full-Time, Intern, and Consultant employees with correct fields and exit surveys.",
    relatedHref: DASHBOARD_ROUTES.offboarding,
    figureId: "offboarding",
    steps: [
      {
        title: "Select employee",
        body: "Employee → Offboarding. Choose an eligible active or invited employee from the dropdown.",
      },
      {
        title: "Full-Time exits",
        body: "Enter resignation date and last working day (notice period). Select exit type Voluntary or Involuntary. Fill details, critical skill, and regretted flag.",
      },
      {
        title: "Consultant / contractual exits",
        body: "Only last working day is required. Exit type is fixed as Contractual. Resignation date and notice period do not apply.",
        tip: "The offboarded list shows resignation only for Full-Time rows.",
      },
      {
        title: "Intern exits",
        body: "Use a single last working day — resignation date mirrors the same date automatically.",
      },
      {
        title: "Exit survey",
        body: "Active employees enter serving notice and receive exit survey reminders. Resend surveys from the offboarded table or bulk-select resendable rows.",
      },
    ],
  },
  {
    id: "hr-exit-survey",
    audience: "hr",
    title: "Exit survey follow-up (HR)",
    summary: "Track pending and submitted exit surveys and view responses.",
    relatedHref: DASHBOARD_ROUTES["exit-interview"],
    figureId: "exit-survey",
    steps: [
      {
        title: "Open Exit Survey",
        body: "Navigate to Exit Survey from the dashboard menu (HR). Review employees with pending or completed surveys.",
      },
      {
        title: "Resend reminders",
        body: "Use resend actions for eligible employees. Notifications include employee and project context where configured.",
      },
      {
        title: "View submissions",
        body: "Open submission detail to read responses and separation metadata. Contractual exits may omit resignation date in the detail view.",
      },
    ],
  },
  {
    id: "hr-allocation",
    audience: "hr",
    title: "Project allocation (HR)",
    summary: "Assign employees to projects, manage talent pool, and monitor bench.",
    relatedHref: DASHBOARD_ROUTES.allocation,
    figureId: "allocation",
    steps: [
      {
        title: "Clients and projects",
        body: "Projects → Clients maintains client records. Projects → Project Allocation assigns employees with role, percentage, and end date.",
      },
      {
        title: "Create allocation",
        body: "Select project and employee(s). Set allocation percentage, role, start date, and end date. Validate total allocation does not exceed 100% per day.",
      },
      {
        title: "Talent pool",
        body: "Projects → Talent Pool shows unallocated or bench resources for staffing decisions.",
      },
      {
        title: "Ending allocations",
        body: "Managers and HR receive in-app and email reminders before an allocation end date, including project name in the notification.",
      },
    ],
  },
  {
    id: "hr-team-leave",
    audience: "hr",
    title: "Team leave requests (HR)",
    summary: "Review and act on team leave, WFH, and optional leave as HR.",
    relatedHref: DASHBOARD_ROUTES["leave-team"],
    figureId: "leave-team",
    steps: [
      {
        title: "Open team inbox",
        body: "Employee → Leave Requests (team view). Filter by request type including Optional leave and Comp Off Credit.",
      },
      {
        title: "Approve or reject",
        body: "Open a request to see dates, reason, and routing. Approve or reject with comments where required.",
      },
      {
        title: "Notifications",
        body: "Clicking leave notifications opens the team inbox with the relevant filter when deep-linked.",
      },
    ],
  },
  {
    id: "hr-team-timelog",
    audience: "hr",
    title: "Team time logs (HR)",
    summary: "Review submitted timesheets and project-level time log reports.",
    relatedHref: DASHBOARD_ROUTES["timelog-team"],
    steps: [
      {
        title: "Open team time logs",
        body: "Employee → Time Logs (team). Select project or employee views as available.",
      },
      {
        title: "Review submissions",
        body: "Approve or reject weekly submissions. Follow up on missing logs via notifications.",
      },
    ],
  },
  {
    id: "hr-bgv",
    audience: "hr",
    title: "Background verification (HR)",
    summary: "Track BGV status and compliance for employees.",
    relatedHref: DASHBOARD_ROUTES["background-verification"],
    steps: [
      {
        title: "Open BGV module",
        body: "Background Verification from the sidebar. Filter by status and employee.",
      },
      {
        title: "Update records",
        body: "Record verification progress and outcomes per employee policy.",
      },
    ],
  },
  {
    id: "hr-reports",
    audience: "hr",
    title: "Reports (HR)",
    summary: "Workforce, utilization, bench, attrition, skills, compliance, and BGV dashboards.",
    relatedHref: DASHBOARD_ROUTES["reports-workforce"],
    figureId: "reports",
    steps: [
      {
        title: "Open Reports",
        body: "Expand Reports in the sidebar. Choose Workforce Overview, Utilization, Bench, Attrition & Retention, Skills, Compliance, or BGV Dashboard.",
      },
      {
        title: "Filter by period",
        body: "Use date and FY controls where shown. Export or screenshot tables for leadership reviews.",
        tip: "Contractual consultant exits are excluded from attrition percentage metrics.",
      },
    ],
  },
  {
    id: "hr-uploads-masters",
    audience: "hr",
    title: "Uploads & masters (HR / Admin)",
    summary: "Bulk imports and reference data maintenance.",
    relatedHref: DASHBOARD_ROUTES.uploads,
    steps: [
      {
        title: "Uploads",
        body: "Uploads supports bulk data imports per template. Follow on-screen validation errors row by row.",
      },
      {
        title: "Masters",
        body: "Masters (Admin/HR) maintains bands, designations, departments, and related reference lists used across onboarding and directory.",
      },
    ],
  },
  {
    id: "hr-learning",
    audience: "hr",
    title: "Learning & development (overview)",
    summary: "Schedule trainings, track attendance, assessments, and scores.",
    relatedHref: DASHBOARD_ROUTES.learning,
    steps: [
      {
        title: "Navigate L&D",
        body: "Learning & Development in the sidebar opens trainings, sessions, materials, participants, assessments, and analytics.",
      },
      {
        title: "Manage trainings",
        body: "Create trainings, assign participants, record attendance, and publish scores when assessments complete.",
      },
    ],
  },
  {
    id: "mgr-team-leave",
    audience: "manager",
    title: "Team leave requests (Manager)",
    summary: "Approve leave, WFH, optional leave, and understand primary vs secondary manager routing.",
    relatedHref: DASHBOARD_ROUTES["leave-team"],
    figureId: "leave-team",
    steps: [
      {
        title: "Open your inbox",
        body: "Employee → Leave Requests. You see requests where you are primary or secondary manager.",
      },
      {
        title: "Optional leave",
        body: "Optional leave requests appear in your team list — filter by request type if needed.",
      },
      {
        title: "Approve or reject",
        body: "Review dates and balance impact. Approve to finalize or reject with a reason.",
        tip: "Secondary managers may receive notifications and can act when designated as approvers.",
      },
    ],
  },
  {
    id: "mgr-comp-off",
    audience: "manager",
    title: "Comp Off credit (Manager)",
    summary: "Review and approve comp-off earn requests for your team.",
    relatedHref: "/dashboard/comp-off/team",
    steps: [
      {
        title: "Open Comp Off team view",
        body: "Navigate to Comp Off → Team (or follow notification links). Filter to Comp Off Credit requests.",
      },
      {
        title: "Act on earn requests",
        body: "Primary and secondary managers can approve or reject earn requests when listed as approvers. Ensure request dates and worked days match policy.",
      },
    ],
  },
  {
    id: "mgr-team-timelog",
    audience: "manager",
    title: "Team time logs (Manager)",
    summary: "Approve weekly timesheets for your project team.",
    relatedHref: DASHBOARD_ROUTES["timelog-team"],
    figureId: "timelog",
    steps: [
      {
        title: "Select project or week",
        body: "Employee → Time Logs. Drill into submitted weeks for your reports.",
      },
      {
        title: "Approve or send back",
        body: "Reject with feedback if hours do not match expectations; employees revise and resubmit.",
      },
    ],
  },
  {
    id: "mgr-allocation-extension",
    audience: "manager",
    title: "Extend project allocation (Manager)",
    summary: "Request allocation extensions before end dates.",
    relatedHref: DASHBOARD_ROUTES["allocation-extension"],
    figureId: "allocation-extension",
    steps: [
      {
        title: "Open extension requests",
        body: "Projects → Extend Project Allocation. Select project and employees needing extended end dates.",
      },
      {
        title: "Submit for approval",
        body: "Provide new end date and justification. HR or account managers approve per workflow.",
      },
      {
        title: "Respond to ending reminders",
        body: "When you receive an allocation ending notification, note the project name and employee, then extend or reallocate promptly.",
      },
    ],
  },
];

export type GuideExportAudience = GuideHandbookKind;

export function resolvePrimaryHandbook(options: {
  hasHrAccess: boolean;
  hasManagerAccess: boolean;
  hasDmAccess?: boolean;
}): GuideHandbookKind {
  if (options.hasHrAccess) return "hr";
  if (options.hasManagerAccess || options.hasDmAccess) return "manager";
  return "employee";
}

export function handbookMeta(kind: GuideHandbookKind): {
  title: string;
  pageTitle: string;
  subtitle: string;
  filename: string;
  downloadLabel: string;
} {
  switch (kind) {
    case "hr":
      return {
        title: "HR Handbook",
        pageTitle: "WebTrak HR Handbook",
        subtitle:
          "Onboarding, directory, offboarding, allocation, reports, and HR team workflows.",
        filename: "WebTrak-HR-Handbook.pdf",
        downloadLabel: "Download HR Handbook",
      };
    case "manager":
      return {
        title: "Manager Handbook",
        pageTitle: "WebTrak Manager Handbook",
        subtitle:
          "Team leave, comp off, time logs, allocation extensions, and people management.",
        filename: "WebTrak-Manager-Handbook.pdf",
        downloadLabel: "Download Manager Handbook",
      };
    default:
      return {
        title: "Employee Handbook",
        pageTitle: "WebTrak Employee Handbook",
        subtitle:
          "Profile, leave, comp off, time logs, allocations, and everyday self-service tasks.",
        filename: "WebTrak-Employee-Handbook.pdf",
        downloadLabel: "Download Employee Handbook",
      };
  }
}

export function filterChaptersForRoles(
  chapters: GuideChapter[],
  options: { hasHrAccess: boolean; hasManagerAccess: boolean; hasDmAccess?: boolean }
): GuideChapter[] {
  const canManager = options.hasManagerAccess || options.hasDmAccess;
  return chapters.filter((chapter) => {
    if (chapter.audience === "shared") return true;
    if (chapter.audience === "hr") return options.hasHrAccess;
    if (chapter.audience === "manager") return canManager;
    return false;
  });
}

export function filterChaptersForHandbook(
  chapters: GuideChapter[],
  handbook: GuideHandbookKind
): GuideChapter[] {
  if (handbook === "employee") {
    return chapters.filter((c) => c.audience === "shared");
  }
  if (handbook === "hr") {
    return chapters.filter((c) => c.audience === "shared" || c.audience === "hr");
  }
  return chapters.filter((c) => c.audience === "shared" || c.audience === "manager");
}

/** @deprecated Use filterChaptersForHandbook */
export function filterChaptersByAudience(
  chapters: GuideChapter[],
  handbook: GuideHandbookKind
): GuideChapter[] {
  return filterChaptersForHandbook(chapters, handbook);
}

export function guideAudienceLabel(
  audience: GuideAudience,
  handbook?: GuideHandbookKind
): string {
  if (audience === "shared") {
    return handbook === "employee" || !handbook ? "Employee" : "Everyone";
  }
  if (audience === "hr") return "HR";
  return "Manager";
}

export function availableHandbookFilters(options: {
  hasHrAccess: boolean;
  hasManagerAccess: boolean;
  hasDmAccess?: boolean;
}): GuideHandbookKind[] {
  const canManager = options.hasManagerAccess || options.hasDmAccess;
  if (options.hasHrAccess && canManager) return ["hr", "manager"];
  return [];
}
