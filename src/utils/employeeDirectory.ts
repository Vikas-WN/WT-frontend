import { formatSecondarySkillsForProfile } from "@/components/dashboard/ui/profile";
import type { OnboardListItem } from "@/types/onboard";
import { pickResumeShareLink } from "@/utils/employeeResume";
import { formatApiDateDisplay } from "@/utils/apiDate";
import { formatUserTypeLabel } from "@/utils/offboardingFormState";
import { formatPrimaryPortalRoleLabel, formatRoleDisplayValue, isSessionRoleValue, formatRoleLabel } from "@/utils/roles";
import {
  formatPhoneNumberForApi,
  splitPhoneNumber,
} from "@/utils/phoneCountries";
import { normalizeEmployeeStatusKey } from "@/utils/userStatus";

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

function formatWorkModeLabel(value: unknown): string {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return "—";
  if (normalized === "HYBRID") return "Hybrid";
  if (normalized === "REMOTE") return "Remote";
  if (normalized === "ONSITE" || normalized === "ON_SITE") return "Onsite";
  return String(value ?? "").trim() || "—";
}

function formatWorkLocationLabel(value: unknown): string {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return "—";
  if (normalized === "REMOTE") return "Remote";
  if (normalized === "ONSITE" || normalized === "ON_SITE") return "Onsite";
  return String(value ?? "").trim() || "—";
}

function formatCategoryLabel(value: unknown): string {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return "—";
  if (normalized === "DELIVERY") return "Delivery";
  if (normalized === "NON_DELIVERY" || normalized === "NONDELIVERY") return "Non-Delivery";
  return String(value ?? "").trim() || "—";
}

function formatBandForProfile(profile: Record<string, unknown>): string {
  const label = pickProfileField(profile, ["band_name", "bandName", "band"]);
  if (label != null) {
    const text = String(label).trim();
    if (text && !/^\d+$/.test(text)) return text;
  }
  const bandId = pickProfileField(profile, ["band_id", "bandId"]);
  return bandId != null ? `Band ${String(bandId).trim()}` : "—";
}

function formatReportingManagerForProfile(profile: Record<string, unknown>): string {
  const manager = pickProfileField(profile, [
    "reporting_manager",
    "reportingManager",
    "manager_name",
    "managerName",
    "manager",
  ]);
  return manager != null ? String(manager).trim() || "—" : "—";
}

function isInternProfile(profile: Record<string, unknown>): boolean {
  return String(pickProfileField(profile, ["user_type", "userType"]) ?? "")
    .trim()
    .toUpperCase() === "INTERN";
}

function isConsultantProfile(profile: Record<string, unknown>): boolean {
  return String(pickProfileField(profile, ["user_type", "userType"]) ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]/g, "") === "CONSULTANT";
}

function formatDirectoryDate(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "—";
  return formatApiDateDisplay(s);
}

type OnboardRowInput = OnboardListItem | Record<string, unknown>;

function asOnboardRecord(row: OnboardRowInput): Record<string, unknown> {
  return row as Record<string, unknown>;
}

export function rowEmpId(row: Record<string, unknown>): string {
  return String(
    row.emp_id ?? row.empId ?? row.employee_id ?? row.employeeId ?? ""
  ).trim();
}

/** Stable list/react key — prefer emp id, fall back to email so invited rows still show. */
export function rowDirectoryKey(row: Record<string, unknown>): string {
  return rowEmpId(row) || rowEmail(row);
}

export function rowEmail(row: Record<string, unknown>): string {
  const direct = String(
    row.email ?? row.user_email ?? row.userEmail ?? row.employee_email ?? ""
  ).trim();
  if (direct) {
    return direct.toLowerCase().startsWith("email:") ? direct.slice(6).trim() : direct;
  }
  const name = String(row.name ?? "").trim();
  const fromName = name.match(/\(([^()@\s]+@[^()@\s]+\.[^()@\s]+)\)\s*$/)?.[1];
  return fromName?.trim() ?? "";
}

export function cleanEmployeeName(row: Record<string, unknown>): string {
  const raw = String(row.name ?? "Employee").trim();
  return raw.replace(/\s*\([^()@\s]+@[^()@\s]+\.[^()@\s]+\)\s*$/, "").trim() || raw || "Employee";
}

/** Employee role from profile API (`role` field, e.g., UI Developer). */
export function pickEmployeeRole(profile: Record<string, unknown>): string {
  const raw = String(pickProfileField(profile, ["role"]) ?? "").trim();
  if (!raw) return "";
  if (isSessionRoleValue(raw)) return formatRoleLabel(raw);
  return raw;
}

