import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import { endpoints } from "@/api/endpoints";

export interface PushConfig {
  enabled: boolean;
  public_key: string;
}

export interface PushSubscriptionBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const pushService = {
  config() {
    return apiClient.get<ApiEnvelope<PushConfig>>(endpoints.push.config);
  },
  subscribe(body: PushSubscriptionBody) {
    return apiClient.post<ApiEnvelope<null>>(endpoints.push.subscriptions, { contentType: "application/json", body: JSON.stringify(body) });
  },
  unsubscribe(endpoint: string) {
    return apiClient.delete<ApiEnvelope<null>>(endpoints.push.subscriptions, { contentType: "application/json", body: JSON.stringify({ endpoint }) });
  },
};
