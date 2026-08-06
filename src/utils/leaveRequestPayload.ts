/** Build POST/PUT /userRequest body with snake_case + camelCase aliases. */

export type LeaveRequestFormPayload = {
  request_from_date: string;
  request_to_date: string;
  request_type: string;
  comments: string;
  is_half_day?: boolean;
  client_approval?: boolean;
  reference_file_url?: string | null;
  primary_manager_emails?: string[];
  secondary_manager_emails?: string[];
  /** @deprecated Use primary_manager_emails */
  selected_manager_emails?: string[];
  /** @deprecated Use secondary_manager_emails */
  additional_recipient_emails?: string[];
};

export function buildUserRequestBody(
  form: LeaveRequestFormPayload,
  options?: {
    userRequestId?: number;
    /** Talent pool / bench: leave & WFH route to HR — secondary managers not collected in UI. */
    routesToHr?: boolean;
  }
): Record<string, unknown> {
  const requestType = String(form.request_type ?? "LEAVE").trim().toUpperCase();
  const fromDate = form.request_from_date.trim();
  const toDate = form.request_to_date.trim();
  const comments = form.comments.trim();
  const isHalfDay = Boolean(form.is_half_day);
  const body: Record<string, unknown> = {
    request_from_date: fromDate,
    request_to_date: toDate,
    requestFromDate: fromDate,
    requestToDate: toDate,
    request_type: requestType,
    requestType,
    comments,
    is_half_day: isHalfDay,
    isHalfDay,
    reference_file_url: form.reference_file_url ?? null,
    referenceFileUrl: form.reference_file_url ?? null,
  };
  if (form.client_approval !== undefined) {
    body.client_approval = form.client_approval;
    body.clientApproval = form.client_approval;
  }
  const managerEmails =
    form.primary_manager_emails?.length
      ? form.primary_manager_emails
      : form.selected_manager_emails?.length
        ? form.selected_manager_emails
        : undefined;
  if (managerEmails?.length) {
    const normalizedManagers = [
      ...new Set(managerEmails.map((email) => email.trim()).filter(Boolean)),
    ];
    body.primary_manager_emails = normalizedManagers;
    body.primaryManagerEmails = normalizedManagers;
  }
  const secondaryManagerEmails =
    form.secondary_manager_emails?.length
      ? form.secondary_manager_emails
      : form.additional_recipient_emails?.length
        ? form.additional_recipient_emails
        : undefined;
  if (secondaryManagerEmails?.length) {
    const primarySet = new Set(
      (managerEmails ?? []).map((email) => email.trim().toLowerCase())
    );
    // Allow primary===secondary when talent-pool routes both to all HRs.
    const allowOverlap = Boolean(options?.routesToHr);
    const normalizedSecondaryManagers = [
      ...new Set(
        secondaryManagerEmails
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email && (allowOverlap || !primarySet.has(email)))
      ),
    ];
    if (!normalizedSecondaryManagers.length) {
      throw new Error("secondaryManagerEmails is required");
    }
    body.secondary_manager_emails = normalizedSecondaryManagers;
    body.secondaryManagerEmails = normalizedSecondaryManagers;
    body.secondary_managers = normalizedSecondaryManagers;
    body.secondaryManagers = normalizedSecondaryManagers;
  } else if (
    (requestType === "LEAVE" || requestType === "OPTIONAL") &&
    !options?.routesToHr
  ) {
    // Manager-routed leave/optional requires secondary managers.
    // Talent-pool (routesToHr) skips secondary managers in the UI.
    throw new Error("secondaryManagerEmails is required");
  }
  if (options?.userRequestId != null) {
    body.user_request_id = options.userRequestId;
    body.userRequestId = options.userRequestId;
  }
  return body;
}
