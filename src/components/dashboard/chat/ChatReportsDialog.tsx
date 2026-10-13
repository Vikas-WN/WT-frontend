"use client";

import { useState } from "react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { MessageAttachment } from "@/components/dashboard/chat/MessageAttachment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHAT_COPY as COPY } from "@/constants/chat";
import { useChatReports } from "@/hooks/chat/useChatActions";
import { cn } from "@/lib/utils";
import type { ChatReport } from "@/types/chat";
import { clockTime } from "@/utils/chatDisplay";

function ReportCard({ report, onClose }: { report: ChatReport; onClose: (outcome: string) => void }) {
  // UI state: what was done, typed before closing the report.
  const [outcome, setOutcome] = useState("");
  return (
    <li className="rounded-xl border border-wt-border p-3">
      <p className="text-xs text-wt-text-muted">
        {report.conversation} · reported by {report.reporter}
      </p>
      <p className="mt-1 text-sm font-medium text-wt-text">“{report.reason}”</p>
      <ul className="mt-2 space-y-1 rounded-lg bg-wt-surface-2 p-2">
        {report.messages.map((m) => (
          <li key={m.id} className={cn("text-xs", m.reported ? "rounded bg-rose-500/10 px-1.5 py-1 text-wt-text" : "text-wt-text-muted")}>
            <span className="font-semibold">{m.sender_name}</span> <span className="text-wt-text-faint">{clockTime(m.created_at)}</span>
            <span className="block whitespace-pre-wrap break-words">{m.body}</span>
            {m.attachment ? <MessageAttachment attachment={m.attachment} /> : null}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder={COPY.outcomePlaceholder} maxLength={200} className="h-9" aria-label={COPY.outcomePlaceholder} />
        <Button size="sm" variant="outline" disabled={outcome.trim().length < 2} onClick={() => onClose(outcome.trim())}>
          {COPY.closeReport}
        </Button>
      </div>
    </li>
  );
}

/** HR/Admin: messages people have reported, each with a few messages around it. Reading them is logged on the server. */
export function ChatReportsDialog({ onClose }: { onClose: () => void }) {
  const { reports, resolve } = useChatReports(true);
  const items = reports.data ?? [];
  return (
    <WtFormDialog open title={COPY.reportedMessages} onClose={onClose} cancelLabel="Close" maxWidthClass="max-w-2xl">
      {reports.isLoading ? (
        <p className="text-sm text-wt-text-muted">{COPY.loading}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-wt-text-muted">{COPY.noReports}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <ReportCard key={r.report_id} report={r} onClose={(outcome) => resolve.mutate({ reportId: r.report_id, outcome })} />
          ))}
        </ul>
      )}
    </WtFormDialog>
  );
}
