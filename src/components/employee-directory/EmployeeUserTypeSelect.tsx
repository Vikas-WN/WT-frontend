"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import { UserTypeTransitionDialog } from "@/components/employee-directory/UserTypeTransitionDialog";
import { hrmsService } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatUserTypeLabel } from "@/utils/offboardingFormState";
import type { OnboardOptionItem } from "@/types/onboard-options";
import { requiresUserTypeTransitionDialog, normalizeDirectoryUserType } from "@/utils/userTypeTransition";

type Props = {
  empId: string;
  userType: unknown;
  canEdit: boolean;
  options: OnboardOptionItem[];
};

export function EmployeeUserTypeSelect({ empId, userType, canEdit, options }: Props) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentType = normalizeDirectoryUserType(userType);
  const selectOptions = useMemo(
    () =>
      options.map((option) => ({
        value: option.value,
        label: option.label || formatUserTypeLabel(option.value),
      })),
    [options]
  );
  const displayLabel = formatUserTypeLabel(currentType);

  const persistUserType = async (nextType: string, transitionDate?: string) => {
    const normalizedNext = normalizeDirectoryUserType(nextType);
    if (!empId.trim() || !normalizedNext || normalizedNext === currentType) return;

    setSaving(true);
    try {
      await hrmsService.updateEmployeeUserType(empId, {
        user_type: normalizedNext,
        transition_date: transitionDate,
      });
      await queryClient.invalidateQueries({ queryKey: ["employee-directory", "onboard"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
      showSuccessToast("User type updated successfully.");
      setDialogOpen(false);
      setPendingType(null);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Could not update user type.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (nextType: string) => {
    const normalizedNext = normalizeDirectoryUserType(nextType);
    if (!normalizedNext || normalizedNext === currentType) return;

    if (requiresUserTypeTransitionDialog(currentType, normalizedNext)) {
      setPendingType(normalizedNext);
      setDialogOpen(true);
      return;
    }

    void persistUserType(normalizedNext);
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
        />
      </div>

      <UserTypeTransitionDialog
        open={dialogOpen}
        fromType={currentType}
        toType={pendingType ?? ""}
        saving={saving}
        onClose={() => {
          if (saving) return;
          setDialogOpen(false);
          setPendingType(null);
        }}
        onConfirm={(transitionDate) => {
          if (!pendingType) return;
          void persistUserType(pendingType, transitionDate);
        }}
      />
    </>
  );
}
