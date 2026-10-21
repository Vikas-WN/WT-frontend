"use client";

import { documentHref } from "@/utils/documentLinks";

export function EmployeeResumeLink({
  href,
}: {
  href?: string | null;
}) {
  // `s3://…` resumes open through the API; a typed web link opens as is; anything else has nothing to open.
  const url = documentHref(href);
  if (!url) {
    return <span className="text-wt-text-muted">—</span>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--wt-brand)] hover:underline"
    >
      resume
    </a>
  );
}

import { pickResumeShareLink } from "@/utils/employeeResume";

export function EmployeeResumeLinkFromRow({ row }: { row: Record<string, unknown> }) {
  return <EmployeeResumeLink href={pickResumeShareLink(row)} />;
}
