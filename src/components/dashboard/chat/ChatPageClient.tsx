"use client";

import { MessagesSquare } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { ChatThread } from "@/components/dashboard/chat/ChatThread";
import { BrowseChannelsDialog, NewChannelDialog, NewMessageDialog, ReportMessageDialog } from "@/components/dashboard/chat/ChatDialogs";
import { ChatReportsDialog } from "@/components/dashboard/chat/ChatReportsDialog";
import { ConversationList } from "@/components/dashboard/chat/ConversationList";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { CHAT_COPY as COPY } from "@/constants/chat";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { useChatMembership, useChatReports } from "@/hooks/chat/useChatActions";
import { useChatConversations } from "@/hooks/chat/useChatConversations";
import { cn } from "@/lib/utils";

type Dialog = "new-message" | "new-channel" | "browse" | "reports" | null;

/** Chat: conversations on the left, the open conversation on the right (one at a time on a phone). */
export function ChatPageClient() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const conversations = useChatConversations();
  const { leave } = useChatMembership();
  // UI state: which dialog is open, and the message being reported.
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reportingId, setReportingId] = useState<number | null>(null);

  const isReviewer = Boolean(user?.roles?.some((r) => r === "ROLE_HR" || r === "ROLE_ADMIN"));
  const reportCount = useChatReports(isReviewer).reports.data?.length ?? 0;

  const selectedId = Number(params.get("c")) || null;
  const selected = useMemo(() => (conversations.data ?? []).find((c) => c.id === selectedId) ?? null, [conversations.data, selectedId]);

  const open = useCallback(
    (id: number | null) => router.push(id ? `${DASHBOARD_ROUTES.chat}?c=${id}` : DASHBOARD_ROUTES.chat),
    [router]
  );

  return (
    <DashboardPageShell>
      <div className="grid h-[calc(100dvh-8.5rem)] min-h-[28rem] overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 shadow-[var(--wt-shadow-sm)] md:grid-cols-[20rem_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className={cn("min-h-0 border-wt-border md:border-r", selected ? "max-md:hidden" : "")}>
          <ConversationList
            conversations={conversations.data ?? []}
            loading={conversations.isLoading}
            selectedId={selectedId}
            onSelect={open}
            onNewMessage={() => setDialog("new-message")}
            onNewChannel={() => setDialog("new-channel")}
            onBrowse={() => setDialog("browse")}
            onReports={isReviewer ? () => setDialog("reports") : undefined}
            reportCount={reportCount}
          />
        </aside>
        <section className={cn("min-h-0", selected ? "" : "max-md:hidden")}>
          {selected ? (
            <ChatThread
              key={selected.id}
              conversation={selected}
              myName={user?.name ?? COPY.you}
              onBack={() => open(null)}
              onLeave={(id) => leave.mutate(id, { onSuccess: () => open(null) })}
              onReport={setReportingId}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]" aria-hidden>
                <MessagesSquare className="size-7" />
              </span>
              <p className="text-sm text-wt-text-muted">{COPY.pickOne}</p>
              <Button variant="brand" size="sm" onClick={() => setDialog("new-message")}>
                {COPY.newMessage}
              </Button>
            </div>
          )}
        </section>
      </div>

      {dialog === "new-message" ? <NewMessageDialog onClose={() => setDialog(null)} onOpen={open} /> : null}
      {dialog === "new-channel" ? <NewChannelDialog onClose={() => setDialog(null)} onOpen={open} /> : null}
      {dialog === "browse" ? <BrowseChannelsDialog onClose={() => setDialog(null)} onOpen={open} /> : null}
      {dialog === "reports" ? <ChatReportsDialog onClose={() => setDialog(null)} /> : null}
      {reportingId !== null ? <ReportMessageDialog messageId={reportingId} onClose={() => setReportingId(null)} /> : null}
    </DashboardPageShell>
  );
}
