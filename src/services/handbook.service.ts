import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";

export type HandbookInfo =
  | { available: false }
  | { available: true; file_name: string; size_bytes: number; uploaded_at: string; uploaded_by: string | null };

const UPLOAD_TIMEOUT_MS = 120_000;

export const handbookService = {
  async current(): Promise<HandbookInfo> {
    const body = await apiClient.get<ApiEnvelope<HandbookInfo>>(endpoints.handbook.root);
    return body.data ?? { available: false };
  },

  /** Admin only: replaces the current handbook with this PDF (earlier versions are kept on the server). */
  async upload(file: File): Promise<HandbookInfo> {
    const body = new FormData();
    body.append("file", file);
    const res = await apiClient.post<ApiEnvelope<HandbookInfo>>(endpoints.handbook.root, { body, timeoutMs: UPLOAD_TIMEOUT_MS });
    return res.data;
  },
};