/** True when the profile has an assigned band (name or id). */
export function hasAssignedBand(profile: Record<string, unknown>): boolean {
  return formatBandForProfile(profile) !== "—";
}

/**
 * Designation for profile display. For band-dependent user types (non-consultant),
 * hide designation when no band is assigned, so orphan role values are not shown.
 */
export function pickDesignationForDisplay(profile: Record<string, unknown>): string {
  if (!isConsultantProfile(profile) && !hasAssignedBand(profile)) {
    return "";
  }
  return pickEmployeeRole(profile);
}

/** @deprecated Use pickEmployeeRole — kept for existing imports. */
export function pickDesignation(profile: Record<string, unknown>): string {
  return pickEmployeeRole(profile);
}

export function pickProfileField(profile: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = profile[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && !value.trim()) continue;
    return value;
  }
  return undefined;
}

function normalizeStatusLabel(value: unknown): string {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return "—";
  return normalized;
}

export function formatYoeDisplay(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  if (!text) return "—";
  if (/year/i.test(text)) return text;
  const num = Number(text);
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    return `${num} year${num === 1 ? "" : "s"}`;
  }
  return text;
}

export function extractSkillNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const names: string[] = [];
  for (const item of raw) {
    if (item && typeof item === "object") {
      const skill = String(
        (item as Record<string, unknown>).skill ??
          (item as Record<string, unknown>).name ??
          ""
      ).trim();
      if (skill) names.push(skill);
      continue;
    }
    const text = String(item ?? "").trim();
    if (text) names.push(text);
  }
  return names;
}

export function rowHasSkill(raw: unknown, skillFilter: string): boolean {
  const needle = skillFilter.trim().toLowerCase();
  if (!needle) return true;
  return extractSkillNames(raw).some((skill) => skill.toLowerCase() === needle);
}

export function formatProfileDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (item && typeof item === "object") {
          const rec = item as Record<string, unknown>;
          const skill = String(rec.skill ?? rec.name ?? "").trim();
          const selfRating = rec.self_rating ?? rec.selfRating ?? rec.rating ?? rec.level;
          const webknotRating = rec.webknot_rating ?? rec.webknotRating;
          if (!skill) return "";
          let ratingStr = "";
          if (webknotRating !== undefined && webknotRating !== null && String(webknotRating).trim() !== "") {
            ratingStr = ` (Self: ${selfRating}/5, WK: ${webknotRating}/5)`;
          } else if (selfRating !== undefined && String(selfRating).trim() !== "") {
            ratingStr = ` (Self: ${selfRating}/5)`;
          }
          return `${skill}${ratingStr}`;
        }
        const text = String(item ?? "").trim();
        return text ? formatRoleDisplayValue(text) : "";
      })
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }
  const text = String(value).trim();
  if (!text) return "—";
  return formatRoleDisplayValue(text);
}

export function formatPrimarySkills(profile: Record<string, unknown>): string {
  const raw = pickProfileField(profile, ["primary_skills", "primarySkills"]);
  if (Array.isArray(raw)) return formatProfileDisplayValue(raw);
  return formatProfileDisplayValue(raw);
}

export function formatSecondarySkills(profile: Record<string, unknown>): string {
  return formatSecondarySkillsForProfile(profile);
}

export function onboardRowToListRow(row: OnboardRowInput): Record<string, string> {
  const record = asOnboardRecord(row);
  const isOnline = rowIsOnline(record);
  return {
    emp_id: rowEmpId(record) || "—",
    name: cleanEmployeeName(record),
    email: rowEmail(record) || "—",
    personal_email:
      String(record.personal_email ?? record.personalEmail ?? "").trim() || "—",
    department: String(record.department ?? "").trim() || "—",
    role: String(record.role ?? "").trim() || "—",
    portal_role: formatPrimaryPortalRoleLabel(record.portal_roles ?? record.portalRoles),
    band: isConsultantProfile(record)
      ? "—"
      : String(record.band ?? record.band_name ?? record.bandName ?? "").trim() || "—",
    date_of_joining: formatDirectoryDate(
      record.date_of_joining 
      ?? record.doj 
      ?? record.joining_date 
      ?? record.joiningDate 
      ?? record.dateOfJoining
    ),
    date_of_birth: formatDirectoryDate(record.date_of_birth ?? record.dob),
    status: normalizeStatusLabel(record.user_status ?? record.userStatus ?? record.status),
    user_type: formatUserTypeLabel(String(record.user_type ?? record.userType ?? "")),
    work_mode: String(record.work_mode ?? record.workMode ?? "").trim() || "—",
    work_location: String(
      record.work_location ?? record.work_location_type ?? record.workLocationType ?? ""
    ).trim() || "—",
    phone_number: String(record.phone_number ?? record.phoneNumber ?? "").trim() || "—",
    yoe: formatYoeDisplay(record.yoe ?? record.years_of_experience ?? record.experience),
    primary_skills: formatPrimarySkills(record),
    secondary_skills: formatSecondarySkills(record),
    is_online: isOnline ? "online" : "offline",
  };
}

