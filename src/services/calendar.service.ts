import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type { CalendarFeedLinks } from "@/types/calendar";

export const calendarService = {
  /** My subscription links (created on first use). */
  feedInfo() {
    return apiClient.get<ApiEnvelope<CalendarFeedLinks>>(endpoints.calendar.feedInfo);
  },

  /** Replace the link; the old one stops working at once. */
  regenerate() {
    return apiClient.post<ApiEnvelope<CalendarFeedLinks>>(endpoints.calendar.regenerate, {});
  },

  /** One event as an .ics file. */
  eventIcs(id: number) {
    return apiClient.get<Blob>(endpoints.calendar.eventIcs(id), { responseType: "blob" });
  },
};
