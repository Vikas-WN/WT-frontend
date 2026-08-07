import { apiClient } from "@/api/httpClient";
import { endpoints } from "@/api/endpoints";
import type {
  AppKeyCreatedResponse,
  AppKeyListResponse,
  AppKeyResponse,
  CreateAppKeyRequest,
  UpdateAppKeyRequest,
  UpdateAppKeyRolesRequest,
} from "@/types/apiKey";

export const appsService = {
  list: (params: { q?: string; page?: number; per_page?: number } = {}) =>
    apiClient.get<AppKeyListResponse>(endpoints.apps.base, { query: params }),

  get: (id: number) => apiClient.get<AppKeyResponse>(endpoints.apps.byId(id)),

  create: (body: CreateAppKeyRequest) =>
    apiClient.post<AppKeyCreatedResponse>(endpoints.apps.base, {
      body: JSON.stringify(body),
      contentType: "application/json",
    }),

  update: (id: number, body: UpdateAppKeyRequest) =>
    apiClient.patch<AppKeyResponse>(endpoints.apps.byId(id), {
      body: JSON.stringify(body),
      contentType: "application/json",
    }),

  updateRoles: (id: number, body: UpdateAppKeyRolesRequest) =>
    apiClient.put<AppKeyResponse>(endpoints.apps.roles(id), {
      body: JSON.stringify(body),
      contentType: "application/json",
    }),

  revoke: (id: number) =>
    apiClient.delete<{ message: string; data: { id: number } }>(endpoints.apps.byId(id)),

  rotate: (id: number) =>
    apiClient.post<AppKeyCreatedResponse>(endpoints.apps.rotate(id)),
};
