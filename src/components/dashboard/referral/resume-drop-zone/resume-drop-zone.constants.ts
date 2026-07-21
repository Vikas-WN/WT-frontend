import { ACCEPTED_RESUME_TYPES, MAX_RESUME_BYTES, RESUME_ERROR_MESSAGES } from "@/components/dashboard/referral/referral-page-client.constants";

export const DROP_ZONE_LABELS = {
  upload: "Upload Resume",
  dropHere: "Drop your resume here",
  browse: "Drop a file here or click to browse",
  formats: "PDF, DOC, DOCX \u00B7 Max 2 MB",
  remove: "Remove",
  tryDifferent: "Try a different file",
} as const;

export function validateResume(f: File): string | null {
  if (!(ACCEPTED_RESUME_TYPES as readonly string[]).includes(f.type)) {
    return RESUME_ERROR_MESSAGES.invalidType;
  }
  if (f.size > MAX_RESUME_BYTES) {
    return RESUME_ERROR_MESSAGES.tooLarge;
  }
  return null;
}
