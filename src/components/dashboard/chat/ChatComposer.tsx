"use client";

import { Paperclip, SendHorizonal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EmojiPicker } from "@/components/dashboard/chat/EmojiPicker";
import { CHAT_COPY as COPY, CHAT_LIMITS } from "@/constants/chat";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { applySlashCommand, CHAT_FILE_ACCEPT, formatBytes, validateChatFile } from "@/utils/chatFiles";

interface Props {
  to: string;
  /** Sends the text (and the file, if one is attached). Resolves false when it could not be sent. */
  onSend: (body: string, file: File | null) => Promise<boolean>;
  autoFocusKey: number;
}

/**
 * The box you type in: Enter sends, Shift+Enter adds a line, it grows up to a few lines. Attach a file with the paperclip,
 * by dropping it on the box, or by pasting a picture; the text then becomes its caption.
 */
export function ChatComposer({ to, onSend, autoFocusKey }: Props) {
  // UI state: the draft, the file waiting to be sent, whether a send is under way (so a double Enter cannot send twice),
  // and whether a file is being dragged over the box.
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  // Side effect: a different conversation starts with an empty box that has focus.
  useEffect(() => {
    setDraft("");
    setFile(null);
    box.current?.focus();
  }, [autoFocusKey]);

  // Side effect: size the box to its text (a layout measurement, not state).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  function choose(candidate: File | null | undefined) {
    if (!candidate) return;
    const problem = validateChatFile(candidate);
    if (problem) {
      notifyError(problem);
      return;
    }
    setFile(candidate);
    box.current?.focus();
  }

  const tooLong = draft.length > CHAT_LIMITS.maxMessage;
  const canSend = (Boolean(draft.trim()) || file !== null) && !sending && !tooLong;

  async function submit() {
    if (!canSend) return;
    const body = file ? draft.trim() : applySlashCommand(draft.trim());
    const pending = file;
    setSending(true);
    setDraft("");
    setFile(null);
    const ok = await onSend(body, pending);
    setSending(false);
    if (!ok) {
      // give everything back so nothing is lost
      setDraft(body);
      setFile(pending);
    }
    box.current?.focus();
  }

  function insert(emoji: string) {
    const el = box.current;
    if (!el) {
      setDraft((d) => d + emoji);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + emoji + draft.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  const length = draft.length;
  return (
    <div
      className={cn("border-t border-wt-border bg-wt-surface-1 p-3", dragging && "bg-[var(--wt-brand-soft)]")}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        choose(e.dataTransfer.files?.[0]);
      }}
    >
      {file ? (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-wt-border bg-wt-surface-2/60 px-3 py-2">
          <Paperclip className="size-4 shrink-0 text-wt-text-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-wt-text">{file.name || COPY.pastedImage}</span>
            <span className="block text-xs text-wt-text-muted">{formatBytes(file.size)}</span>
          </span>
          <button type="button" onClick={() => setFile(null)} aria-label={COPY.removeFile} className="grid size-7 place-items-center rounded-md text-wt-text-muted hover:bg-wt-surface-3">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="flex items-end gap-1.5 rounded-2xl border border-wt-border bg-wt-surface-1 px-2 py-2 focus-within:border-[var(--wt-brand)] focus-within:ring-2 focus-within:ring-[var(--wt-brand)]/20">
        <input
          ref={picker}
          type="file"
          accept={CHAT_FILE_ACCEPT}
          hidden
          onChange={(e) => {
            choose(e.target.files?.[0]);
            e.target.value = ""; // so picking the same file again still fires
          }}
        />
        <button
          type="button"
          onClick={() => picker.current?.click()}
          aria-label={COPY.attach}
          title={COPY.attach}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text"
        >
          <Paperclip className="size-5" aria-hidden />
        </button>
        <textarea
          ref={box}
          value={draft}
          rows={1}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={(e) => {
            const pasted = Array.from(e.clipboardData.files)[0];
            if (pasted) {
              e.preventDefault();
              choose(pasted.name ? pasted : new File([pasted], `pasted-image.${pasted.type.split("/")[1] || "png"}`, { type: pasted.type }));
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={file ? COPY.captionPlaceholder : COPY.composerPlaceholder(to)}
          aria-label={file ? COPY.captionPlaceholder : COPY.composerPlaceholder(to)}
          className="max-h-40 min-h-[1.75rem] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm text-wt-text outline-none placeholder:text-wt-text-faint"
        />
        <EmojiPicker onPick={insert} />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSend}
          aria-label={COPY.send}
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--wt-brand)] text-[var(--wt-brand-text)] transition-opacity disabled:opacity-40"
        >
          <SendHorizonal className="size-4" aria-hidden />
        </button>
      </div>
      {length >= CHAT_LIMITS.nearLimit ? (
        <p className={cn("mt-1 text-right text-[11px]", tooLong ? "font-medium text-rose-600" : "text-wt-text-muted")}>
          {length} / {CHAT_LIMITS.maxMessage}
        </p>
      ) : null}
    </div>
  );
}
