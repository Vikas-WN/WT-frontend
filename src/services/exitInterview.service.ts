import { endpoints } from "@/api/endpoints";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import type {
  ExitInterviewFormDefinition,
  ExitInterviewMinutesOfMeetingUpdate,
  ExitInterviewResendResult,
  ExitSurveyBulkResendData,
  ExitInterviewSubmissionDetail,
  ExitInterviewSubmissionsListData,
  ExitInterviewSubmissionsQuery,
  ExitInterviewSubmitBody,
  ExitInterviewSubmitResult,
  ExitSurveyMagicLinkContext,
} from "@/types/exit-interview";
import type { ExitSurveyFollowUpListData, OffboardListQuery } from "@/types/offboard";

function submissionsQuery(params: ExitInterviewSubmissionsQuery): Record<string, string> {
  const query: Record<string, string> = {
    page: String(params.page ?? 0),
    size: String(params.size ?? 10),
    status: params.status ?? "ALL",
  };
  const search = params.search?.trim();
  if (search) query.search = search;
  return query;
}

export const exitInterviewService = {
  getFormDefinition() {
    return apiClient.get<ApiEnvelope<ExitInterviewFormDefinition>>(
      endpoints.exitInterview.formDefinition
    );
  },

  /** Public magic-link context for the emailed exit survey link (no session required). */
  getMagicLinkContext(token: string) {
    return apiClient.get<ApiEnvelope<ExitSurveyMagicLinkContext>>(
      endpoints.exitInterview.magicLinkContext(token)
    );
  },

  /** Public magic-link submission for the emailed exit survey link (no session required). */
  submitViaMagicLink(token: string, body: ExitInterviewSubmitBody) {
    return apiClient.post<ApiEnvelope<ExitInterviewSubmitResult>>(
      endpoints.exitInterview.magicLinkContext(token),
      {
        contentType: "application/json",
        body: JSON.stringify(body),
      }
    );
  },

  submit(body: ExitInterviewSubmitBody) {
    return apiClient.post<ApiEnvelope<ExitInterviewSubmitResult>>(endpoints.exitInterview.submit, {
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  },

  listSubmissions(params: ExitInterviewSubmissionsQuery = {}) {
    return apiClient.get<ApiEnvelope<ExitInterviewSubmissionsListData>>(
      endpoints.exitInterview.submissions,
      { query: submissionsQuery(params) }
    );
  },

  getSubmission(lookupId: string) {
    return apiClient.get<ApiEnvelope<ExitInterviewSubmissionDetail>>(
      endpoints.exitInterview.submissionByLookupId(lookupId)
    );
  },

  updateMinutesOfMeeting(lookupId: string, body: ExitInterviewMinutesOfMeetingUpdate) {
    return apiClient.put<ApiEnvelope<ExitInterviewSubmissionDetail>>(
      endpoints.exitInterview.minutesOfMeetingByLookupId(lookupId),
      {
        contentType: "application/json",
        body: JSON.stringify(body),
      }
    );
  },

  /** POST /exit-interview/resend/{empId} — HR/Admin exit survey reminder (individual). */
  resendSurvey(empId: string) {
    return apiClient.post<ApiEnvelope<ExitInterviewResendResult>>(
      endpoints.exitInterview.resend(empId)
    );
  },

  /** POST /exit-interview/resubmit/{empId} — HR reopens a submitted survey for one-time resubmit. */
  requestResubmission(empId: string) {
    return apiClient.post<ApiEnvelope<ExitInterviewResendResult>>(
      endpoints.exitInterview.resubmit(empId)
    );
  },

  /** DELETE /exit-interview/submissions/{lookupId} — HR removes a submitted survey. */
  deleteSubmission(lookupId: string) {
    return apiClient.delete<ApiEnvelope<unknown>>(
      endpoints.exitInterview.deleteSubmission(lookupId)
    );
  },

  /** POST /exit-interview/resend — bulk exit survey reminders. */
  resendSurveyBulk(empIds: string[]) {
    return apiClient.post<ApiEnvelope<ExitSurveyBulkResendData>>(
      endpoints.exitInterview.resendBulk,
      {
        contentType: "application/json",
        body: JSON.stringify({ emp_ids: empIds }),
      }
    );
  },

  /** GET /exit-interview/follow-up — HR exit survey follow-up list. */
  getFollowUpList(params: OffboardListQuery = {}) {
    const query: Record<string, string> = {
      page: String(params.page ?? 0),
      size: String(params.size ?? 10),
    };
    const search = params.search?.trim();
    if (search) query.search = search;
    const type = params.type?.trim();
    if (type) query.type = type;
    const fromDate = params.fromDate?.trim();
    if (fromDate) query.fromDate = fromDate;
    const toDate = params.toDate?.trim();
    if (toDate) query.toDate = toDate;
    return apiClient.get<ApiEnvelope<ExitSurveyFollowUpListData>>(endpoints.exitInterview.followUp, {
      query,
    });
  },
};
