export const LEAVE_OUTLOOK_COPY = {
  capsNote: "Primary stops at 11 and secondary at 7, so a month can credit less than that once one is full.",
  newYearNote: "On 1 January primary and secondary start again from zero: up to 4 of your unused days carry forward into secondary.",
  newYearTag: "new year",
  newYearTagHint: "Primary and secondary reset today; up to 4 unused days carry forward into secondary.",
  balanceNote: "This is your balance today. You earn up to 1.5 leaves on the 1st of every month, and leave approved for a later month comes off that month — see “Your leave, month by month” below.",
} as const;

/** January is the month the balance resets. */
export const NEW_YEAR_MONTH = 1;
