"use client";

import { ArrowLeft, LogOut, Users } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { ChatAvatar } from "@/components/dashboard/chat/ChatAvatar";
import { ChatComposer } from "@/components/dashboard/chat/ChatComposer";
import { MessageBubble } from "@/components/dashboard/chat/MessageBubble";
import { Button } from "@/components/ui/button";
import { CHAT_COPY as COPY, CHAT_LIMITS, CHAT_QUERY_KEYS } from "@/constants/chat";
import { useChatThread } from "@/hooks/chat/useChatThread";
import { notifyError } from "@/lib/notify";
import { chatService } from "@/services/chat.service";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatConversation } from "@/types/chat";
import { buildThreadRows, lastRealId } from "@/utils/chatMessages";

interface Props {
  conversation: ChatConversation;
  myName: string;
  onBack: () => void;
  onLeave: (id: number) => void;
  onReport: (messageId: number) => void;
}

/** The right-hand side: header, the messages (day separators, grouped runs, unread divider), and the composer. */
export function ChatThread({ conversation, myName, onBack, onLeave, onReport }: Props) {
  const queryClient = useQueryClient();
  const thread = useChatThread(conversation.id);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const readSent = useRef(0);
  const dividerRef = useRef<HTMLDivElement>(null);
  const openedFor = useRef<number | null>(null);

  const rows = useMemo(
    () =>
      buildThreadRows(thread.messages, {
        now: new Date(),
        firstUnreadId: thread.firstUnreadId,
        groupWithinMs: CHAT_LIMITS.groupWithinMs,
        labels: { today: COPY.today, yesterday: COPY.yesterday },
      }),
    [thread.messages, thread.firstUnreadId]
  );
  const newest = lastRealId(thread.messages);

  // Side effect: keep the view pinned to the newest message when you were already at the bottom (or just sent one); on
  // opening, jump to the first unread message if there is one.
  useEffect(() => {
    const el = scroller.current;
    if (!el || thread.messages.length === 0) return;
    if (openedFor.current !== conversation.id) {
      openedFor.current = conversation.id;
      stickToBottom.current = true;
      if (dividerRef.current) dividerRef.current.scrollIntoView({ block: "center" });
      else el.scrollTop = el.scrollHeight;
      return;
    }
    const last = thread.messages[thread.messages.length - 1];
    if (stickToBottom.current || last?.mine) el.scrollTop = el.scrollHeight;
  }, [conversation.id, thread.messages]);

  // Side effect: tell the server what has been read, once per new newest message, only while the tab is visible.
  useEffect(() => {
    if (newest <= readSent.current || document.visibilityState !== "visible") return;
    readSent.current = newest;
    void chatService
      .markRead(conversation.id, newest)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations });
        void queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.unread });
      })
      .catch(() => undefined);
  }, [newest, conversation.id, queryClient]);

  async function edit(id: number, body: string): Promise<boolean> {
    try {
      const updated = (await chatService.edit(id, body)).data;
      if (updated) thread.patchMessage(id, { body: updated.body, edited: true });
      return true;
    } catch {
      notifyError("Couldn't save that change.");
      return false;
    }
  }

  async function react(id: number, emoji: string) {
    try {
      const reactions = (await chatService.react(id, emoji)).data?.reactions;
      if (reactions) thread.patchMessage(id, { reactions });
    } catch {
      notifyError("Couldn't add that reaction.");
    }
  }

  // A picture or video finishing loading makes the list taller; if you were at the bottom, stay there.
  function keepAtBottom() {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }

  async function remove(id: number) {
    try {
      await chatService.remove(id);
      thread.patchMessage(id, { deleted: true, body: "" });
    } catch {
      notifyError("Couldn't delete that message.");
    }
  }

  const isChannel = conversation.kind === "CHANNEL";
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-wt-border px-3 py-2.5">
        <button type="button" onClick={onBack} className="grid size-9 place-items-center rounded-lg text-wt-text-muted hover:bg-wt-surface-2 md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <ChatAvatar
          name={conversation.title}
          channel={isChannel}
          isPrivate={conversation.is_private}
          userId={conversation.partner?.user_id}
          hasPhoto={conversation.partner?.has_photo}
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-wt-text">{conversation.title}</h2>
          <p className="flex items-center gap-1.5 truncate text-xs text-wt-text-muted">
            {isChannel ? (
              <>
                <Users className="size-3.5 shrink-0" aria-hidden />
                {COPY.members(conversation.member_count)}
                {conversation.topic ? <span className="truncate">· {conversation.topic}</span> : null}
              </>
            ) : (
              conversation.partner?.department ?? ""
            )}
          </p>
        </div>
        {isChannel ? (
          <Button variant="ghost" size="sm" onClick={() => onLeave(conversation.id)} title={COPY.leave}>
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">{COPY.leave}</span>
          </Button>
        ) : null}
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="min-h-0 flex-1 overflow-y-auto py-3"
        aria-live="polite"
      >
        {thread.hasMore ? (
          <div className="flex justify-center pb-2">
            <Button variant="outline" size="sm" onClick={() => void thread.loadOlder()}>
              {COPY.loadEarlier}
            </Button>
          </div>
        ) : null}
        {thread.isLoading ? (
          <p className="px-4 py-6 text-sm text-wt-text-muted">{COPY.loading}</p>
        ) : thread.isError ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="text-sm text-wt-text-muted">{COPY.loadError}</p>
            <Button variant="outline" size="sm" onClick={() => void thread.refetch()}>
              {COPY.retry}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-wt-text-muted">{COPY.emptyThread}</p>
        ) : (
          rows.map((row) =>
            row.kind === "day" ? (
              <div key={row.key} className="my-3 flex items-center gap-3 px-4">
                <span className="h-px flex-1 bg-wt-border" />
                <span className="rounded-full border border-wt-border bg-wt-surface-1 px-2.5 py-0.5 text-[11px] font-medium text-wt-text-muted">{row.label}</span>
                <span className="h-px flex-1 bg-wt-border" />
              </div>
            ) : row.kind === "unread" ? (
              <div key={row.key} ref={dividerRef} className="my-2 flex items-center gap-3 px-4">
                <span className="h-px flex-1 bg-rose-400/60" />
                <span className="text-[11px] font-semibold text-rose-600">{COPY.newMessagesDivider}</span>
                <span className="h-px flex-1 bg-rose-400/60" />
              </div>
            ) : (
              <MessageBubble
                key={row.key}
                message={row.message}
                startsGroup={row.startsGroup}
                onEdit={edit}
                onDelete={(id) => void remove(id)}
                onReport={onReport}
                onReact={(id, emoji) => void react(id, emoji)}
                onMediaLoad={keepAtBottom}
              />
            )
          )
        )}
      </div>

      <ChatComposer to={conversation.title} autoFocusKey={conversation.id} onSend={(body, file) => (file ? thread.sendFile(file, body, myName) : thread.send(body, myName))} />
    </div>
  );
}
