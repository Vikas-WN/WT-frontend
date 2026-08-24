import { SkillRating } from "@/types/onboard";

export type SelfOnboardFormState = {
  personal_email: string;
  full_name: string;
  date_of_birth: string;
  yoe: string;
  experience: string;
  primary_skills: SkillRating[];
  secondary_skills: SkillRating[];
  work_location_type: string;
  resume_share_link: string;
  local_address: string;
  permanent_address: string;
  gender: string;
  marital_status: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
};

const STORAGE_KEY = "wt.selfOnboardFormDraft";

export function createEmptySelfOnboardForm(): SelfOnboardFormState {
  return {
    personal_email: "",
    full_name: "",
    date_of_birth: "",
    yoe: "",
    experience: "",
    primary_skills: [],
    secondary_skills: [],
    work_location_type: "",
    resume_share_link: "",
    local_address: "",
    permanent_address: "",
    gender: "",
    marital_status: "",
    blood_group: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
  };
}

export function loadSavedOnboardForm(): SelfOnboardFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SelfOnboardFormState>;
    if (!parsed || typeof parsed !== "object") return null;
    return { ...createEmptySelfOnboardForm(), ...parsed };
  } catch {
    return null;
  }
}

export function saveOnboardFormDraft(form: SelfOnboardFormState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    // Storage full or unavailable — ignore.
  }
}

export function clearOnboardFormDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
