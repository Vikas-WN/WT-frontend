import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type {
  AppEvent,
  EventAttendees,
  EventCreatePayload,
  EventUpdatePayload,
  RsvpChoice,
} from "@/types/event";
import { listQuery, type ListParams, type Paged } from "@/types/paged";
import { LIST_PAGE_SIZE } from "@/constants/contentCategories";

export interface EventListParams extends Omit<ListParams, "category"> {
  includePast?: boolean;
  organising?: boolean;
  eventType?: string;
}

const JSON_BODY = { contentType: "application/json" } as const;

export const eventService = {
  /** Events I'm invited to or organise (upcoming unless `includePast`), one page at a time. */
  list(params: EventListParams = {}) {
    const { includePast, organising, eventType, ...rest } = params;
    return apiClient.get<ApiEnvelope<Paged<AppEvent>>>(endpoints.events.root, {
      query: listQuery({
        ...rest,
        include_past: includePast,
        organising,
        event_type: eventType,
        page: rest.page ?? 0,
        size: rest.size ?? LIST_PAGE_SIZE,
      }),
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
