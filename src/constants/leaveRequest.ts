/** HR CC recipients automatically included on every leave request submission. */
export const LEAVE_HR_CC_EMAILS = [
  "hr@webknot.in",
  "applyleave@webknot.in",
] as const;

/** @deprecated Use LEAVE_HR_CC_EMAILS */
export const LEAVE_SECONDARY_MANAGER_CC_EMAILS = LEAVE_HR_CC_EMAILS;

/** Shown under the status when a secondary manager — not the primary — made the decision. */
export const LEAVE_DECIDED_BY_SECONDARY_LABEL = "by Secondary";

/** Appended to a date range where a list has no Days column to show 0.5 in. */
export const HALF_DAY_SUFFIX = " · 0.5 day";

export const DAYS_COLUMN_LABEL = "Days";
