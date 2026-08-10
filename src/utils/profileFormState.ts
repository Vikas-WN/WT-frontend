import { SkillRating } from "@/types/onboard";

export type SelfProfileFormState = {
  phone_country?: string;
  phone_number: string;
  primary_skills: SkillRating[];
  secondary_skills: SkillRating[];
  yoe: string;
  date_of_birth: string;
};

export function createEmptySelfProfileForm(): SelfProfileFormState {
  return {
    phone_country: "IN",
    phone_number: "",
    primary_skills: [],
    secondary_skills: [],
    yoe: "",
    date_of_birth: "",
  };
}
