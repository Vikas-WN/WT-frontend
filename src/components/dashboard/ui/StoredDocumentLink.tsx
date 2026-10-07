import { ExternalLink, FileText } from "lucide-react";

import { documentHref } from "@/utils/documentLinks";

/** "Open" link for a stored document reference; a dash when there is nothing openable (e.g. an old upload that was never saved). */
export function StoredDocumentLink({ value, label = "Open" }: { value: unknown; label?: string }) {
  const href = documentHref(value);
  if (!href) return <span className="text-wt-text-faint">—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-[var(--wt-brand)] hover:underline"
    >
      <FileText className="size-3.5 shrink-0" aria-hidden />
      {label}
      <ExternalLink className="size-3 shrink-0" aria-hidden />
    </a>
  );
}
