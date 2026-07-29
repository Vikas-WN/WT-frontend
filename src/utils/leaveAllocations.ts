import { isStaffingProjectTypeCode } from "@/utils/projectTypes";
import { pickRowField } from "@/utils/compOff";
import {
  isSystemProjectAllocationRow,
  isTalentPoolBillingAllocationRow,
} from "@/utils/allocationList";

/** Client approval required when on active staffing/client allocation. */
export function activeAllocationsRequireClientApproval(
  rows: Array<Record<string, unknown>>
): boolean {
  return rows.some((row) => {
    const active = row.is_active !== false && row.isActive !== false;
    if (!active) return false;
    const allocationType = String(
      pickRowField(row, "allocation_type", "allocationType") ?? ""
    ).toUpperCase();
    if (allocationType === "STAFFING") return true;
    const projectType = String(
      pickRowField(row, "project_type", "projectType") ?? ""
    ).toUpperCase();
    return isStaffingProjectTypeCode(projectType);
  });
}

/**
 * Bench / talent-pool billing / no client project → leave & WFH route directly to HR.
 * Mirrors backend `user_has_active_client_capacity_allocation` (inverted).
 */
export function isTalentPoolLeaveRouting(
  rows: Array<Record<string, unknown>>
): boolean {
  return !rows.some((row) => {
    const code = String(
      pickRowField(row, "project_code", "projectCode", "code") ?? ""
    )
      .trim()
      .toUpperCase();
    if (!code || code === "—" || code === "-") return false;
    if (isSystemProjectAllocationRow(row)) return false;
    if (isTalentPoolBillingAllocationRow(row)) return false;
    const active = row.is_active !== false && row.isActive !== false;
    return active;
  });
}
