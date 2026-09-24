"use client";

import { FileText, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type DocumentItem = {
  label: string;
  href: string | null;
  /** True when the record shows this as captured even without a direct link
   *  (e.g. relieving letter/payslip "on file" flags from older submissions). */
  onFile?: boolean;
  note?: string;
};

function readString(profile: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = profile[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readBool(profile: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = profile[key];
    if (typeof value === "boolean") return value;
  }
  return false;
}

function readStringArray(profile: Record<string, unknown>, ...keys: string[]): string[] {
  for (const key of keys) {
    const value = profile[key];
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    }
  }
  return [];
}

function buildDocumentItems(profile: Record<string, unknown>): DocumentItem[] {
  const items: DocumentItem[] = [];

  items.push({
    label: "Profile Photo",
    href: readString(profile, "profile_photo", "profilePhoto") || null,
  });
  items.push({
    label: "Resume",
    href: readString(profile, "resume_share_link", "resumeShareLink") || null,
  });
  items.push({
    label: "Aadhaar",
    href: readString(profile, "aadhaar", "aadhar_card", "aadharCard") || null,
    onFile: readBool(profile, "aadhaar_on_file", "aadhaarOnFile"),
  });
  items.push({
    label: "PAN Card",
    href: readString(profile, "pan_card", "panCard") || null,
    onFile: readBool(profile, "pan_card_on_file", "panCardOnFile"),
  });

  const relievingLetter = readString(
    profile,
    "relieving_letter_url",
    "relievingLetterUrl",
    "reliving_letter_url"
  );
  const relievingOnFile = readBool(
    profile,
    "relieving_letter_on_file",
    "relievingLetterOnFile",
    "reliving_letter_on_file"
  );
  if (relievingLetter || relievingOnFile) {
    items.push({ label: "Relieving Letter", href: relievingLetter || null, onFile: relievingOnFile });
  }

  const salarySlips = readStringArray(profile, "salary_slip_urls", "salarySlipUrls");
  const salarySlipsOnFile = readBool(profile, "salary_slips_on_file", "salarySlipsOnFile");
  if (salarySlips.length) {
    salarySlips.forEach((url, index) => {
      items.push({
        label: salarySlips.length > 1 ? `Payslip ${index + 1}` : "Payslip",
        href: url,
      });
    });
  } else if (salarySlipsOnFile) {
    items.push({ label: "Payslip", href: null, onFile: true });
  }

  const exitSurveySubmitted = readBool(profile, "exit_interview_submitted", "exitInterviewSubmitted");
  if (exitSurveySubmitted) {
    items.push({
      label: "Exit Survey",
      href: null,
      onFile: true,
      note: "Submitted — view under Personal → Exit Survey.",
    });
  }

  return items;
}

function DocumentRow({ item }: { item: DocumentItem }) {
  const hasFile = Boolean(item.href) || Boolean(item.onFile);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-2/40 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            hasFile
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-wt-surface-3 text-wt-text-muted"
          )}
        >
          <FileText className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-wt-text">{item.label}</p>
          {item.note ? (
            <p className="truncate text-xs text-wt-text-muted">{item.note}</p>
          ) : null}
        </div>
      </div>
      {item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--wt-brand)] hover:underline"
        >
          View
          <ExternalLink className="size-3.5" />
        </a>
      ) : hasFile ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" />
          On file
        </span>
      ) : (
        <span className="shrink-0 text-xs text-wt-text-muted">Not uploaded</span>
      )}
    </div>
  );
}

/** Self-service document vault: what an employee has already submitted, with
 *  view/download links where the record stores a URL. Sourced entirely from
 *  the existing profile response (no new endpoint) — the backend already
 *  returns profile_photo, aadhaar/pan_card (+ on_file flags), resume_share_link,
 *  relieving_letter_url, salary_slip_urls, and exit_interview_submitted. */
export function MyDocumentsSection({ profile }: { profile: Record<string, unknown> }) {
  const items = buildDocumentItems(profile);
  if (!items.length) return null;

  return (
    <div className="mt-8 border-t border-wt-border pt-6">
      <h4 className="mb-1 text-sm font-semibold text-wt-text">My Documents</h4>
      <p className="mb-3 text-xs text-wt-text-muted">
        What you&apos;ve already submitted. Contact HR if something needs to change.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <DocumentRow key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
