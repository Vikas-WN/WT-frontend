"use client";

import { SmilePlus } from "lucide-react";
import { useState } from "react";

import { CHAT_REACTIONS, CHAT_COPY as COPY } from "@/constants/chat";
import { cn } from "@/lib/utils";
import type { ChatReaction } from "@/types/chat";

/** The reactions on a message as little pills (yours highlighted), plus a button to add one. Tapping a pill toggles yours. */
export function ReactionBar({ reactions, onReact, disabled }: { reactions: ChatReaction[]; onReact: (emoji: string) => void; disabled?: boolean }) {
  // UI state: whether the row of choices is open.
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          disabled={disabled}
          onClick={() => onReact(r.emoji)}
          aria-pressed={r.mine}
          aria-label={`${r.emoji} ${r.count}`}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
            r.mine ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]" : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:bg-wt-surface-2"
          )}
        >
          <span className="text-sm leading-none">{r.emoji}</span>
          <span className="font-medium tabular-nums">{r.count}</span>
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label={COPY.react}
        aria-expanded={open}
        title={COPY.react}
        className={cn(
          "grid size-6 place-items-center rounded-full border border-wt-border bg-wt-surface-1 text-wt-text-muted hover:bg-wt-surface-2",
          reactions.length === 0 && !open && "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100"
        )}
      >
        <SmilePlus className="size-3.5" aria-hidden />
      </button>
      {open ? (
        <span className="flex items-center gap-0.5 rounded-full border border-wt-border bg-wt-surface-1 p-0.5 shadow-sm">
          {CHAT_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setOpen(false);
                onReact(emoji);
              }}
              aria-label={emoji}
              className="grid size-7 place-items-center rounded-full text-base transition-transform hover:scale-125 hover:bg-wt-surface-2"
            >
              {emoji}
            </button>
          ))}
        </span>
      ) : null}
    </div>
  );
}
