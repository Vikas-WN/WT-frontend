import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type { Announcement, AnnouncementCreatePayload, AnnouncementUpdatePayload } from "@/types/announcement";
import type { AudienceOptions } from "@/types/audience";

const JSON_BODY = { contentType: "application/json" } as const;

export const announcementService = {
  /** Announcements sent to me, pinned first. */
  feed() {
    return apiClient.get<ApiEnvelope<Announcement[]>>(endpoints.announcements.root);
  },

  unreadCount() {
    return apiClient.get<ApiEnvelope<{ unread: number }>>(endpoints.announcements.unreadCount);
  },

  /** What I posted (HR/Admin: everything), with reach. */
  managed() {
    return apiClient.get<ApiEnvelope<Announcement[]>>(endpoints.announcements.managed);
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

  /** The audience picker's choices — shared by announcements, events and forms. */
  audienceOptions() {
    return apiClient.get<ApiEnvelope<AudienceOptions>>(endpoints.audience.options);
  },
};
