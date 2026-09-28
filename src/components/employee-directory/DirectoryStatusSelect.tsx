"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import { DatePickerField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { EmployeeStatusBadge } from "@/components/employee-directory/EmployeeStatusBadge";
import { exitDateError } from "@/components/employee-directory/EmployeeProfilePageClient";
import { hrmsService } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import {
  formatEmployeeStatusLabel,
  normalizeEmployeeStatusKey,
  isExitUserStatus,
} from "@/utils/userStatus";
import { normalizeDirectoryUserType } from "@/utils/userTypeTransition";
import {
  CONSULTANT_EXIT_TYPE,
  defaultLastWorkingDayFromResignation,
  previousWeekdayOrSame,
} from "@/utils/offboardingFormState";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INVITED", label: "Invited" },
  { value: "SERVING_NOTICE", label: "Serving Notice" },
  { value: "INACTIVE", label: "Inactive" },
];

type ExitTarget = "SERVING_NOTICE" | "INACTIVE";

type ExitDialogState = {
  targetStatus: ExitTarget;
  resignationDate: string;
  lastWorkingDay: string;
};

/**
 * Inline status editor for the directory table. Uses the same DropdownSelect the
 * Role / User Type columns use so the popup renders identically (the earlier
 * hand-rolled base-ui Select popup rendered transparent and mispositioned).
 *
 * Moving onto Serving Notice / Inactive requires Resignation Date (Serving Notice,
 * full-time only) and Last Working Day on file — the API rejects the transition
 * otherwise. This used to just fire the bare status PATCH and surface the
 * resulting 400 as a generic error toast telling HR to go finish it from the
 * full profile; now it collects the dates in a dialog right here, the same way
 * the full profile editor's offboarding section does, and submits through the
 * same offboardEmployee endpoint that actually captures them.
 */
export function DirectoryStatusSelect({
  empId,
  status,
  userType,
  canEdit,
}: {
  empId: string;
  status: string;
  userType?: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [optimistic, setOptimistic] = useState<string | null>(null);
  const current = optimistic ?? normalizeEmployeeStatusKey(status) ?? "ACTIVE";

  const [exitDialog, setExitDialog] = useState<ExitDialogState | null>(null);
  const [dialogSaving, setDialogSaving] = useState(false);

  const normalizedUserType = normalizeDirectoryUserType(userType);
  const isConsultantOrIntern =
    normalizedUserType === "CONSULTANT" || normalizedUserType === "INTERN";

  useEffect(() => {
    if (!exitDialog) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !dialogSaving) setExitDialog(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogSaving, exitDialog]);

  async function invalidateAfterStatusChange() {
    await queryClient.invalidateQueries({ queryKey: ["employee-directory", "onboard"] });
    await queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
    await queryClient.invalidateQueries({ queryKey: ["offboarding"] });
  }

  async function applyStatusChange(nextKey: string) {
    setSaving(true);
    try {
      await hrmsService.updateEmployeeProfile(empId, { user_status: nextKey });
      setOptimistic(nextKey);
      await invalidateAfterStatusChange();
      showSuccessToast(`Status changed to ${formatEmployeeStatusLabel(nextKey)}.`);
    } catch (err) {
      setOptimistic(null);
      showErrorToast(toUserFriendlyApiErrorMessage(err, "Could not change the status."));
    } finally {
      setSaving(false);
    }
  }

  async function handleChange(next: string) {
    const nextKey = normalizeEmployeeStatusKey(next);
    if (!nextKey || nextKey === current) return;

    // Moving onto an exit status for the first time needs Resignation Date /
    // Last Working Day captured — collect them here instead of firing the bare
    // PATCH and letting the API's 400 surface as an unhelpful error toast.
    if (isExitUserStatus(nextKey) && !isExitUserStatus(current)) {
      setExitDialog({ targetStatus: nextKey as ExitTarget, resignationDate: "", lastWorkingDay: "" });
      return;
    }

    await applyStatusChange(nextKey);
  }

  async function confirmExitDialog() {
    if (!exitDialog) return;
    const { targetStatus, resignationDate, lastWorkingDay } = exitDialog;
    const targetLabel = targetStatus === "SERVING_NOTICE" ? "Serving Notice Period" : "Inactive";
    const dateError = exitDateError(resignationDate, lastWorkingDay, normalizedUserType, targetLabel);
    if (dateError) {
      showErrorToast(dateError);
      return;
    }

    setDialogSaving(true);
    try {
      const offboardPayload = isConsultantOrIntern
        ? {
            last_working_day: lastWorkingDay.trim(),
            exit_type: normalizedUserType === "CONSULTANT" ? CONSULTANT_EXIT_TYPE : ("VOLUNTARY" as const),
          }
        : {
            resignation_date: resignationDate.trim(),
            last_working_day: lastWorkingDay.trim(),
            exit_type: "VOLUNTARY" as const,
          };
      await hrmsService.offboardEmployee(empId, offboardPayload);
      setOptimistic(targetStatus);
      await invalidateAfterStatusChange();
      showSuccessToast(`Status changed to ${formatEmployeeStatusLabel(targetStatus)}.`);
      setExitDialog(null);
    } catch (err) {
      showErrorToast(toUserFriendlyApiErrorMessage(err, "Could not change the status."));
    } finally {
      setDialogSaving(false);
    }
  }

  if (!canEdit || !empId || empId === "—") {
    return <EmployeeStatusBadge status={status} />;
  }

  return (
    <>
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

      {exitDialog ? (
        <div
          className="fixed inset-0 z-[195] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={dialogSaving ? undefined : () => setExitDialog(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-dates-dialog-title"
            className="w-full max-w-md rounded-2xl border border-wt-border bg-wt-surface-1 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="exit-dates-dialog-title" className="text-lg font-semibold text-wt-text">
              {exitDialog.targetStatus === "SERVING_NOTICE" ? "Move to Serving Notice" : "Move to Inactive"}
            </h2>
            <p className="mt-2 text-sm text-wt-text-muted">
              {isConsultantOrIntern
                ? "Last Working Day is required to complete this transition."
                : "Resignation Date and Last Working Day are required to complete this transition."}
            </p>
            <div className="mt-5 flex flex-col gap-4">
              {!isConsultantOrIntern ? (
                <DatePickerField
                  label="Resignation Date"
                  required
                  value={exitDialog.resignationDate}
                  onChange={(v) =>
                    setExitDialog((prev) =>
                      prev
                        ? {
                            ...prev,
                            resignationDate: v,
                            lastWorkingDay: v.trim() ? defaultLastWorkingDayFromResignation(v) : "",
                          }
                        : prev
                    )
                  }
                  disabled={dialogSaving}
                />
              ) : null}
              <DatePickerField
                label="Last Working Day"
                required
                value={exitDialog.lastWorkingDay}
                onChange={(v) =>
                  setExitDialog((prev) =>
                    prev ? { ...prev, lastWorkingDay: previousWeekdayOrSame(v) } : prev
                  )
                }
                disabled={dialogSaving}
              />
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setExitDialog(null)}
                disabled={dialogSaving}
              >
                Cancel
              </Button>
              <Button type="button" onClick={() => void confirmExitDialog()} disabled={dialogSaving}>
                {dialogSaving ? "Saving…" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
