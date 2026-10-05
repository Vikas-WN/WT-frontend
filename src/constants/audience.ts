import type { AudienceScope } from "@/types/audience";

export const AUDIENCE_SCOPE_COPY: Record<AudienceScope, { label: string; description: string }> = {
  ALL: { label: "Everyone", description: "All active employees" },
  DEPARTMENT: { label: "Departments", description: "Everyone in the departments you pick" },
  PROJECT: { label: "Projects", description: "People currently allocated to the projects you pick" },
  TEAM: { label: "My team", description: "Everyone who reports to you" },
  USERS: { label: "Specific people", description: "Choose individual people" },
};

export const AUDIENCE_COPY = {
  sendTo: "Send to",
  departmentsLabel: "Departments",
  projectsLabel: "Projects",
  peopleLabel: "People",
  searchPlaceholder: "Search…",
  nothingFound: "No matches",
  selected: "selected",
  loading: "Loading who you can send to…",
  error: "Couldn't load your audience options.",
  chooseOne: "Choose at least one.",
  teamHint: "Goes to everyone who reports to you.",
} as const;

/** One line describing an audience: "Everyone", "2 departments", "5 people"… */
export function describeAudience(scope: AudienceScope, counts: { departments: number; projects: number; users: number }): string {
  switch (scope) {
    case "ALL":
      return "Everyone";
    case "TEAM":
      return "My team";
    case "DEPARTMENT":
      return `${counts.departments} department${counts.departments === 1 ? "" : "s"}`;
    case "PROJECT":
      return `${counts.projects} project${counts.projects === 1 ? "" : "s"}`;
    case "USERS":
      return `${counts.users} ${counts.users === 1 ? "person" : "people"}`;
  }
}
