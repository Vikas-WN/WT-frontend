import type {
  DepartmentBandsMap,
  OnboardOptionItem,
  OnboardOptionsResponse,
} from "@/types/onboard-options";
import { parseBandsList } from "@/utils/masters";

function parseOptionItems(raw: unknown): OnboardOptionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const value = String(row.value ?? "").trim();
      const label = String(row.label ?? value).trim();
      if (!value) return null;
      return { value, label: label || value };
    })
    .filter((item): item is OnboardOptionItem => Boolean(item));
}

/** Parse `department_bands` and ensure every department key is present (empty array if none). */
function parseDepartmentBands(
  raw: unknown,
  departments: OnboardOptionItem[]
): DepartmentBandsMap {
  const map: DepartmentBandsMap = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const dept = key.trim();
      if (!dept) continue;
      map[dept] = parseOptionItems(value);
    }
  }
  for (const dept of departments) {
    if (!(dept.value in map)) {
      map[dept.value] = [];
    }
  }
  return map;
}

function isCompleteOptions(parsed: OnboardOptionsResponse): boolean {
  return Boolean(
    parsed.categories.length &&
      parsed.work_modes.length &&
      parsed.work_location_types.length &&
      parsed.user_types.length &&
      parsed.departments.length
  );
}

function unwrapOnboardOptionsPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const envelope = raw as Record<string, unknown>;
  const nested = envelope.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return envelope;
}

/** Directory filter values from GET /masters/onboard-options (`directory_user_types`). */
export const FALLBACK_DIRECTORY_USER_TYPES: OnboardOptionItem[] = [
  { value: "FULLTIME", label: "Full time" },
  { value: "CONSULTANT", label: "Consultant" },
  { value: "HR", label: "HR" },
  { value: "INTERN", label: "Intern" },
];

export function resolveDirectoryUserTypes(options: OnboardOptionsResponse): OnboardOptionItem[] {
  return options.directory_user_types.length
    ? options.directory_user_types
    : FALLBACK_DIRECTORY_USER_TYPES;
}

export function directoryUserTypeFilterOptions(
  options?: OnboardOptionsResponse | null
): OnboardOptionItem[] {
  const types = options ? resolveDirectoryUserTypes(options) : FALLBACK_DIRECTORY_USER_TYPES;
  return [{ value: "", label: "All User Types" }, ...types];
}

/** GET /masters/onboard-options — `{ message, data: { ... } }` or bare options object. */
export function parseOnboardOptions(raw: unknown): OnboardOptionsResponse {
  const row = unwrapOnboardOptionsPayload(raw);
  const directoryUserTypes = parseOptionItems(row.directory_user_types);
  const departments = parseOptionItems(row.departments);

  const parsed: OnboardOptionsResponse = {
    categories: parseOptionItems(row.categories ?? row.delivery_statuses),
    work_modes: parseOptionItems(row.work_modes),
    work_location_types: parseOptionItems(row.work_location_types),
    user_types: parseOptionItems(row.user_types),
    directory_user_types: directoryUserTypes.length
      ? directoryUserTypes
      : FALLBACK_DIRECTORY_USER_TYPES,
    departments,
    department_bands: parseDepartmentBands(row.department_bands, departments),
    genders: parseOptionItems(row.genders),
    marital_statuses: parseOptionItems(row.marital_statuses),
    blood_groups: parseOptionItems(row.blood_groups),
    holiday_calendars: parseOptionItems(row.holiday_calendars),
    reporting_managers: parseOptionItems(row.reporting_managers),
    primary_skills: parseOptionItems(row.primary_skills),
    secondary_skills: parseOptionItems(row.secondary_skills ?? row.primary_skills),
  };

  if (!isCompleteOptions(parsed)) {
    return FALLBACK_ONBOARD_OPTIONS;
  }

  return parsed;
}

/** Bands bundled in GET /masters/onboard-options (`data.bands`). */
export function parseOnboardOptionsBands(raw: unknown): Array<Record<string, unknown>> {
  const row = unwrapOnboardOptionsPayload(raw);
  return parseBandsList(row.bands);
}

