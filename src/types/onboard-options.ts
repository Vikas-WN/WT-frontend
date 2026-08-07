export interface OnboardOptionItem {
  value: string;
  label: string;
}

/** Map of department name → bands that have at least one designation for that department. */
export type DepartmentBandsMap = Record<string, OnboardOptionItem[]>;

export interface OnboardOptionsResponse {
  categories: OnboardOptionItem[];
  work_modes: OnboardOptionItem[];
  work_location_types: OnboardOptionItem[];
  user_types: OnboardOptionItem[];
  directory_user_types: OnboardOptionItem[];
  departments: OnboardOptionItem[];
  /** Band dropdown options keyed by department value. Prefer over GET /masters/bands. */
  department_bands: DepartmentBandsMap;
  genders: OnboardOptionItem[];
  marital_statuses: OnboardOptionItem[];
  blood_groups: OnboardOptionItem[];
  holiday_calendars: OnboardOptionItem[];
  reporting_managers: OnboardOptionItem[];
  primary_skills: OnboardOptionItem[];
  secondary_skills?: OnboardOptionItem[];
}
