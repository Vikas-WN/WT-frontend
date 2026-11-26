import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type { NextBandKpisData } from "@/types/nextBandKpis";

export const nextBandKpisService = {
  /** Signed-in employee's own next-band KPIs. */
  async getMine(): Promise<NextBandKpisData> {
    const body = await apiClient.get<ApiEnvelope<NextBandKpisData>>(endpoints.profile.nextBandKpis);
    return body.data;
  },
};
