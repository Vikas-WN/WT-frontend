"use client";

import { Download, FileSpreadsheet, FileText, FileType2, Loader2, Music, Presentation } from "lucide-react";
import { useState } from "react";

import { endpoints } from "@/api/endpoints";
import { CHAT_COPY as COPY } from "@/constants/chat";
import type { ChatAttachment } from "@/types/chat";
import { formatBytes } from "@/utils/chatFiles";

function DocumentIcon({ fileName }: { fileName: string }) {
  const ext = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
  const cls = "size-5";
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className={cls} aria-hidden />;
  if (["ppt", "pptx"].includes(ext)) return <Presentation className={cls} aria-hidden />;
  if (["doc", "docx", "pdf"].includes(ext)) return <FileType2 className={cls} aria-hidden />;
  return <FileText className={cls} aria-hidden />;
}

/** A file inside a message: photos and video play in place, audio has a player, documents are a card that downloads. */
export function MessageAttachment({ attachment, uploading, onMediaLoad }: { attachment: ChatAttachment; uploading?: boolean; onMediaLoad?: () => void }) {
  // UI state: the file could not be loaded (deleted from storage, or no longer allowed).
  const [broken, setBroken] = useState(false);
  const src = endpoints.chat.attachment(attachment.id);

  if (uploading) {
    return (
      <div className="mt-1 flex w-72 max-w-full items-center gap-3 rounded-xl border border-wt-border bg-wt-surface-2/60 px-3 py-2.5">
        <Loader2 className="size-5 animate-spin text-wt-text-muted" aria-hidden />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-wt-text">{attachment.file_name}</span>
          <span className="block text-xs text-wt-text-muted">{COPY.uploading}</span>
        </span>
      </div>
    );
  }
  if (broken) {
    return <p className="mt-1 text-sm italic text-wt-text-faint">{COPY.unavailableFile}</p>;
  }
  if (attachment.kind === "image") {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="mt-1 block w-fit max-w-full" title={attachment.file_name}>
        {/* eslint-disable-next-line @next/next/no-img-element -- an authenticated same-origin file */}
        <img
          src={src}
          alt={attachment.file_name}
          loading="lazy"
          onLoad={onMediaLoad}
          onError={() => setBroken(true)}
          className="max-h-72 min-h-16 max-w-full rounded-xl border border-wt-border bg-wt-surface-2 object-contain sm:max-w-sm"
        />
      </a>
    );
  }
  if (attachment.kind === "video") {
    return (
      <video
        src={src}
        controls
        preload="metadata"
        playsInline
        onLoadedMetadata={onMediaLoad}
        onError={() => setBroken(true)}
        className="mt-1 max-h-80 max-w-full rounded-xl border border-wt-border bg-black sm:max-w-sm"
        aria-label={attachment.file_name}
      />
    );
  }
  if (attachment.kind === "audio") {
    return (
      <div className="mt-1 flex w-80 max-w-full items-center gap-2 rounded-xl border border-wt-border bg-wt-surface-2/60 p-2">
        <Music className="size-4 shrink-0 text-wt-text-muted" aria-hidden />
        <audio src={src} controls preload="none" onError={() => setBroken(true)} className="h-9 min-w-0 flex-1" aria-label={attachment.file_name} />
      </div>
    );
  }
  return (
    <a
      href={`${src}?download=true`}
      className="mt-1 flex w-72 max-w-full items-center gap-3 rounded-xl border border-wt-border bg-wt-surface-2/60 px-3 py-2.5 hover:bg-wt-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
        <DocumentIcon fileName={attachment.file_name} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-wt-text">{attachment.file_name}</span>
        <span className="block text-xs text-wt-text-muted">{formatBytes(attachment.size_bytes)}</span>
      </span>
      <Download className="size-4 shrink-0 text-wt-text-muted" aria-label={COPY.download} />
    </a>
  );
}
