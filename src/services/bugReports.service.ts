import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type {
  BugReport,
  BugReportCreatePayload,
  BugReportList,
  BugReportListQuery,
  BugReportUpdatePayload,
} from "@/types/bugReport";

const JSON_BODY = { contentType: "application/json" } as const;

export const bugReportService = {
  create(payload: BugReportCreatePayload) {
    return apiClient.post<ApiEnvelope<BugReport>>(endpoints.bugReports.root, {
      ...JSON_BODY,
      body: JSON.stringify(payload),
    });
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
