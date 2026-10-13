"use client";

import { Check, Flag, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { ChatAvatar } from "@/components/dashboard/chat/ChatAvatar";
import { MessageAttachment } from "@/components/dashboard/chat/MessageAttachment";
import { ReactionBar } from "@/components/dashboard/chat/ReactionBar";
import { CHAT_CONFETTI_EMOJI, CHAT_COPY as COPY, CHAT_LIMITS } from "@/constants/chat";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { clockTime } from "@/utils/chatDisplay";

interface Props {
  message: ChatMessage;
  /** Show the sender's name and avatar (the first message of a run). */
  startsGroup: boolean;
  onEdit: (id: number, body: string) => Promise<boolean>;
  onDelete: (id: number) => void;
  onReport: (id: number) => void;
  onReact: (id: number, emoji: string) => void;
  /** A picture or video finished loading (the list got taller). */
  onMediaLoad?: () => void;
}

const CONFETTI_COLOURS = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#eab308"];

/** A short burst of confetti over a message when someone reacts with 🎉 (a few dots; none at all for reduced motion). */
function Confetti() {
  return (
    <span className="pointer-events-none absolute left-16 top-2 z-10" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="wt-confetti absolute block size-1.5 rounded-sm"
          style={{
            backgroundColor: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
            ["--dx" as string]: `${(i - 7) * 11}px`,
            ["--dy" as string]: `${-30 - (i % 4) * 14}px`,
            animationDelay: `${(i % 5) * 30}ms`,
          }}
        />
      ))}
    </span>
  );
}

function Actions({ mine, canEdit, onEdit, onDelete, onReport }: { mine: boolean; canEdit: boolean; onEdit: () => void; onDelete: () => void; onReport: () => void }) {
  const cls = "grid size-7 place-items-center rounded-md text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text";
  return (
    <span className="absolute -top-3 right-2 hidden items-center gap-0.5 rounded-lg border border-wt-border bg-wt-surface-1 p-0.5 shadow-sm group-hover:flex group-focus-within:flex">
      {mine ? (
        <>
          {canEdit ? (
            <button type="button" className={cls} onClick={onEdit} title={COPY.edit} aria-label={COPY.edit}>
              <Pencil className="size-3.5" aria-hidden />
            </button>
          ) : null}
          <button type="button" className={cls} onClick={onDelete} title={COPY.delete} aria-label={COPY.delete}>
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </>
      ) : (
        <button type="button" className={cls} onClick={onReport} title={COPY.report} aria-label={COPY.report}>
          <Flag className="size-3.5" aria-hidden />
        </button>
      )}
    </span>
  );
}

/** One message: grouped under a name and avatar when it opens a run, with edit / delete (yours) or report (theirs) on hover. */
export function MessageBubble({ message, startsGroup, onEdit, onDelete, onReport, onReact, onMediaLoad }: Props) {
  // UI state: whether this message is being edited, and the edited text; and whether the confetti is showing.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [confetti, setConfetti] = useState(false);

  function react(emoji: string) {
    const adding = !(message.reactions ?? []).some((r) => r.emoji === emoji && r.mine);
    onReact(message.id, emoji);
    if (adding && emoji === CHAT_CONFETTI_EMOJI) {
      setConfetti(true);
      window.setTimeout(() => setConfetti(false), 1300);
    }
  }

  async function save() {
    const text = draft.trim();
    if (!text || text === message.body) {
      setEditing(false);
      return;
    }
    if (await onEdit(message.id, text)) setEditing(false);
  }

  const deleted = message.deleted;
  return (
    <div className={cn("group relative flex gap-3 px-4 py-0.5 hover:bg-wt-surface-2/50", startsGroup && "mt-3")}>
      <div className="w-10 shrink-0">
        {startsGroup ? <ChatAvatar name={message.sender_name} userId={message.sender_id || null} hasPhoto={message.sender_has_photo} /> : <span className="hidden pt-1.5 text-[10px] text-wt-text-faint group-hover:block">{clockTime(message.created_at)}</span>}
      </div>
      <div className="min-w-0 flex-1">
        {startsGroup ? (
          <p className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-wt-text">{message.mine ? COPY.you : message.sender_name}</span>
            <span className="text-[11px] text-wt-text-faint">{clockTime(message.created_at)}</span>
          </p>
        ) : null}
        {editing ? (
          <div className="mt-1 flex items-start gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={CHAT_LIMITS.maxMessage}
              rows={2}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void save();
                }
                if (e.key === "Escape") setEditing(false);
              }}
              className="min-h-[2.5rem] flex-1 resize-y rounded-lg border border-wt-border bg-wt-surface-1 px-2.5 py-1.5 text-sm text-wt-text outline-none focus:border-[var(--wt-brand)]"
              aria-label={COPY.edit}
            />
            <button type="button" onClick={() => void save()} className="grid size-8 place-items-center rounded-lg bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" aria-label={COPY.send}>
              <Check className="size-4" aria-hidden />
            </button>
            <button type="button" onClick={() => setEditing(false)} className="grid size-8 place-items-center rounded-lg border border-wt-border text-wt-text-muted" aria-label="Cancel">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : deleted ? (
          <p className="text-sm italic text-wt-text-faint">{COPY.deletedMessage}</p>
        ) : (
          <>
            {message.body ? (
              <p className={cn("whitespace-pre-wrap break-words text-sm text-wt-text", message.pending && "opacity-60")}>
                {message.body}
                {message.edited ? <span className="ml-1.5 text-[11px] text-wt-text-faint">({COPY.edited})</span> : null}
              </p>
            ) : null}
            {message.attachment ? <MessageAttachment attachment={message.attachment} uploading={message.pending} onMediaLoad={onMediaLoad} /> : null}
            {!message.pending ? <ReactionBar reactions={message.reactions ?? []} onReact={react} /> : null}
          </>
        )}
      </div>
      {confetti ? <Confetti /> : null}
      {!editing && !deleted && !message.pending ? (
        <Actions
          mine={message.mine}
          canEdit={Boolean(message.body) || !message.attachment}
          onEdit={() => {
            setDraft(message.body);
            setEditing(true);
          }}
          onDelete={() => onDelete(message.id)}
          onReport={() => onReport(message.id)}
        />
      ) : null}
    </div>
  );
}