export function rowIsOnline(record: Record<string, unknown>): boolean {
  const explicitOnline = Boolean(record.is_online ?? record.isOnline);
  if (explicitOnline) return true;

  const lastSeenRaw = String(
    record.last_seen_at ?? record.lastSeenAt ?? ""
  ).trim();
  if (!lastSeenRaw) return false;

  const lastSeen = new Date(lastSeenRaw).getTime();
  if (isNaN(lastSeen)) return false;

  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return now - lastSeen <= fiveMinutes;
}

/** True when DOB month/day matches today (year ignored). */
export function rowIsBirthdayToday(record: Record<string, unknown>, today = new Date()): boolean {
  const raw = String(record.date_of_birth ?? record.dateOfBirth ?? record.dob ?? "").trim();
  if (!raw || raw === "—") return false;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return false;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!month || !day) return false;
  return today.getMonth() + 1 === month && today.getDate() === day;
}

import { SkillRating } from "@/types/onboard";

export type EmployeeProfileEditForm = {
  name: string;
  email: string;
  personal_email: string;
  phone_country?: string;
  phone_number: string;
  department: string;
  role: string;
  user_status: string;
  work_mode: string;
  work_location_type: string;
  band_id: string;
  primary_skills: SkillRating[];
  secondary_skills: SkillRating[];
  /** Required when transitioning status to Serving Notice Period. */
  resignation_date: string;
  last_working_day: string;
};

export function profileToEditForm(profile: Record<string, unknown>): EmployeeProfileEditForm {
  const primarySkillsRaw = pickProfileField(profile, ["primary_skills", "primarySkills"]) as Array<Record<string, unknown>> | undefined;
  const primarySkills: SkillRating[] = (primarySkillsRaw || []).map((item) => ({
    skill: String(item.skill ?? item.name ?? "").trim(),
    self_rating: Number(item.self_rating ?? item.rating ?? item.level ?? 3),
    webknot_rating: item.webknot_rating != null ? Number(item.webknot_rating) : undefined,
  })).filter(s => !!s.skill);

  const secondarySkillsRaw =
    (profile.secondary_skills as Array<Record<string, unknown>> | undefined) ??
    (profile.secondarySkills as Array<Record<string, unknown>> | undefined) ??
    [];
  
  const secondarySkills: SkillRating[] = secondarySkillsRaw.map((item) => ({
    skill: String(item.skill ?? item.name ?? "").trim(),
    self_rating: Number(item.self_rating ?? item.rating ?? item.level ?? 3),
    webknot_rating: item.webknot_rating != null ? Number(item.webknot_rating) : undefined,
  })).filter(s => !!s.skill);

  const rawPhone = String(
    pickProfileField(profile, ["phone_number", "phoneNumber"]) ?? ""
  ).trim();
  const phoneParts = rawPhone
    ? splitPhoneNumber(rawPhone)
    : { countryIso: "", nationalNumber: "" };

  return {
    name: String(pickProfileField(profile, ["name"]) ?? "").trim(),
    email: String(pickProfileField(profile, ["email"]) ?? "").trim(),
    personal_email: String(pickProfileField(profile, ["personal_email"]) ?? "").trim(),
    phone_country: phoneParts.countryIso,
    phone_number: phoneParts.nationalNumber,
    department: String(pickProfileField(profile, ["department"]) ?? "").trim(),
    // Band-dependent designations: do not seed edit form with an orphan role when band is missing.
    role: (() => {
      const stored = String(pickProfileField(profile, ["role", "designation"]) ?? "").trim();
      if (!stored) return "";
      if (isConsultantProfile(profile)) return stored;
      if (!hasAssignedBand(profile)) return "";
      return stored;
    })(),
    user_status: normalizeEmployeeStatusKey(
      pickProfileField(profile, ["user_status", "status", "userStatus"])
    ),
    work_mode: String(pickProfileField(profile, ["work_mode", "workMode"]) ?? "").trim(),
    work_location_type: String(
      pickProfileField(profile, ["work_location_type", "workLocationType", "work_location"]) ?? ""
    ).trim(),
    band_id: String(
      pickProfileField(profile, ["band_id", "bandId"]) ?? ""
    ).trim(),
    primary_skills: primarySkills,
    secondary_skills: secondarySkills,
    resignation_date: String(
      pickProfileField(profile, [
        "exit_interview_resignation_date",
        "resignation_date",
        "resignationDate",
      ]) ?? ""
    ).trim(),
    last_working_day: String(
      pickProfileField(profile, [
        "exit_interview_last_working_day",
        "last_working_day",
        "lastWorkingDay",
      ]) ?? ""
    ).trim(),
  };
}

