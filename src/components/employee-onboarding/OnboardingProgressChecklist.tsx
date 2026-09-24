"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SkillRating } from "@/types/onboard";

type ChecklistFormShape = {
  personal_email: string;
  full_name: string;
  phone_country: string;
  phone_number: string;
  date_of_birth: string;
  yoe: string;
  experience: string;
  primary_skills: SkillRating[];
  secondary_skills: SkillRating[];
  resume_share_link: string;
};

type ChecklistFilesShape = {
  profile_photo: File | null;
  aadhaar: File | null;
  pan_card: File | null;
};

export type ChecklistItem = {
  label: string;
  done: boolean;
};

/** Purely derived from current form/file state — no persistence needed, this
 *  just reflects what's filled in right now so the employee has a sense of
 *  progress on what would otherwise look like one long, undifferentiated form. */
export function computeOnboardingChecklist(
  form: ChecklistFormShape,
  files: ChecklistFilesShape,
  priorEmploymentDocsRequired: boolean
): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { label: "Personal details", done: Boolean(form.personal_email.trim() && form.full_name.trim()) },
    {
      label: "Phone number",
      done: Boolean(form.phone_country.trim() && form.phone_number.trim()),
    },
    { label: "Date of birth", done: Boolean(form.date_of_birth.trim()) },
    { label: "Years of experience", done: Boolean(form.yoe.trim()) },
  ];
  if (priorEmploymentDocsRequired) {
    items.push({ label: "Experience summary", done: Boolean(form.experience.trim()) });
  }
  items.push(
    { label: "Primary skills", done: form.primary_skills.length > 0 },
    { label: "Secondary skills", done: form.secondary_skills.length > 0 },
    { label: "Resume link", done: Boolean(form.resume_share_link.trim()) },
    { label: "Profile photo", done: Boolean(files.profile_photo) },
    { label: "Aadhaar", done: Boolean(files.aadhaar) },
    { label: "PAN card", done: Boolean(files.pan_card) }
  );
  return items;
}

export function OnboardingProgressChecklist({ items }: { items: ChecklistItem[] }) {
  const completed = items.filter((item) => item.done).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mb-5 rounded-2xl border border-wt-border bg-wt-surface-2/40 p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-wt-text">
          {completed} of {total} steps complete
        </p>
        <p className="text-xs font-medium text-wt-text-muted">{percent}%</p>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-wt-surface-3">
        <div
          className="h-full rounded-full bg-[var(--wt-brand)] transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <span
            key={item.label}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs",
              item.done ? "text-wt-text-muted line-through" : "text-wt-text"
            )}
          >
            {item.done ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-wt-text-muted" />
            )}
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
