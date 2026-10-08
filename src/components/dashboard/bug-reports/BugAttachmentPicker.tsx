"use client";

import { AlertCircle, CheckCircle2, FileText, Film, Loader2, Paperclip, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";

import { BUG_ATTACHMENT_ACCEPT, BUG_ATTACHMENT_COPY as COPY, BUG_ATTACHMENT_KINDS, BUG_ATTACHMENT_LIMITS } from "@/constants/bugReports";
import type { UploadItem } from "@/hooks/bug-reports/useBugReportSubmission";
import { cn } from "@/lib/utils";
import { checkBugFile, formatFileSize, type AttachmentProblem } from "@/utils/bugAttachments";

const RULES = { ...BUG_ATTACHMENT_LIMITS, kinds: BUG_ATTACHMENT_KINDS };

function describe(problem: AttachmentProblem): string {
  switch (problem.code) {
    case "too_many":
      return COPY.tooMany(problem.max);
    case "unsupported":
      return COPY.unsupported(problem.name);
    case "empty":
      return COPY.empty(problem.name);
    case "too_big":
      return COPY.tooBig(problem.name, problem.mb);
  }
}

function Thumb({ file }: { file: File }) {
  const isImage = file.type.startsWith("image/");
  const url = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage]);
  // Side effect: a preview URL holds the file in memory until it is released.
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- a local preview of a file the person just chose
    return <img src={url} alt="" className="size-10 shrink-0 rounded-lg object-cover" />;
  }
  const Icon = file.type.startsWith("video/") ? Film : FileText;
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-wt-surface-3 text-wt-text-muted" aria-hidden>
      <Icon className="size-5" />
    </span>
  );
}

function StatusBadge({ item }: { item: UploadItem }) {
  if (item.status === "uploading") return <Loader2 className="size-4 animate-spin text-[var(--wt-brand)]" aria-label={COPY.uploading} />;
  if (item.status === "done") return <CheckCircle2 className="size-4 text-emerald-600" aria-label={COPY.done} />;
  if (item.status === "failed") return <AlertCircle className="size-4 text-rose-600" aria-label={COPY.failed} />;
  return null;
}

/**
 * Add screenshots, recordings or logs to a bug report: drop them, paste a screenshot, or browse. Each file is checked against the
 * same limits the server enforces; once the report is sent, each shows whether it uploaded.
 */
export function BugAttachmentPicker({
  files,
  uploads,
  disabled,
  locked = false,
  onAdd,
  onRemove,
}: {
  files: File[];
  uploads: UploadItem[];
  disabled: boolean;
  /** The report has been sent: only the list of files (and their status) remains. */
  locked?: boolean;
  onAdd: (accepted: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  // UI state: drag-over highlight and the latest "that file can't be added" message.
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  function accept(list: FileList | File[]) {
    const accepted: File[] = [];
    let message: string | null = null;
    for (const file of Array.from(list)) {
      const issue = checkBugFile(file, files.length + accepted.length, RULES);
      if (issue) message = describe(issue);
      else accepted.push(file);
    }
    setProblem(message);
    if (accepted.length) onAdd(accepted);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) accept(event.dataTransfer.files);
  }

  const statusOf = (file: File) => uploads.find((u) => u.file === file);

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-wt-text">
        {COPY.heading} <span className="font-normal text-wt-text-muted">({COPY.optional})</span>
      </p>
      {locked ? null : (
      <button
        type="button"
        disabled={disabled || files.length >= RULES.maxFiles}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)] disabled:cursor-not-allowed disabled:opacity-60",
          dragging ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)]" : "border-wt-border hover:border-[var(--wt-brand)]/50 hover:bg-wt-surface-2/60"
        )}
      >
        <Paperclip className="size-5 text-wt-text-muted" aria-hidden />
        <span className="text-sm font-medium text-wt-text">{COPY.dropTitle}</span>
        <span className="text-xs text-wt-text-muted">{COPY.dropHint(RULES.maxFiles)}</span>
      </button>
      )}
      <input
        ref={input}
        type="file"
        multiple
        accept={BUG_ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) accept(e.target.files);
          e.target.value = "";
        }}
      />
      {problem ? (
        <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
          {problem}
        </p>
      ) : null}
      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => {
            const item = statusOf(file);
            return (
              <li key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 rounded-xl border border-wt-border bg-wt-surface-1 p-2">
                <Thumb file={file} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-wt-text">{file.name}</span>
                  <span className={cn("block truncate text-xs", item?.status === "failed" ? "text-rose-600" : "text-wt-text-muted")}>
                    {item?.status === "failed" ? (item.error ?? COPY.failed) : formatFileSize(file.size)}
                  </span>
                </span>
                {item ? <StatusBadge item={item} /> : null}
                {!item || item.status === "failed" ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemove(index)}
                    aria-label={`${COPY.remove} ${file.name}`}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text disabled:opacity-40"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
