"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { ChatAvatar } from "@/components/dashboard/chat/ChatAvatar";
import { Input } from "@/components/ui/input";
import { CHAT_COPY as COPY } from "@/constants/chat";
import { useChatPeople } from "@/hooks/chat/useChatActions";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ChatPerson } from "@/types/chat";

/** Type a name, pick a colleague. Used to start a message and to add people to a channel. */
export function PersonPicker({ onPick, exclude = [], autoFocus = true }: { onPick: (person: ChatPerson) => void; exclude?: readonly number[]; autoFocus?: boolean }) {
  // UI state: the search text.
  const [text, setText] = useState("");
  const term = useDebouncedValue(text, 250);
  const people = useChatPeople(term);
  const results = (people.data ?? []).filter((p) => !exclude.includes(p.user_id));

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-faint" aria-hidden />
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={COPY.findPerson} aria-label={COPY.findPerson} autoFocus={autoFocus} className="pl-9" />
      </div>
      <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
        {term.trim() && !people.isLoading && results.length === 0 ? <li className="px-2 py-3 text-sm text-wt-text-muted">{COPY.noPeople}</li> : null}
        {results.map((p) => (
          <li key={p.user_id}>
            <button type="button" onClick={() => onPick(p)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-wt-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]">
              <ChatAvatar name={p.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-wt-text">{p.name}</span>
                {p.department ? <span className="block truncate text-xs text-wt-text-muted">{p.department}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
