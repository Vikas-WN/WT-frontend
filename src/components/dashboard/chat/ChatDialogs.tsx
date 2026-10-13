"use client";

import { Hash, Lock, X } from "lucide-react";
import { useState } from "react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { PersonPicker } from "@/components/dashboard/chat/PersonPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHAT_COPY as COPY } from "@/constants/chat";
import { useBrowseChannels, useChatMembership, useReportMessage } from "@/hooks/chat/useChatActions";
import type { ChatPerson } from "@/types/chat";

export function NewMessageDialog({ onClose, onOpen }: { onClose: () => void; onOpen: (conversationId: number) => void }) {
  const { openDm } = useChatMembership();
  return (
    <WtFormDialog open title={COPY.newMessage} onClose={onClose} cancelLabel="Close" maxWidthClass="max-w-md">
      <PersonPicker
        onPick={(person) =>
          openDm.mutate(person.user_id, {
            onSuccess: (id) => {
              onOpen(id);
              onClose();
            },
          })
        }
      />
    </WtFormDialog>
  );
}

export function NewChannelDialog({ onClose, onOpen }: { onClose: () => void; onOpen: (conversationId: number) => void }) {
  const { createChannel } = useChatMembership();
  // UI state: the form being filled in.
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [members, setMembers] = useState<ChatPerson[]>([]);
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9 _-]/g, "").replace(/[ _-]+/g, "-").replace(/^-|-$/g, "");

  return (
    <WtFormDialog
      open
      title={COPY.newChannel}
      onClose={onClose}
      onSubmit={() =>
        createChannel.mutate(
          { name, topic: topic.trim() || undefined, is_private: isPrivate, member_ids: members.map((m) => m.user_id) },
          {
            onSuccess: (id) => {
              onOpen(id);
              onClose();
            },
          }
        )
      }
      submitLabel={COPY.create}
      submitDisabled={slug.length < 2}
      loading={createChannel.isPending}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-wt-text" htmlFor="channel-name">
            {COPY.channelName}
          </label>
          <div className="relative">
            {isPrivate ? <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-faint" aria-hidden /> : <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-faint" aria-hidden />}
            <Input id="channel-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" autoFocus placeholder="project-alpha" maxLength={60} />
          </div>
          <p className="mt-1.5 text-xs text-wt-text-muted">{slug.length >= 2 ? `#${slug}` : COPY.channelNameHint}</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-wt-text" htmlFor="channel-topic">
            {COPY.channelTopic}
          </label>
          <Input id="channel-topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} />
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-wt-surface-2 px-3 py-2.5">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="mt-0.5 size-4 accent-[var(--wt-brand)]" />
          <span>
            <span className="block text-sm font-medium text-wt-text">{COPY.makePrivate}</span>
            <span className="block text-xs text-wt-text-muted">{COPY.makePrivateHint}</span>
          </span>
        </label>
        <div>
          <p className="mb-1.5 text-sm font-medium text-wt-text">{COPY.addPeople}</p>
          {members.length > 0 ? (
            <ul className="mb-2 flex flex-wrap gap-1.5">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-1 rounded-full bg-[var(--wt-brand-soft)] py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--wt-brand)]">
                  {m.name}
                  <button type="button" onClick={() => setMembers((l) => l.filter((x) => x.user_id !== m.user_id))} aria-label={`Remove ${m.name}`} className="grid size-5 place-items-center rounded-full hover:bg-[var(--wt-brand)]/15">
                    <X className="size-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <PersonPicker autoFocus={false} exclude={members.map((m) => m.user_id)} onPick={(p) => setMembers((l) => [...l, p])} />
        </div>
      </div>
    </WtFormDialog>
  );
}

export function BrowseChannelsDialog({ onClose, onOpen }: { onClose: () => void; onOpen: (conversationId: number) => void }) {
  const channels = useBrowseChannels(true);
  const { join } = useChatMembership();
  return (
    <WtFormDialog open title={COPY.browse} onClose={onClose} cancelLabel="Close" maxWidthClass="max-w-lg">
      {channels.isLoading ? (
        <p className="text-sm text-wt-text-muted">{COPY.loading}</p>
      ) : (channels.data ?? []).length === 0 ? (
        <p className="text-sm text-wt-text-muted">{COPY.noChannels}</p>
      ) : (
        <ul className="space-y-1">
          {(channels.data ?? []).map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-wt-surface-2">
              <Hash className="size-4 shrink-0 text-wt-text-muted" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-wt-text">{c.name}</span>
                <span className="block truncate text-xs text-wt-text-muted">
                  {COPY.members(c.member_count)}
                  {c.topic ? ` · ${c.topic}` : ""}
                </span>
              </span>
              <Button
                size="sm"
                variant={c.joined ? "outline" : "brand"}
                disabled={join.isPending}
                onClick={() => {
                  if (c.joined) {
                    onOpen(c.id);
                    onClose();
                  } else {
                    join.mutate(c.id, {
                      onSuccess: (id) => {
                        onOpen(id);
                        onClose();
                      },
                    });
                  }
                }}
              >
                {c.joined ? COPY.open : COPY.join}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </WtFormDialog>
  );
}

export function ReportMessageDialog({ messageId, onClose }: { messageId: number; onClose: () => void }) {
  const report = useReportMessage();
  // UI state: the reason being typed.
  const [reason, setReason] = useState("");
  return (
    <WtFormDialog
      open
      title={COPY.reportTitle}
      description={COPY.reportHint}
      onClose={onClose}
      onSubmit={() => report.mutate({ messageId, reason }, { onSuccess: onClose })}
      submitLabel={COPY.report}
      submitDisabled={reason.trim().length < 3}
      loading={report.isPending}
      maxWidthClass="max-w-md"
    >
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        rows={4}
        autoFocus
        placeholder={COPY.reportPlaceholder}
        aria-label={COPY.reportPlaceholder}
        className="w-full resize-y rounded-xl border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm text-wt-text outline-none focus:border-[var(--wt-brand)]"
      />
    </WtFormDialog>
  );
}
