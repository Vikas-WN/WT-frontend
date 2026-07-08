/** Allocation type codes aligned with backend `allocation_type` values. */
export const ALLOCATION_TYPE_OPTIONS = [
  { value: "DEPLOYABLE", label: "Deployable" },
  { value: "LOCKED", label: "Locked" },
  { value: "STAFFING", label: "Staffing" },
  { value: "NONBILLABLE", label: "NB" },
  { value: "NONDEPLOYABLE", label: "Not Active" },
  { value: "OFFBOARDED", label: "Offboarded" },
] as const;

/** Billing / workforce status codes (`billing_status` on allocations). */
export const ALLOCATION_STATUS_OPTIONS = [
  { value: "BILLED", label: "Billed" },
  { value: "BUFFER", label: "Buffer" },
  { value: "TALENT_POOL", label: "Talent Pool" },
  { value: "INVESTMENT", label: "Investment" },
] as const;

export const ALLOCATION_TYPE_VALUES = ALLOCATION_TYPE_OPTIONS.map((o) => o.value);
export const ALLOCATION_STATUS_VALUES = ALLOCATION_STATUS_OPTIONS.map((o) => o.value);

export type AllocationBillingStatus = (typeof ALLOCATION_STATUS_OPTIONS)[number]["value"];
