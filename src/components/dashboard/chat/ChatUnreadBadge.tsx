"use client";

import { useChatUnreadCount } from "@/hooks/chat/useChatConversations";

/** The unread count beside "Chat" in the sidebar. Renders nothing when there is nothing unread. */
export function ChatUnreadBadge({ collapsed }: { collapsed: boolean }) {
  const { data } = useChatUnreadCount();
  if (!data) return null;
  return (
    <span
      className={
        collapsed
          ? "absolute right-1 top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold leading-4 text-white"
          : "ml-auto min-w-5 rounded-full bg-rose-500 px-1.5 text-center text-[11px] font-semibold leading-5 text-white"
      }
      aria-label={`${data} unread chat messages`}
    >
      {data > 99 ? "99+" : data}
    </span>
  );
}
