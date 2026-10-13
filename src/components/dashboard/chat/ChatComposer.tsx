"use client";

import { SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CHAT_COPY as COPY, CHAT_LIMITS } from "@/constants/chat";
import { cn } from "@/lib/utils";

/** The box you type in: Enter sends, Shift+Enter adds a line, and it grows up to a few lines. */
export function ChatComposer({ to, onSend, autoFocusKey }: { to: string; onSend: (body: string) => Promise<boolean>; autoFocusKey: number }) {
  // UI state: the draft, and whether a send is under way (so a double Enter cannot send twice).
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);

  // Side effect: a different conversation starts with an empty box that has focus.
  useEffect(() => {
    setDraft("");
    box.current?.focus();
  }, [autoFocusKey]);

  // Side effect: size the box to its text (a layout measurement, not state).
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  async function submit() {
    const body = draft.trim();
    if (!body || sending || body.length > CHAT_LIMITS.maxMessage) return;
    setSending(true);
    setDraft("");
    const ok = await onSend(body);
    setSending(false);
    if (!ok) setDraft(body); // give the text back so nothing is lost
    box.current?.focus();
  }

  const length = draft.length;
  return (
    <div className="border-t border-wt-border bg-wt-surface-1 p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-wt-border bg-wt-surface-1 px-3 py-2 focus-within:border-[var(--wt-brand)] focus-within:ring-2 focus-within:ring-[var(--wt-brand)]/20">
        <textarea
          ref={box}
          value={draft}
          rows={1}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={COPY.composerPlaceholder(to)}
          aria-label={COPY.composerPlaceholder(to)}
          className="max-h-40 min-h-[1.75rem] flex-1 resize-none bg-transparent py-1 text-sm text-wt-text outline-none placeholder:text-wt-text-faint"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!draft.trim() || sending || length > CHAT_LIMITS.maxMessage}
          aria-label={COPY.send}
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--wt-brand)] text-[var(--wt-brand-text)] transition-opacity disabled:opacity-40"
        >
          <SendHorizonal className="size-4" aria-hidden />
        </button>
      </div>
      {length >= CHAT_LIMITS.nearLimit ? (
        <p className={cn("mt-1 text-right text-[11px]", length > CHAT_LIMITS.maxMessage ? "font-medium text-rose-600" : "text-wt-text-muted")}>
          {length} / {CHAT_LIMITS.maxMessage}
        </p>
      ) : null}
    </div>
  );
}