export function editFormToUpdatePayload(
  form: EmployeeProfileEditForm,
  options?: { statusOnly?: boolean; omitBand?: boolean }
): Record<string, unknown> {
  const normalizedStatus =
    normalizeEmployeeStatusKey(form.user_status) || form.user_status.trim();
  if (options?.statusOnly) {
    return { user_status: normalizedStatus };
  }

  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone_number: form.phone_country
      ? formatPhoneNumberForApi(form.phone_country, form.phone_number)
      : null,
    department: form.department.trim(),
    role: form.role.trim(),
    user_status: normalizedStatus,
    work_mode: form.work_mode.trim(),
    work_location_type: form.work_location_type.trim(),
    primary_skills: form.primary_skills.length ? form.primary_skills : null,
    secondary_skills: form.secondary_skills.length ? form.secondary_skills : [],
  };

  // Consultants do not use band — never send band_id (API rejects it).
  if (!options?.omitBand) {
    const bandId = form.band_id.trim();
    if (bandId) {
      const bandNum = Number(bandId);
      payload.band_id = Number.isFinite(bandNum) ? bandNum : bandId;
    }
  }

  // Personal email is employee-managed — never include it on HR directory updates.
  return payload;
}

export type UserTypeTransitionDisplayRow = {
  previousUserType: string;
  newUserType: string;
  effectiveDate: string;
};

export type ProfileDisplayEntry = {
  label: string;
  value: unknown;
  /** When set, render a clickable "resume" link instead of plain text. */
  resumeShareHref?: string | null;
  fullWidth?: boolean;
  /** When true, render value as a color-coded employee status badge. */
  asStatusBadge?: boolean;
  /** When true, render values in the structured table format. */
  asUserTypeHistoryTable?: boolean;
  /** When true, render skills array as a table with Skill, Self Rating, Webknot Rating columns. */
  asSkillsTable?: boolean;
};

export type ProfileDisplaySection = {
  title: string;
  entries: ProfileDisplayEntry[];
};

function profileEntry(
  label: string,
  value: unknown,
  options?: {
    resumeShareHref?: string | null;
    fullWidth?: boolean;
    asStatusBadge?: boolean;
    asUserTypeHistoryTable?: boolean;
    asSkillsTable?: boolean;
  }
): ProfileDisplayEntry {
  return { label, value, ...options };
}

function formatUserTypeTransitionHistory(profile: Record<string, unknown>): UserTypeTransitionDisplayRow[] {
  const raw = profile.user_type_transitions ?? profile.userTypeTransitions;
  if (!Array.isArray(raw) || !raw.length) return [];

  return raw.map((item) => {
    if(!item || typeof item !== "object") return null;

    const row = item as Record<string, unknown>;

    const previousUserType = formatUserTypeLabel(
        String(row.from_type ?? row.fromType ?? "")
    );

    const newUserType = formatUserTypeLabel(
        String(row.to_type ?? row.toType ?? "")
    );

    const effectiveDate = formatDirectoryDate(
        row.transition_date ?? row.transitionDate
    );

    if(
        !previousUserType ||
        previousUserType === "—" ||
        !newUserType ||
        newUserType === "—"
    ){
      return null;
    }

    return{
      previousUserType,
      newUserType,
      effectiveDate
    };
  })
      .filter((row): row is UserTypeTransitionDisplayRow => row !== null);
}