/** Used when GET /masters/onboard-options fails or returns invalid data. */
export const FALLBACK_ONBOARD_OPTIONS: OnboardOptionsResponse = {
  categories: [
    { value: "DELIVERY", label: "Delivery" },
    { value: "NON_DELIVERY", label: "Non delivery" },
  ],
  work_modes: [
    { value: "WFO", label: "Work from office" },
    { value: "WFH", label: "Work from home" },
    { value: "HYBRID", label: "Hybrid" },
  ],
  work_location_types: [
    { value: "OFFSHORE", label: "Offshore" },
    { value: "ONSITE", label: "Onsite" },
    { value: "HYBRID", label: "Hybrid" },
    { value: "REMOTE", label: "Remote" },
  ],
  user_types: [
    { value: "FULLTIME", label: "Full time" },
    { value: "INTERN", label: "Intern" },
    { value: "CONSULTANT", label: "Consultant" },
  ],
  directory_user_types: FALLBACK_DIRECTORY_USER_TYPES,
  departments: [
    { value: "AI/ML", label: "AI/ML" },
    { value: "Business Analyst", label: "Business Analyst" },
    { value: "DevOps", label: "DevOps" },
    { value: "Developer", label: "Developer" },
    { value: "Executive", label: "Executive" },
    { value: "Finance", label: "Finance" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Manager", label: "Manager" },
    { value: "QA", label: "QA" },
    { value: "Quality Assurance", label: "Quality Assurance" },
    { value: "UI/UX", label: "UI/UX" },
  ],
  department_bands: {},
  genders: [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  ],
  marital_statuses: [
    { value: "SINGLE", label: "Single" },
    { value: "MARRIED", label: "Married" },
  ],
  blood_groups: [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
  ],
  holiday_calendars: [],
  reporting_managers: [],
  primary_skills: [
    { value: "Communication", label: "Communication" },
    { value: "Presentation Skills", label: "Presentation Skills" },
    { value: "Stakeholder Management", label: "Stakeholder Management" },
    { value: "Client Management", label: "Client Management" },
    { value: "Leadership", label: "Leadership" },
    { value: "People Management", label: "People Management" },
    { value: "Team Management", label: "Team Management" },
    { value: "Mentoring", label: "Mentoring" },
    { value: "Project Coordination", label: "Project Coordination" },
    { value: "Project Management", label: "Project Management" },
    { value: "Program Management", label: "Program Management" },
    { value: "Delivery Management", label: "Delivery Management" },
    { value: "Scrum", label: "Scrum" },
    { value: "Agile", label: "Agile" },
    { value: "Kanban", label: "Kanban" },
    { value: "Business Analysis", label: "Business Analysis" },
    { value: "Requirement Gathering", label: "Requirement Gathering" },
    { value: "Process Improvement", label: "Process Improvement" },
    { value: "Documentation", label: "Documentation" },
    { value: "MS Excel", label: "MS Excel" },
    { value: "Power BI", label: "Power BI" },
    { value: "Tableau", label: "Tableau" },
    { value: "Java", label: "Java" },
    { value: "Spring Boot", label: "Spring Boot" },
    { value: "React", label: "React" },
    { value: "Angular", label: "Angular" },
    { value: "Vue.js", label: "Vue.js" },
    { value: "Node.js", label: "Node.js" },
    { value: "JavaScript", label: "JavaScript" },
    { value: "TypeScript", label: "TypeScript" },
    { value: "Python", label: "Python" },
    { value: "FastAPI", label: "FastAPI" },
    { value: "Django", label: "Django" },
    { value: "Flask", label: "Flask" },
    { value: "Pandas", label: "Pandas" },
    { value: "NumPy", label: "NumPy" },
    { value: ".NET", label: ".NET" },
    { value: "C#", label: "C#" },
    { value: "ASP.NET", label: "ASP.NET" },
    { value: "Go", label: "Go" },
    { value: "Ruby on Rails", label: "Ruby on Rails" },
    { value: "PHP", label: "PHP" },
    { value: "SQL", label: "SQL" },
    { value: "PostgreSQL", label: "PostgreSQL" },
    { value: "MySQL", label: "MySQL" },
    { value: "Oracle", label: "Oracle" },
    { value: "MS SQL Server", label: "MS SQL Server" },
    { value: "MongoDB", label: "MongoDB" },
    { value: "Redis", label: "Redis" },
    { value: "Elasticsearch", label: "Elasticsearch" },
    { value: "Docker", label: "Docker" },
    { value: "Kubernetes", label: "Kubernetes" },
    { value: "AWS", label: "AWS" },
    { value: "Azure", label: "Azure" },
    { value: "GCP", label: "GCP" },
    { value: "DevOps", label: "DevOps" },
    { value: "CI/CD", label: "CI/CD" },
    { value: "Terraform", label: "Terraform" },
    { value: "Jenkins", label: "Jenkins" },
    { value: "GitHub Actions", label: "GitHub Actions" },
    { value: "Linux", label: "Linux" },
    { value: "Networking", label: "Networking" },
    { value: "Cybersecurity", label: "Cybersecurity" },
    { value: "Machine Learning", label: "Machine Learning" },
    { value: "AI/ML", label: "AI/ML" },
    { value: "Data Engineering", label: "Data Engineering" },
    { value: "Data Analysis", label: "Data Analysis" },
    { value: "Data Science", label: "Data Science" },
    { value: "ETL", label: "ETL" },
    { value: "Apache Spark", label: "Apache Spark" },
    { value: "Hadoop", label: "Hadoop" },
    { value: "Quality Assurance", label: "Quality Assurance" },
    { value: "Manual Testing", label: "Manual Testing" },
    { value: "Automation Testing", label: "Automation Testing" },
    { value: "Selenium", label: "Selenium" },
    { value: "Cypress", label: "Cypress" },
    { value: "Playwright", label: "Playwright" },
    { value: "API Testing", label: "API Testing" },
    { value: "Performance Testing", label: "Performance Testing" },
    { value: "UI/UX Design", label: "UI/UX Design" },
    { value: "Figma", label: "Figma" },
    { value: "Adobe XD", label: "Adobe XD" },
    { value: "Graphic Design", label: "Graphic Design" },
    { value: "Android", label: "Android" },
    { value: "iOS", label: "iOS" },
    { value: "Flutter", label: "Flutter" },
    { value: "React Native", label: "React Native" },
    { value: "Kotlin", label: "Kotlin" },
    { value: "Swift", label: "Swift" },
    { value: "Sales", label: "Sales" },
    { value: "Pre-Sales", label: "Pre-Sales" },
    { value: "Recruitment", label: "Recruitment" },
    { value: "HR Operations", label: "HR Operations" },
    { value: "Finance Operations", label: "Finance Operations" },
    { value: "Accounting", label: "Accounting" },
    { value: "Payroll", label: "Payroll" },
  ],
  secondary_skills: [],
};

// Mirror primary skills for secondary filter/suggestions when API is unavailable.
FALLBACK_ONBOARD_OPTIONS.secondary_skills = FALLBACK_ONBOARD_OPTIONS.primary_skills.map((item) => ({
  ...item,
}));

// Ensure every fallback department has a key in department_bands.
FALLBACK_ONBOARD_OPTIONS.department_bands = Object.fromEntries(
  FALLBACK_ONBOARD_OPTIONS.departments.map((d) => [d.value, [] as OnboardOptionItem[]])
);
