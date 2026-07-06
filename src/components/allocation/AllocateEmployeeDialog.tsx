"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InputField, SelectField } from "@/components/dashboard/ui/forms";
import { AllocatedPercentSelect } from "@/components/allocation/AllocatedPercentSelect";
import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";
import { InternalEmployeesMultiSelect } from "@/components/allocation/InternalEmployeesMultiSelect";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { hrmsService } from "@/services/hrms.service";
import { normalizeToApiDate } from "@/utils/apiDate";
import {
  createEmptyAllocationForm,
  type AllocationFormState,
} from "@/utils/allocationFormState";
import type { AllocationPercentRow } from "@/types/allocationPercent";
import { isValidAllocationPercentForDesignation } from "@/utils/allocationPercent";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { UI_COPY } from "@/constants/uiCopy";

type ProjectOption = { code: string; name: string };

export function AllocateEmployeeDialog({
  open,
  onClose,
  onSaved,
  projects,
  allocationRoles,
  allocationPercentOptions,
  isStaffingProject,
  enabled,
  editingAllocationId = "",
  initialForm,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  projects: ProjectOption[];
  allocationRoles: string[];
  allocationPercentOptions: AllocationPercentRow[];
  isStaffingProject: (projectCode: string) => boolean;
  enabled: boolean;
  editingAllocationId?: string;
  initialForm?: AllocationFormState;
}) {
  const [form, setForm] = useState<AllocationFormState>(createEmptyAllocationForm());
  const [assignProjectManagers, setAssignProjectManagers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(createEmptyAllocationForm());
      setAssignProjectManagers([]);
      setLoading(false);
      return;
    }
    if (initialForm) {
      setForm(initialForm);
    }
  }, [open, initialForm]);

  const staffing = isStaffingProject(form.project_code);

  async function handleSubmit() {
    const employeeEmail = form.employee_email.trim();
    const projectCode = form.project_code.trim();
    const role = form.role.trim();
    if (!employeeEmail) {
      showErrorToast("Please select an employee.");
      return;
    }
    if (!projectCode) {
      showErrorToast("Please select a project.");
      return;
    }
    if (!role) {
      showErrorToast("Please select a project role.");
      return;
    }
    if (
      !form.allocated_percent ||
      !isValidAllocationPercentForDesignation(form.allocated_percent, role, allocationPercentOptions)
    ) {
      showErrorToast("Please select a valid allocation %.");
      return;
    }
    if (!form.allocation_type) {
      showErrorToast("Please select allocation type.");
      return;
    }
    if (!form.billing_status) {
      showErrorToast("Please select billing status.");
      return;
    }
    const startDate = normalizeToApiDate(form.start_date);
    if (!startDate) {
      showErrorToast("Start date is required.");
      return;
    }
    const endDate = form.end_date ? normalizeToApiDate(form.end_date) : null;

    setLoading(true);
    try {
      const payload = {
        employeeEmail,
        projectCode,
        role: role || null,
        allocatedPercent: Number(form.allocated_percent),
        startDate,
        endDate,
        allocationType: staffing ? "STAFFING" : form.allocation_type,
        billingStatus: form.billing_status,
      };

      if (editingAllocationId) {
        await hrmsService.updateAllocation(editingAllocationId, payload);
      } else {
        await hrmsService.createAllocation(payload);
        for (const email of assignProjectManagers) {
          try {
            await hrmsService.assignProjectManager({
              userEmail: email.trim().toLowerCase(),
              projectCode,
            });
          } catch {
            /* Requires active allocation on the project */
          }
        }
      }

      showSuccessToast(editingAllocationId ? "Allocation updated." : "Employee allocated successfully.");
      await onSaved();
      onClose();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Could not create allocation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <WtFormDialog
      open={open}
      title={editingAllocationId ? "Edit Allocation" : "Allocate Employee"}
      description={
        editingAllocationId
          ? "Update allocation details for this employee."
          : "Assign an employee to a project and optionally mark project managers."
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel={editingAllocationId ? UI_COPY.saveChanges : "Allocate Employee"}
      loading={loading}
      maxWidthClass="max-w-3xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <InternalEmployeeSelect
          label="Employee"
          required
          value={form.employee_email}
          onChange={(value) => setForm((prev) => ({ ...prev, employee_email: value }))}
        />
        <SelectField
          label="Project"
          required
          value={form.project_code}
          placeholder="Select project"
          options={projects.map((project) => ({
            value: project.code,
            label: project.name,
          }))}
          onChange={(projectCode) =>
            setForm((prev) => ({
              ...prev,
              project_code: projectCode,
              allocation_type: isStaffingProject(projectCode) ? "STAFFING" : prev.allocation_type,
            }))
          }
        />
        <SelectField
          label="Project Role"
          required
          value={form.role}
          placeholder="Select project role"
          options={allocationRoles}
          onChange={(role) => setForm((prev) => ({ ...prev, role }))}
        />
        <AllocatedPercentSelect
          required
          designation={form.role}
          enabled={enabled}
          value={form.allocated_percent}
          onChange={(value) => setForm((prev) => ({ ...prev, allocated_percent: value }))}
        />
        <SelectField
          label="Allocation Type"
          placeholder={staffing ? "Staffing (required for staffing projects)" : "Select allocation type"}
          required
          value={staffing ? "STAFFING" : form.allocation_type}
          options={
            staffing
              ? [{ value: "STAFFING", label: "Staffing" }]
              : ["DEPLOYABLE", "STAFFING", "LOCKED"]
          }
          disabled={staffing}
          onChange={(value) => setForm((prev) => ({ ...prev, allocation_type: value }))}
        />
        <SelectField
          label="Billing Status"
          placeholder="Select billing status"
          required
          value={form.billing_status}
          options={["BILLED", "BUFFER", "INVESTMENT"]}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              billing_status:
                value === "BILLED" || value === "BUFFER" || value === "INVESTMENT" ? value : "",
            }))
          }
        />
        <InputField
          label="Start Date"
          required
          type="date"
          value={form.start_date}
          onChange={(value) => setForm((prev) => ({ ...prev, start_date: value }))}
        />
        <InputField
          label="End Date"
          type="date"
          value={form.end_date}
          onChange={(value) => setForm((prev) => ({ ...prev, end_date: value }))}
        />
        <div className="sm:col-span-2 space-y-3 rounded-xl border border-wt-border bg-wt-surface-2/60 p-4">
          {!editingAllocationId ? (
            <>
              <InternalEmployeesMultiSelect
                label="Assign Project Managers"
                value={assignProjectManagers}
                onChange={setAssignProjectManagers}
                placeholder="Select project managers for this project…"
              />
              <Label className="flex items-start gap-2 text-sm font-normal text-wt-text">
                <Checkbox
                  className="mt-0.5"
                  checked={assignProjectManagers.includes(form.employee_email)}
                  disabled={!form.employee_email.trim()}
                  onCheckedChange={(checked) => {
                    const email = form.employee_email.trim();
                    if (!email) return;
                    setAssignProjectManagers((prev) =>
                      checked
                        ? prev.includes(email)
                          ? prev
                          : [...prev, email]
                        : prev.filter((item) => item !== email)
                    );
                  }}
                />
                <span>Also assign the selected employee as a project manager</span>
              </Label>
            </>
          ) : (
            <p className="text-sm text-wt-text-muted">
              Project manager assignment is available when creating a new allocation.
            </p>
          )}
        </div>
      </div>
    </WtFormDialog>
  );
}
