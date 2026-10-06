import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type { QuickActionDecision, QuickActionPreview } from "@/types/quickAction";

const JSON_BODY = { contentType: "application/json" } as const;

export const quickActionService = {
  /** What the email link is about. Never changes anything. */
  preview(token: string) {
    return apiClient.get<ApiEnvelope<QuickActionPreview>>(endpoints.quickActions.byToken(token));
  },

  decide(token: string, action: QuickActionDecision, message?: string) {
    return apiClient.post<ApiEnvelope<{ status: QuickActionDecision }>>(endpoints.quickActions.decision(token), {
      ...JSON_BODY,
      body: JSON.stringify({ action, message: message?.trim() || null }),
    });
  },
};
