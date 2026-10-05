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

const JSON_BODY = { contentType: "application/json" } as const;

export const formService = {
  /** Forms sent to me: to-do first, done last. */
  mine() {
    return apiClient.get<ApiEnvelope<FormSummary[]>>(endpoints.forms.root);
  },

  /** Forms I sent (HR/Admin: all), with how many have answered. */
  managed() {
    return apiClient.get<ApiEnvelope<FormSummary[]>>(endpoints.forms.managed);
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
