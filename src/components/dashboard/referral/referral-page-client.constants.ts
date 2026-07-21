export const REFERRAL_PAGE_SIZE = 20;
export const MAX_RESUME_BYTES = 2 * 1024 * 1024;
export const CAREER_PAGE_URL = "https://webknot-dev.netlify.app/careers";

export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const RESUME_ERROR_MESSAGES = {
  invalidType: "Only PDF, DOC, and DOCX files are accepted",
  tooLarge: "File size must be under 2 MB",
} as const;

export const REFERRAL_QUERY_KEYS = {
  all: ["referral"] as const,
  jobs: (q?: string, page?: number) => ["referral", "jobs", q ?? "", page ?? 1] as const,
} as const;
