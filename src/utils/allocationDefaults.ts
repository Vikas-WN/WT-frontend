import {
  ALLOCATION_STATUS_OPTIONS,
  ALLOCATION_TYPE_OPTIONS,
  type AllocationBillingStatus,
} from "@/constants/allocationOptions";

/** When status is Talent Pool, allocation type defaults to Deployable (notebook workflow). */
export function allocationTypeForBillingStatus(
  status: AllocationBillingStatus | "",
  currentType: string
): string {
  if (status === "TALENT_POOL") return "DEPLOYABLE";
  return currentType;
}

export function toLabeledSelectOptions(
  options: readonly { value: string; label: string }[]
): Array<{ value: string; label: string }> {
  return options.map((option) => ({ value: option.value, label: option.label }));
}

export const ALLOCATION_TYPE_SELECT_OPTIONS = toLabeledSelectOptions(ALLOCATION_TYPE_OPTIONS);
export const ALLOCATION_STATUS_SELECT_OPTIONS = toLabeledSelectOptions(ALLOCATION_STATUS_OPTIONS);
