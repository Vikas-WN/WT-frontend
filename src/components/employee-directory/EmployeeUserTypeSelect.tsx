"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import {
  UserTypeTransitionDialog,
  type UserTypeTransitionConfirmPayload,
} from "@/components/employee-directory/UserTypeTransitionDialog";
import { hrmsService } from "@/services/hrms.service";
import { ApiError } from "@/api/error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatUserTypeLabel } from "@/utils/offboardingFormState";
import type { OnboardOptionItem } from "@/types/onboard-options";
import { requiresUserTypeTransitionDialog, normalizeDirectoryUserType } from "@/utils/userTypeTransition";
import {
  bandDisplayLabel,
  bandSelectOptions,
  isInternOnlyBand,
} from "@/utils/dashboard/validation";
import { toRows } from "@/utils/apiRows";

type Props = {
  empId: string;
  userType: unknown;
  bandId?: unknown;
  bandName?: unknown;
  canEdit: boolean;
  options: OnboardOptionItem[];
};

export function EmployeeUserTypeSelect({
  empId,
  userType,
  bandName,
  canEdit,
  options,
}: Props) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bandRows, setBandRows] = useState<Array<Record<string, unknown>>>([]);
  const [bandsLoading, setBandsLoading] = useState(false);
  /** Local draft so the field can be cleared before picking a new type. */
  const [draftType, setDraftType] = useState<string | null>(null);

  const currentType = normalizeDirectoryUserType(userType);
  const currentBandLabel = String(bandName ?? "").trim();
  const currentBandIsInternOnly = isInternOnlyBand(currentBandLabel);
  const needsFulltimeBand = currentBandIsInternOnly;
  const needsInternBand = !currentBandIsInternOnly;
  const displayValue = draftType !== null ? draftType : currentType;

  const selectOptions = useMemo(
    () =>
      options.map((option) => ({
        value: option.value,
        label: option.label || formatUserTypeLabel(option.value),
      })),
    [options]
  );
  const displayLabel = formatUserTypeLabel(currentType);

  const requireBandForPending =
    (pendingType === "FULLTIME" && needsFulltimeBand) ||
    (pendingType === "INTERN" && needsInternBand);

  const dialogBandOptions = useMemo(() => {
    if (pendingType === "INTERN") {
      return bandSelectOptions(
        bandRows.filter((row) => isInternOnlyBand(bandDisplayLabel(row)))
      );
    }
    return bandSelectOptions(
      bandRows.filter((row) => !isInternOnlyBand(bandDisplayLabel(row)))
    );
  }, [bandRows, pendingType]);

  useEffect(() => {
    setDraftType(null);
  }, [empId, currentType]);

  useEffect(() => {
    if (!dialogOpen || !requireBandForPending || !pendingType) return;
    let cancelled = false;
    setBandsLoading(true);
    void (async () => {
      try {
        const res = await hrmsService.getBands({
          userType: pendingType === "INTERN" ? "INTERN" : "FULLTIME",
        });
        if (cancelled) return;
        setBandRows(toRows((res as { data?: unknown }).data ?? res));
      } catch {
        if (!cancelled) setBandRows([]);
      } finally {
        if (!cancelled) setBandsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dialogOpen, requireBandForPending, pendingType]);

  const persistUserType = async (
    nextType: string,
    transitionDate?: string,
    nextBandId?: number
  ) => {
    const normalizedNext = normalizeDirectoryUserType(nextType);
    if (!empId.trim() || !normalizedNext || normalizedNext === currentType) return;

    setSaving(true);
    try {
      await hrmsService.updateEmployeeUserType(empId, {
        user_type: normalizedNext,
        transition_date: transitionDate,
        ...(nextBandId != null && Number.isFinite(nextBandId)
          ? { band_id: nextBandId }
          : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ["employee-directory", "onboard"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
      // Offboarding candidates cache user_type independently — must refresh or
      // Full-Time fields stay visible after FULLTIME → CONSULTANT transitions.
      await queryClient.invalidateQueries({ queryKey: ["offboarding"] });
      showSuccessToast(
        normalizedNext === "CONSULTANT"
          ? "User type updated. Designation was cleared — set a consultant designation on the profile."
          : "User type updated successfully."
      );
      setDialogOpen(false);
      setPendingType(null);
      setDraftType(null);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not update user type.";
      showErrorToast(msg);
      setDraftType(null);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (nextType: string) => {
    const normalizedNext = normalizeDirectoryUserType(nextType);

    // Allow clearing the field so a different type can be chosen next.
    if (!normalizedNext) {
      setDraftType("");
      return;
    }

    if (normalizedNext === currentType) {
      setDraftType(null);
      return;
    }

    setDraftType(normalizedNext);

    if (
      requiresUserTypeTransitionDialog(currentType, normalizedNext, {
        currentBandIsInternOnly,
      })
    ) {
      setPendingType(normalizedNext);
      setDialogOpen(true);
      return;
    }

    void persistUserType(normalizedNext);
  };

  const handleConfirm = (payload: UserTypeTransitionConfirmPayload) => {
    if (!pendingType) return;
    if (pendingType === "FULLTIME" && needsFulltimeBand && payload.bandId == null) {
      showErrorToast("Select a valid full-time band before converting to Full-time.");
      return;
    }
    if (pendingType === "INTERN" && needsInternBand && payload.bandId == null) {
      showErrorToast("Select band B8 (Intern) before converting to Intern.");
      return;
    }
    void persistUserType(pendingType, payload.transitionDate, payload.bandId);
  };

  if (!canEdit) {
    return <span className="block truncate text-wt-text">{displayLabel}</span>;
  }

  const bandFieldLabel =
    pendingType === "INTERN" ? "Intern Band" : pendingType === "FULLTIME" ? "Full-time Band" : "Band";
  const bandHelperText =
    pendingType === "CONSULTANT"
      ? "Consultants have no band. The current Intern/Full-time designation will be cleared — set a consultant-valid designation on the employee profile after confirming."
      : pendingType === "INTERN"
        ? "Interns must use band B8 (or B8 - Intern). Select it here to complete the conversion."
        : pendingType === "FULLTIME" && needsFulltimeBand
          ? "This employee is on an intern band (B8). Select a valid full-time band to continue."
          : undefined;
  const dateHelperText =
    pendingType === "FULLTIME"
      ? "Set the transition date for this employee's full-time start."
      : pendingType === "CONSULTANT"
        ? "Confirm the transition date. The previous designation will not be retained."
        : "Set the transition date for this user-type change.";

  return (
    <>
      <div
        className="w-full max-w-full min-w-0"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownSelect
          key={empId}
          value={displayValue}
          onChange={handleChange}
          options={selectOptions}
          disabled={saving}
          aria-label="User Type"
          variant="table-inline"
          className="w-full min-w-0"
          contentClassName="min-w-[14rem] w-max"
          placeholder="Select user type"
          clearSelectionOnEmptyInput
        />
      </div>

      <UserTypeTransitionDialog
        open={dialogOpen}
        fromType={currentType}
        toType={pendingType ?? ""}
        saving={saving}
        requireBand={requireBandForPending}
        bandOptions={dialogBandOptions}
        bandsLoading={bandsLoading}
        bandFieldLabel={bandFieldLabel}
        bandHelperText={bandHelperText}
        dateHelperText={dateHelperText}
        onClose={() => {
          if (saving) return;
          setDialogOpen(false);
          setPendingType(null);
          setDraftType(null);
        }}
        onConfirm={handleConfirm}
      />
    </>
  );
}
