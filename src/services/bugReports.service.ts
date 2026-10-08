import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type {
  BugAttachment,
  BugReport,
  BugReportCreatePayload,
  BugReportList,
  BugReportListQuery,
  BugReportUpdatePayload,
} from "@/types/bugReport";

/** Large screen recordings on a slow connection need time; this is generous but not endless. */
const ATTACHMENT_TIMEOUT_MS = 180_000;
const JSON_BODY = { contentType: "application/json" } as const;

export const bugReportService = {
  create(payload: BugReportCreatePayload) {
    return apiClient.post<ApiEnvelope<BugReport>>(endpoints.bugReports.root, {
      ...JSON_BODY,
      body: JSON.stringify(payload),
    });
  },

  /** One file per call, so each can succeed or fail on its own (and be retried) without losing the report. */
  addAttachment(id: number, file: File) {
    const body = new FormData();
    body.append("file", file);
    return apiClient.post<ApiEnvelope<BugAttachment>>(endpoints.bugReports.attachments(id), { body, timeoutMs: ATTACHMENT_TIMEOUT_MS });
  },

  mine() {
    return apiClient.get<ApiEnvelope<BugReport[]>>(endpoints.bugReports.mine);
  },

  /** HR/Admin — every report. */
  list(params: BugReportListQuery = {}) {
    const query: Record<string, string> = {};
    if (params.status) query.status = params.status;
    if (params.severity) query.severity = params.severity;
    if (params.page != null) query.page = String(params.page);
    if (params.size != null) query.size = String(params.size);
    return apiClient.get<ApiEnvelope<BugReportList>>(endpoints.bugReports.root, { query });
  },

  update(id: number, payload: BugReportUpdatePayload) {
    return apiClient.put<ApiEnvelope<BugReport>>(endpoints.bugReports.byId(id), {
      ...JSON_BODY,
      body: JSON.stringify(payload),
    });
  },
};
