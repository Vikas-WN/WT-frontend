/** Who a piece of content (announcement, event, form) is sent to. Mirrors app/schemas/audience.py. */
export type AudienceScope = "ALL" | "DEPARTMENT" | "PROJECT" | "TEAM" | "USERS";

export interface AudienceSpec {
  scope: AudienceScope;
  departments: string[];
  project_ids: number[];
  user_ids: number[];
}

export interface AudiencePerson {
  id: number;
  name: string;
  email: string;
  department: string | null;
}

export interface AudienceProject {
  id: number;
  code: string;
  name: string;
}

/** What the signed-in person may pick from: HR/Admin everything, managers only their own team. */
export interface AudienceOptions {
  scopes: AudienceScope[];
  departments: string[];
  projects: AudienceProject[];
  people: AudiencePerson[];
}

export const EMPTY_AUDIENCE: AudienceSpec = { scope: "ALL", departments: [], project_ids: [], user_ids: [] };
