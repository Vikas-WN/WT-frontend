import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type {
  Announcement,
  AnnouncementCreatePayload,
  AnnouncementUpdatePayload,
  Poll,
  PollResults,
} from "@/types/announcement";
import type { AudienceOptions } from "@/types/audience";
import { listQuery, type ListParams, type Paged } from "@/types/paged";
import { LIST_PAGE_SIZE } from "@/constants/contentCategories";

const JSON_BODY = { contentType: "application/json" } as const;

export const announcementService = {
  /** Announcements sent to me, pinned first. */
  feed(params: ListParams & { unread?: boolean } = {}) {
    return apiClient.get<ApiEnvelope<Paged<Announcement>>>(endpoints.announcements.root, {
      query: listQuery({ ...params, page: params.page ?? 0, size: params.size ?? LIST_PAGE_SIZE }),
    });
  },

  unreadCount() {
    return apiClient.get<ApiEnvelope<{ unread: number }>>(endpoints.announcements.unreadCount);
  },

  /** What I posted (HR/Admin: everything), with reach. */
  managed(params: ListParams = {}) {
    return apiClient.get<ApiEnvelope<Paged<Announcement>>>(endpoints.announcements.managed, {
      query: listQuery({ ...params, page: params.page ?? 0, size: params.size ?? LIST_PAGE_SIZE }),
    });
  },

  create(payload: AnnouncementCreatePayload) {
    return apiClient.post<ApiEnvelope<Announcement>>(endpoints.announcements.root, {
      ...JSON_BODY,
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: AnnouncementUpdatePayload) {
    return apiClient.put<ApiEnvelope<Announcement>>(endpoints.announcements.byId(id), {
      ...JSON_BODY,
      body: JSON.stringify(payload),
    });
  },

  markRead(id: number) {
    return apiClient.post<ApiEnvelope<{ id: number }>>(endpoints.announcements.readById(id), {});
  },

  vote(id: number, optionIds: string[]) {
    return apiClient.post<ApiEnvelope<Poll>>(endpoints.announcements.voteById(id), {
      ...JSON_BODY,
      body: JSON.stringify({ option_ids: optionIds }),
    });
  },

  /** Who voted for what — HR/Admin or the poster only. */
  pollResults(id: number) {
    return apiClient.get<ApiEnvelope<PollResults>>(endpoints.announcements.pollResultsById(id));
  },

  /** The audience picker's choices — shared by announcements, events and forms. */
  audienceOptions() {
    return apiClient.get<ApiEnvelope<AudienceOptions>>(endpoints.audience.options);
  },
};
