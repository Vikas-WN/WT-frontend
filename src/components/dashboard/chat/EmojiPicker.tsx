"use client";

import { Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CHAT_EMOJI_PICKER, CHAT_COPY as COPY } from "@/constants/chat";

/** The smiley button beside the composer: opens a small grid of emoji and hands back the one picked. */
export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  // UI state: whether the grid is open.
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Side effect: close when you click elsewhere or press Escape.
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={COPY.emoji}
        aria-expanded={open}
        title={COPY.emoji}
        className="grid size-9 shrink-0 place-items-center rounded-xl text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text"
      >
        <Smile className="size-5" aria-hidden />
      </button>
      {open ? (
        <div className="absolute bottom-11 right-0 z-20 grid w-64 grid-cols-6 gap-0.5 rounded-xl border border-wt-border bg-wt-surface-1 p-2 shadow-lg">
          {CHAT_EMOJI_PICKER.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
              className="grid size-9 place-items-center rounded-lg text-xl transition-transform hover:scale-110 hover:bg-wt-surface-2"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
