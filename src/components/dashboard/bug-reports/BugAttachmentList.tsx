import { FileText, Film } from "lucide-react";

import { BUG_DETAIL_COPY as COPY } from "@/constants/bugReports";
import type { BugAttachment } from "@/types/bugReport";
import { formatFileSize } from "@/utils/bugAttachments";
import { storedDocumentHref } from "@/utils/documentLinks";

const isImage = (a: BugAttachment) => (a.content_type ?? "").startsWith("image/");

/** The files on a report: image thumbnails that open full size, and chips for recordings, PDFs and logs. Opened through the access-checked download route. */
export function BugAttachmentList({ attachments }: { attachments: readonly BugAttachment[] }) {
  if (attachments.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-wt-text-muted">
        {COPY.files} · {attachments.length}
      </p>
      <ul className="flex flex-wrap gap-2">
        {attachments.map((a) => {
          const href = storedDocumentHref(a.file_url);
          return (
            <li key={a.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={`${COPY.openFile} ${a.file_name}`}
                className="group flex items-center gap-2 overflow-hidden rounded-xl border border-wt-border bg-wt-surface-1 p-1.5 pr-3 transition-colors hover:border-[var(--wt-brand)]/50"
              >
                {isImage(a) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- same-origin, access-checked download route
                  <img src={href} alt="" loading="lazy" className="size-12 rounded-lg object-cover" />
                ) : (
                  <span className="grid size-12 place-items-center rounded-lg bg-wt-surface-3 text-wt-text-muted" aria-hidden>
                    {(a.content_type ?? "").startsWith("video/") ? <Film className="size-5" /> : <FileText className="size-5" />}
                  </span>
                )}
                <span className="min-w-0 max-w-[10rem]">
                  <span className="block truncate text-xs font-medium text-wt-text">{a.file_name}</span>
                  <span className="block text-[11px] text-wt-text-muted">{formatFileSize(a.size_bytes)}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
