import type { BADGE_TONE } from "@/components/dashboard/ui/badgeTones";
import type { AnnouncementCategory } from "@/types/announcement";
import type { FormCategory } from "@/types/form";

export interface CategoryOption<T extends string> {
  value: T;
  label: string;
  tone: keyof typeof BADGE_TONE;
}

export const ANNOUNCEMENT_CATEGORY_OPTIONS: ReadonlyArray<CategoryOption<AnnouncementCategory>> = [
  { value: "GENERAL", label: "General", tone: "neutral" },
  { value: "POLICY", label: "Policy", tone: "violet" },
  { value: "HR", label: "HR", tone: "info" },
  { value: "IT", label: "IT", tone: "slate" },
  { value: "OFFICE", label: "Office", tone: "warning" },
  { value: "CELEBRATION", label: "Celebration", tone: "success" },
  { value: "URGENT", label: "Urgent", tone: "danger" },
];

export const FORM_CATEGORY_OPTIONS: ReadonlyArray<CategoryOption<FormCategory>> = [
  { value: "SURVEY", label: "Survey", tone: "info" },
  { value: "FEEDBACK", label: "Feedback", tone: "violet" },
  { value: "REGISTRATION", label: "Registration", tone: "success" },
  { value: "REQUEST", label: "Request", tone: "warning" },
  { value: "COMPLIANCE", label: "Compliance", tone: "danger" },
  { value: "OTHER", label: "Other", tone: "neutral" },
];

export function categoryLabel<T extends string>(options: ReadonlyArray<CategoryOption<T>>, value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export const LIST_PAGE_SIZE = 12;
export const LIST_SEARCH_DELAY_MS = 300;

export const LIST_FILTER_COPY = {
  all: "All",
  searchLabel: "Search",
  noMatchesTitle: "Nothing matches",
  noMatchesDescription: "Try a different word or clear the filters.",
  clear: "Clear filters",
} as const;
