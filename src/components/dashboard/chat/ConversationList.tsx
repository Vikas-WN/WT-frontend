"use client";

import { Compass, Flag, PenSquare, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ChatAvatar } from "@/components/dashboard/chat/ChatAvatar";
import { Input } from "@/components/ui/input";
import { CHAT_COPY as COPY } from "@/constants/chat";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types/chat";
import { listTime } from "@/utils/chatDisplay";

interface Props {
  conversations: readonly ChatConversation[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNewMessage: () => void;
  onNewChannel: () => void;
  onBrowse: () => void;
  /** HR/Admin only: opens the reported-messages review. */
  onReports?: () => void;
  reportCount?: number;
}

function Row({ c, active, onSelect, now }: { c: ChatConversation; active: boolean; onSelect: () => void; now: Date }) {
  const unread = c.unread_count > 0;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
          active ? "bg-[var(--wt-brand-soft)]" : "hover:bg-wt-surface-2"
        )}
      >
        <ChatAvatar name={c.title} channel={c.kind === "CHANNEL"} isPrivate={c.is_private} userId={c.partner?.user_id} hasPhoto={c.partner?.has_photo} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-sm text-wt-text", unread ? "font-semibold" : "font-medium")}>{c.title}</span>
            <span className="shrink-0 text-[11px] text-wt-text-faint">{listTime(c.last_message_at, now)}</span>
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className={cn("truncate text-xs", unread ? "text-wt-text" : "text-wt-text-muted")}>{c.last_message_preview ?? "—"}</span>
            {unread ? (
              <span className="shrink-0 rounded-full bg-[var(--wt-brand)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[var(--wt-brand-text)]" aria-label={`${c.unread_count} unread`}>
                {c.unread_count > 99 ? "99+" : c.unread_count}
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

/** Channels and direct messages, newest activity first, with unread counts and a filter. */
export function ConversationList(p: Props) {
  // UI state: the filter text.
  const [filter, setFilter] = useState("");
  const now = useMemo(() => new Date(), []);
  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return term ? p.conversations.filter((c) => c.title.toLowerCase().includes(term)) : p.conversations;
  }, [p.conversations, filter]);
  const channels = visible.filter((c) => c.kind === "CHANNEL");
  const directs = visible.filter((c) => c.kind === "DM");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
        <h2 className="text-base font-semibold text-wt-text">{COPY.messages}</h2>
        <div className="flex items-center gap-0.5">
          {p.onReports ? (
            <button type="button" onClick={p.onReports} title={COPY.reportedMessages} aria-label={COPY.reportedMessages} className="relative grid size-8 place-items-center rounded-lg text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text">
              <Flag className="size-4" aria-hidden />
              {p.reportCount ? <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-4 text-white">{p.reportCount}</span> : null}
            </button>
          ) : null}
          <button type="button" onClick={p.onBrowse} title={COPY.browse} aria-label={COPY.browse} className="grid size-8 place-items-center rounded-lg text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text">
            <Compass className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={p.onNewChannel} title={COPY.newChannel} aria-label={COPY.newChannel} className="grid size-8 place-items-center rounded-lg text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text">
            <Plus className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={p.onNewMessage} title={COPY.newMessage} aria-label={COPY.newMessage} className="grid size-8 place-items-center rounded-lg text-[var(--wt-brand)] hover:bg-[var(--wt-brand-soft)]">
            <PenSquare className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="relative px-3 pb-2">
        <Search className="pointer-events-none absolute left-5.5 top-1/2 size-4 -translate-y-[60%] text-wt-text-faint" aria-hidden />
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={COPY.search} aria-label={COPY.search} className="h-9 pl-8" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {p.loading && p.conversations.length === 0 ? (
          <p className="px-3 py-6 text-sm text-wt-text-muted">{COPY.loading}</p>
        ) : visible.length === 0 ? (
          <p className="px-3 py-6 text-sm text-wt-text-muted">{COPY.emptyList}</p>
        ) : (
          <>
            {channels.length > 0 ? (
              <section>
                <h3 className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-wt-text-faint">{COPY.channels}</h3>
                <ul className="space-y-0.5">{channels.map((c) => <Row key={c.id} c={c} now={now} active={c.id === p.selectedId} onSelect={() => p.onSelect(c.id)} />)}</ul>
              </section>
            ) : null}
            {directs.length > 0 ? (
              <section>
                <h3 className="px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-wt-text-faint">{COPY.directMessages}</h3>
                <ul className="space-y-0.5">{directs.map((c) => <Row key={c.id} c={c} now={now} active={c.id === p.selectedId} onSelect={() => p.onSelect(c.id)} />)}</ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
