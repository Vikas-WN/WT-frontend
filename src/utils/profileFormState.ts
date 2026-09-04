import { SkillRating } from "@/types/onboard";

export type SelfProfileFormState = {
  phone_country?: string;
  phone_number: string;
  primary_skills: SkillRating[];
  secondary_skills: SkillRating[];
  yoe: string;
  date_of_birth: string;
  // Personal details — employee-managed from their own profile (HR/Admin see them view-only).
  local_address: string;
  permanent_address: string;
  gender: string;
  marital_status: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
};

export function createEmptySelfProfileForm(): SelfProfileFormState {
  return {
    phone_country: "",
    phone_number: "",
    primary_skills: [],
    secondary_skills: [],
    yoe: "",
    date_of_birth: "",
    local_address: "",
    permanent_address: "",
    gender: "",
    marital_status: "",
    blood_group: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
  };
}
