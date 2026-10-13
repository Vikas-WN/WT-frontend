import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type {
  ChatChannelSummary,
  ChatConversation,
  ChatMessage,
  ChatMessagePage,
  ChatPerson,
  ChatReport,
  CreateChannelPayload,
} from "@/types/chat";

const JSON_BODY = { contentType: "application/json" } as const;
const json = (value: unknown) => ({ ...JSON_BODY, body: JSON.stringify(value) });

export const chatService = {
  people(q: string) {
    return apiClient.get<ApiEnvelope<ChatPerson[]>>(endpoints.chat.people, { query: { q } });
  },
  conversations() {
    return apiClient.get<ApiEnvelope<ChatConversation[]>>(endpoints.chat.conversations);
  },
  unread() {
    return apiClient.get<ApiEnvelope<{ count: number }>>(endpoints.chat.unread);
  },
  openDm(userId: number) {
    return apiClient.post<ApiEnvelope<{ id: number }>>(endpoints.chat.dm, json({ user_id: userId }));
  },
  createChannel(payload: CreateChannelPayload) {
    return apiClient.post<ApiEnvelope<{ id: number; name: string }>>(endpoints.chat.channels, json(payload));
  },
  browseChannels() {
    return apiClient.get<ApiEnvelope<ChatChannelSummary[]>>(endpoints.chat.browse);
  },
  join(id: number) {
    return apiClient.post<ApiEnvelope<null>>(endpoints.chat.join(id), {});
  },
  leave(id: number) {
    return apiClient.post<ApiEnvelope<null>>(endpoints.chat.leave(id), {});
  },
  addMembers(id: number, userIds: number[]) {
    return apiClient.post<ApiEnvelope<{ added: number }>>(endpoints.chat.members(id), json({ user_ids: userIds }));
  },
  messages(id: number, params: { beforeId?: number; afterId?: number; limit?: number } = {}) {
    const query: Record<string, string> = {};
    if (params.beforeId) query.before_id = String(params.beforeId);
    if (params.afterId !== undefined) query.after_id = String(params.afterId);
    if (params.limit) query.limit = String(params.limit);
    return apiClient.get<ApiEnvelope<ChatMessagePage>>(endpoints.chat.messages(id), { query });
  },
  send(id: number, body: string) {
    return apiClient.post<ApiEnvelope<ChatMessage>>(endpoints.chat.messages(id), json({ body }));
  },
  markRead(id: number, messageId: number) {
    return apiClient.post<ApiEnvelope<null>>(endpoints.chat.read(id), json({ message_id: messageId }));
  },
  edit(messageId: number, body: string) {
    return apiClient.patch<ApiEnvelope<ChatMessage>>(endpoints.chat.message(messageId), json({ body }));
  },
  remove(messageId: number) {
    return apiClient.delete<ApiEnvelope<null>>(endpoints.chat.message(messageId));
  },
  report(messageId: number, reason: string) {
    return apiClient.post<ApiEnvelope<null>>(endpoints.chat.report(messageId), json({ reason }));
  },
  reports(onlyOpen = true) {
    return apiClient.get<ApiEnvelope<ChatReport[]>>(endpoints.chat.reports, { query: { only_open: String(onlyOpen) } });
  },
  resolveReport(reportId: number, outcome: string) {
    return apiClient.post<ApiEnvelope<null>>(endpoints.chat.resolveReport(reportId), json({ outcome }));
  },
};
