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

  const currentType = normalizeDirectoryUserType(userType);
  const currentBandLabel = String(bandName ?? "").trim();
  const needsFulltimeBand = isInternOnlyBand(currentBandLabel);

  const selectOptions = useMemo(
    () =>
      options.map((option) => ({
        value: option.value,
        label: option.label || formatUserTypeLabel(option.value),
      })),
    [options]
  );
  const displayLabel = formatUserTypeLabel(currentType);

  const fulltimeBandOptions = useMemo(() => {
    const nonIntern = bandRows.filter(
      (row) => !isInternOnlyBand(bandDisplayLabel(row))
    );
    return bandSelectOptions(nonIntern);
  }, [bandRows]);

  useEffect(() => {
    if (!dialogOpen || !needsFulltimeBand) return;
    let cancelled = false;
    setBandsLoading(true);
    void (async () => {
      try {
        const res = await hrmsService.getBands({ userType: "FULLTIME" });
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
  }, [dialogOpen, needsFulltimeBand]);

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
      showSuccessToast("User type updated successfully.");
      setDialogOpen(false);
      setPendingType(null);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not update user type.";
      showErrorToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (nextType: string) => {
    const normalizedNext = normalizeDirectoryUserType(nextType);
    if (!normalizedNext || normalizedNext === currentType) return;

    if (currentType === "FULLTIME" && normalizedNext === "INTERN") {
      showErrorToast("Changing a Full-Time employee to an Intern is not allowed.");
      return;
    }

    if (requiresUserTypeTransitionDialog(currentType, normalizedNext)) {
      setPendingType(normalizedNext);
      setDialogOpen(true);
      return;
    }

    void persistUserType(normalizedNext);
  };

  const handleConfirm = (payload: UserTypeTransitionConfirmPayload) => {
    if (!pendingType) return;
    if (needsFulltimeBand && pendingType === "FULLTIME" && payload.bandId == null) {
      showErrorToast("Select a valid full-time band before converting to Full-time.");
      return;
    }
    void persistUserType(pendingType, payload.transitionDate, payload.bandId);
  };

  if (!canEdit) {
    return <span className="block truncate text-wt-text">{displayLabel}</span>;
  }

  return (
    <>
      <div
        className="w-full max-w-full min-w-0"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownSelect
          key={`${empId}-${currentType}`}
          value={currentType}
          onChange={handleChange}
          options={selectOptions}
          disabled={saving}
          aria-label="User Type"
          variant="table-inline"
          className="w-full min-w-0"
          contentClassName="min-w-[14rem] w-max"
          // Keep chevron dropdown look — no clear "x" pill (User Type is required).
          clearSelectionOnEmptyInput={false}
        />
      </div>

      <UserTypeTransitionDialog
        open={dialogOpen}
        fromType={currentType}
        toType={pendingType ?? ""}
        saving={saving}
        requireBand={Boolean(pendingType === "FULLTIME" && needsFulltimeBand)}
        bandOptions={fulltimeBandOptions}
        bandsLoading={bandsLoading}
        onClose={() => {
          if (saving) return;
          setDialogOpen(false);
          setPendingType(null);
        }}
        onConfirm={handleConfirm}
      />
    </>
  );
}
