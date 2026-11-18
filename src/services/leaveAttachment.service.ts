import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type { LeaveAttachmentRequirement } from "@/utils/leaveAttachmentRules";

export type UploadedLeaveAttachment = { reference_file_url: string; file_name: string; content_type: string };

const UPLOAD_TIMEOUT_MS = 60_000;

export const leaveAttachmentService = {
  /** Whether the signed-in employee is on-site, and which request types then need the client's approval email. */
  async requirement(): Promise<LeaveAttachmentRequirement> {
    const body = await apiClient.get<ApiEnvelope<LeaveAttachmentRequirement>>(endpoints.userRequest.attachmentRequirement);
    return body.data ?? { onsite: false, required_for: [] };
  },

  /** Uploads the client-approval email; send the returned reference as `reference_file_url` on the request. */
  async upload(file: File): Promise<UploadedLeaveAttachment> {
    const body = new FormData();
    body.append("file", file);
    const res = await apiClient.post<ApiEnvelope<UploadedLeaveAttachment>>(endpoints.userRequest.attachment, {
      body,
      timeoutMs: UPLOAD_TIMEOUT_MS,
    });
    return res.data;
  },
};
