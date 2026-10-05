import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type {
  AppEvent,
  EventAttendees,
  EventCreatePayload,
  EventUpdatePayload,
  RsvpChoice,
} from "@/types/event";

const JSON_BODY = { contentType: "application/json" } as const;

export const eventService = {
  /** Events I'm invited to or organise (upcoming unless `includePast`). */
  list(includePast = false) {
    return apiClient.get<ApiEnvelope<AppEvent[]>>(endpoints.events.root, {
      query: includePast ? { include_past: "true" } : undefined,
    });
  },

  create(payload: EventCreatePayload) {
    return apiClient.post<ApiEnvelope<AppEvent>>(endpoints.events.root, { ...JSON_BODY, body: JSON.stringify(payload) });
  },

  update(id: number, payload: EventUpdatePayload) {
    return apiClient.put<ApiEnvelope<AppEvent>>(endpoints.events.byId(id), { ...JSON_BODY, body: JSON.stringify(payload) });
  },

  rsvp(id: number, response: RsvpChoice) {
    return apiClient.post<ApiEnvelope<AppEvent>>(endpoints.events.rsvp(id), {
      ...JSON_BODY,
      body: JSON.stringify({ response }),
    });
  },

  attendees(id: number) {
    return apiClient.get<ApiEnvelope<EventAttendees>>(endpoints.events.attendees(id));
  },
};
