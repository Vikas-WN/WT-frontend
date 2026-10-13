import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type { WeeklyUtilization, WeeklyUtilizationQuery } from "@/types/utilization";

export const utilizationService = {
  /** GET /reports/utilization/weekly (HR/Admin). */
  weekly(params: WeeklyUtilizationQuery = {}) {
    const query: Record<string, string> = {};
    if (params.start) query.start = params.start;
    if (params.weeks) query.weeks = String(params.weeks);
    if (params.department) query.department = params.department;
    if (params.search?.trim()) query.search = params.search.trim();
    return apiClient.get<ApiEnvelope<WeeklyUtilization>>(endpoints.hrReports.utilizationWeekly, { query });
  },
};