/** PAN is stored as a document path — surface on-file status on profiles. */
function formatPanCardStatus(profile: Record<string, unknown>): string {
  const onFile = profile.pan_card_on_file ?? profile.panCardOnFile;
  if (onFile === true || onFile === "true" || onFile === 1) return "Uploaded";
  const raw = pickProfileField(profile, ["pan_card", "panCard"]);
  if (raw && String(raw).trim() && String(raw).trim() !== "—") return "Uploaded";
  return "Not uploaded";
}

/** Aadhar Card is stored as a document path - surface on-file status on profiles. */
function formatAadharCardStatus(profile: Record<string, unknown>): string {
  const onFile = profile.aadhar_card_on_file ?? profile.aadharCardOnFile;
  if (onFile === true || onFile === "true" || onFile === 1) return "Uploaded";
  const raw = pickProfileField(profile, ["aadhar_card", "aadharCard"]);
  if (raw && String(raw).trim() && String(raw).trim() !== "—") return "Uploaded";
  return "Not uploaded";
}

/** Grouped profile fields for the HR employee directory profile view. */
export function buildGroupedProfileSections(
  profile: Record<string, unknown>,
  resumeShareHref?: string | null
): ProfileDisplaySection[] {
  const resumeHref =
    resumeShareHref !== undefined ? resumeShareHref : pickResumeShareLink(profile);

  const category =
    pickProfileField(profile, ["category"]) ??
    pickProfileField(profile, ["delivery_status", "deliveryStatus"]);

  const internProfile = isInternProfile(profile);
  const consultantProfile = isConsultantProfile(profile);

  const information: ProfileDisplayEntry[] = [
    profileEntry("Name", cleanEmployeeName(profile) || pickProfileField(profile, ["name"])),
    profileEntry("Employee ID", pickProfileField(profile, ["emp_id", "empId", "employee_id"])),
    profileEntry(
      "Status",
      pickProfileField(profile, ["status", "user_status", "userStatus"]),
      { asStatusBadge: true }
    ),
    profileEntry("Work Email", pickProfileField(profile, ["email"])),
    profileEntry("Department", pickProfileField(profile, ["department"])),
    profileEntry("Designation / Role", pickDesignationForDisplay(profile) || null),
    ...(consultantProfile ? [] : [profileEntry("Band", formatBandForProfile(profile))]),
    profileEntry(
      "User Type",
      formatUserTypeLabel(String(pickProfileField(profile, ["user_type", "userType"]) ?? ""))
    ),
    profileEntry("User Type History", formatUserTypeTransitionHistory(profile), {
      fullWidth: true,
      asUserTypeHistoryTable: true,
    }),
    profileEntry("Category", formatCategoryLabel(category)),
    profileEntry(
      "Work Mode",
      formatWorkModeLabel(pickProfileField(profile, ["work_mode", "workMode"]))
    ),
    profileEntry(
      "Work Location",
      formatWorkLocationLabel(
        pickProfileField(profile, ["work_location", "work_location_type", "workLocationType"])
      )
    ),
    profileEntry("Reporting Manager", formatReportingManagerForProfile(profile)),
    ...(internProfile
      ? [
          profileEntry(
            "Date of Internship",
            formatDirectoryDate(
              pickProfileField(profile, ["doi", "date_of_internship", "dateOfInternship"])
            )
          ),
          profileEntry(
            "Internship Duration (Months)",
            pickProfileField(profile, ["internship_duration", "internshipDuration"])
          ),
        ]
      : [
          profileEntry(
            "Date of Joining",
            formatDirectoryDate(
              pickProfileField(profile, ["date_of_joining", "doj", "joining_date", "joiningDate", "dateOfJoining"])
            )
          ),
        ]),
    profileEntry("Primary Skills", pickProfileField(profile, ["primary_skills", "primarySkills"]), {
      asSkillsTable: true,
      fullWidth: true,
    }),
    profileEntry("Secondary Skills", pickProfileField(profile, ["secondary_skills", "secondarySkills"]), {
      asSkillsTable: true,
      fullWidth: true,
    }),
    profileEntry(
      "Webknot Experience",
      pickProfileField(profile, ["webknot_experience", "webknotExperience"])
    ),
    profileEntry(
      "Years of Experience (excluding internship)",
      formatYoeDisplay(pickProfileField(profile, ["yoe", "years_of_experience", "yearsOfExperience", "total_experience", "totalExperience"]))
    ),
    profileEntry(
      "Experience Summary (excluding internship)",
      pickProfileField(profile, ["experience", "experience_summary", "experienceSummary"]),
      { fullWidth: true }
    ),
  ];

  function formatGenderLabel(value: unknown): string {
    const normalized = String(value ?? "").trim().toUpperCase();
    if (!normalized) return "—";
    return GENDER_LABELS[normalized] ?? String(value).trim();
  }

  const personalInformation: ProfileDisplayEntry[] = [
    profileEntry("Personal Email", pickProfileField(profile, ["personal_email", "personalEmail"])),
    profileEntry("Phone Number", pickProfileField(profile, ["phone_number", "phoneNumber"])),
    profileEntry(
      "Date of Birth",
      formatDirectoryDate(pickProfileField(profile, ["date_of_birth", "dob", "dateOfBirth"]))
    ),
    profileEntry("Gender", formatGenderLabel(pickProfileField(profile, ["gender"]))),
    profileEntry("Marital Status", pickProfileField(profile, ["marital_status", "maritalStatus"])),
    profileEntry("Nationality", pickProfileField(profile, ["nationality"])),
    profileEntry("Local Address", pickProfileField(profile, ["local_address", "localAddress"]), {
      fullWidth: true,
    }),
    profileEntry(
      "Permanent Address",
      pickProfileField(profile, ["permanent_address", "permanentAddress"]),
      { fullWidth: true }
    ),
    profileEntry(
      "Emergency Contact",
      pickProfileField(profile, ["emergency_contact_name", "emergencyContactName"])
    ),
    profileEntry(
      "Emergency Number",
      pickProfileField(profile, ["emergency_contact_number", "emergencyContactNumber"])
    ),
    profileEntry("Blood Group", pickProfileField(profile, ["blood_group", "bloodGroup"])),
    profileEntry("PAN Card", formatPanCardStatus(profile)),
    profileEntry("Aadhar Card", formatAadharCardStatus(profile)),
    profileEntry("Resume Link", resumeHref ? "resume" : null, {
      resumeShareHref: resumeHref,
      fullWidth: true,
    }),
  ];

  return [
    { title: "Work Information", entries: information },
    { title: "Personal Information", entries: personalInformation },
  ];
}

