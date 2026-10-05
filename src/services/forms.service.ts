import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type {
  FormAnswers,
  FormCreatePayload,
  FormDetail,
  FormResponses,
  FormSummary,
  FormUpdatePayload,
} from "@/types/form";
import { listQuery, type ListParams, type Paged } from "@/types/paged";
import { LIST_PAGE_SIZE } from "@/constants/contentCategories";

const JSON_BODY = { contentType: "application/json" } as const;

export const formService = {
  /** Forms sent to me: to-do first, done last. */
  mine(params: ListParams & { status?: "all" | "todo" | "done" } = {}) {
    return apiClient.get<ApiEnvelope<Paged<FormSummary>>>(endpoints.forms.root, {
      query: listQuery({ ...params, page: params.page ?? 0, size: params.size ?? LIST_PAGE_SIZE }),
    });
  },

  /** Forms I sent (HR/Admin: all), with how many have answered. */
  managed(params: ListParams = {}) {
    return apiClient.get<ApiEnvelope<Paged<FormSummary>>>(endpoints.forms.managed, {
      query: listQuery({ ...params, page: params.page ?? 0, size: params.size ?? LIST_PAGE_SIZE }),
    });
  },

  detail(id: number) {
    return apiClient.get<ApiEnvelope<FormDetail>>(endpoints.forms.byId(id));
  },

  create(payload: FormCreatePayload) {
    return apiClient.post<ApiEnvelope<FormSummary>>(endpoints.forms.root, { ...JSON_BODY, body: JSON.stringify(payload) });
  },

  submit(id: number, answers: FormAnswers) {
    return apiClient.post<ApiEnvelope<FormSummary>>(endpoints.forms.submit(id), {
      ...JSON_BODY,
      body: JSON.stringify({ answers }),
    });
  },

  update(id: number, payload: FormUpdatePayload) {
    return apiClient.put<ApiEnvelope<FormSummary>>(endpoints.forms.byId(id), { ...JSON_BODY, body: JSON.stringify(payload) });
  },

  responses(id: number) {
    return apiClient.get<ApiEnvelope<FormResponses>>(endpoints.forms.responses(id));
  },

  /** The responses as a CSV file. */
  responsesCsv(id: number) {
    return apiClient.get<Blob>(endpoints.forms.responsesCsv(id), { responseType: "blob" });
  },

  remind(id: number) {
    return apiClient.post<ApiEnvelope<{ reminded: number }>>(endpoints.forms.remind(id), {});
  },
};
