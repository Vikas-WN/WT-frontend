"use client";

import { useEffect, useState } from "react";
import { InputField } from "@/components/dashboard/ui/forms";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { hrmsService, type LeaveBalancesListItem } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { UI_COPY } from "@/constants/uiCopy";

const BALANCE_FIELDS = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "carry_forward", label: "Carry Forward" },
] as const;

export function EditLeaveBalanceDialog({
  open,
  employee,
  year,
  month,
  onClose,
  onSaved,
}: {
  open: boolean;
  employee: LeaveBalancesListItem | null;
  year: number;
  month: number;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({ primary: "0", secondary: "0", carry_forward: "0" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !employee) return;
    setValues({
      primary: String(employee.leave?.primary ?? 0),
      secondary: String(employee.leave?.secondary ?? 0),
      carry_forward: String(employee.leave?.carry_forward ?? 0),
    });
  }, [open, employee]);

  function handleFieldChange(key: string, value: string) {
    // A negative balance is allowed — an over-drawn (LOP) balance, or an HR
    // correction, can legitimately be below zero.
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!employee) return;
    const parsed: Record<string, number> = {};
    for (const field of BALANCE_FIELDS) {
      const num = Number(values[field.key]);
      if (!Number.isFinite(num)) {
        showErrorToast(`Enter a valid ${field.label.toLowerCase()} balance.`);
        return;
      }
      parsed[field.key] = num;
    }
    setLoading(true);
    try {
      await hrmsService.updateLeaveBalance(employee.emp_id, { ...parsed, year, month });
      showSuccessToast("Leave balance updated.");
      await onSaved();
      onClose();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Could not update leave balance.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <WtFormDialog
      open={open}
      title={employee ? `Edit Balance — ${employee.employee_name || employee.emp_id}` : "Edit Balance"}
      description="Comp-off is earned/used separately and isn't editable here."
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel={UI_COPY.saveChanges}
      loading={loading}
      maxWidthClass="max-w-lg"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {BALANCE_FIELDS.map((field) => (
          <InputField
            key={field.key}
            label={field.label}
            type="number"
            inputMode="decimal"
            value={values[field.key]}
            onChange={(value) => handleFieldChange(field.key, value)}
          />
        ))}
      </div>
    </WtFormDialog>
  );
}