const PROFILE_VIEW_WORK_LABELS = new Set([
  "Band",
  "Date of Joining",
  "Date of Internship",
  "Internship Duration (Months)",
  "Reporting Manager",
  "User Type",
  "User Type History",
  "Work Mode",
  "Work Location",
  "Category",
  "Primary Skills",
  "Secondary Skills",
  "Years of Experience (excluding internship)",
  "Experience Summary (excluding internship)",
  "Current Allocation",
]);

const PROFILE_VIEW_PERSONAL_LABELS = new Set([
  "Personal Email",
  "Gender",
  "Marital Status",
  "Local Address",
  "Permanent Address",
  "PAN Card",
  "Aadhar Card",
]);

const PROFILE_VIEW_LABEL_OVERRIDES: Record<string, string> = {
  "User Type": "Employment Type",
  "Local Address": "Current Address",
};

function filterProfileViewEntries(
  sectionTitle: string,
  entries: ProfileDisplayEntry[],
  options?: { includeDateOfBirth?: boolean }
): ProfileDisplayEntry[] {
  const allowed =
    sectionTitle === "Work Information"
      ? PROFILE_VIEW_WORK_LABELS
      : sectionTitle === "Personal Information"
        ? new Set([
            ...PROFILE_VIEW_PERSONAL_LABELS,
            ...(options?.includeDateOfBirth ? (["Date of Birth"] as const) : []),
          ])
        : null;
  if (!allowed) return entries;

  return entries
    .filter((entry) => allowed.has(entry.label))
    .map((entry) => ({
      ...entry,
      label: PROFILE_VIEW_LABEL_OVERRIDES[entry.label] ?? entry.label,
    }));
}

/** Profile sections for the directory profile view (omits header-duplicated fields). */
export function buildProfileViewSections(
  profile: Record<string, unknown>,
  resumeShareHref?: string | null,
  options?: {
    includeDateOfBirth?: boolean;
  }
): ProfileDisplaySection[] {
  return buildGroupedProfileSections(profile, resumeShareHref)
    .map((section) => ({
      ...section,
      entries: filterProfileViewEntries(section.title, section.entries, options),
    }));
}

/** @deprecated Prefer buildGroupedProfileSections for directory profile layout. */
export function buildProfileDisplayEntries(
  profile: Record<string, unknown>,
  resumeShareHref?: string | null
): ProfileDisplayEntry[] {
  return buildGroupedProfileSections(profile, resumeShareHref).flatMap(
    (section) => section.entries
  );
}
