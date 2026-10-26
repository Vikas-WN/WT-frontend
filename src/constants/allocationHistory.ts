/** Current vs. history in the HR allocation lists. */
export const ALLOCATION_VIEW_OPTIONS = [
  { value: "current", label: "Current" },
  { value: "history", label: "History" },
] as const;

export const ALLOCATION_HISTORY_COPY = {
  viewLabel: "Show current allocations or history",
  historyHint: "Ended, deallocated, and people who have left · ",
} as const;
