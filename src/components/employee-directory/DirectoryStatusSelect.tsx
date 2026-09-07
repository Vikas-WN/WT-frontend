"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import { EmployeeStatusBadge } from "@/components/employee-directory/EmployeeStatusBadge";
import { hrmsService } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import {
  formatEmployeeStatusLabel,
  normalizeEmployeeStatusKey,
} from "@/utils/userStatus";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INVITED", label: "Invited" },
  { value: "SERVING_NOTICE", label: "Serving Notice" },
  { value: "INACTIVE", label: "Inactive" },
];

/**
 * Inline status editor for the directory table. Uses the same DropdownSelect the
 * Role / User Type columns use so the popup renders identically (the earlier
 * hand-rolled base-ui Select popup rendered transparent and mispositioned).
 * Exit statuses (Serving Notice / Inactive) may still be rejected by the API when
 * resignation / last-working-day dates are missing; that surfaces as an error
 * toast and HR completes it from the full profile.
 */
export function DirectoryStatusSelect({
  empId,
  status,
  canEdit,
}: {
  empId: string;
  status: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [optimistic, setOptimistic] = useState<string | null>(null);
  const current = optimistic ?? normalizeEmployeeStatusKey(status) ?? "ACTIVE";

  async function handleChange(next: string) {
    const nextKey = normalizeEmployeeStatusKey(next);
    if (!nextKey || nextKey === current) return;
    setSaving(true);
    try {
      await hrmsService.updateEmployeeProfile(empId, { user_status: nextKey });
      setOptimistic(nextKey);
      await queryClient.invalidateQueries({ queryKey: ["employee-directory", "onboard"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["offboarding"] });
      showSuccessToast(`Status changed to ${formatEmployeeStatusLabel(nextKey)}.`);
    } catch (err) {
      setOptimistic(null);
      showErrorToast(
        toUserFriendlyApiErrorMessage(
          err,
          "Could not change the status. Serving Notice / Inactive need resignation and last working day set from the full profile."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit || !empId || empId === "—") {
    return <EmployeeStatusBadge status={status} />;
  }

  return (
    <div
      className="w-full max-w-full min-w-0"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownSelect
        key={`${empId}-${current}`}
        value={current}
        onChange={(next) => void handleChange(String(next))}
        options={STATUS_OPTIONS}
        disabled={saving}
        aria-label="Employee status"
        variant="table-inline"
        className="w-full min-w-0"
        align="end"
        contentClassName="min-w-[min(12rem,calc(100vw-1rem))] w-max max-w-[min(var(--available-width,100vw),calc(100vw-1rem))]"
        clearSelectionOnEmptyInput={false}
      />
    </div>
  );
}
