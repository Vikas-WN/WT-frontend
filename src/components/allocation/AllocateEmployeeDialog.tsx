"use client";

import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InputField, SelectField } from "@/components/dashboard/ui/forms";
import { AllocatedPercentSelect } from "@/components/allocation/AllocatedPercentSelect";
import { CurrentAllocationHint } from "@/components/allocation/CurrentAllocationHint";
import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";
import { InternalEmployeesMultiSelect } from "@/components/allocation/InternalEmployeesMultiSelect";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { hrmsService } from "@/services/hrms.service";
import { normalizeToApiDate, parseApiDate } from "@/utils/apiDate";
import {
  createEmptyAllocationForm,
  type AllocationFormState,
} from "@/utils/allocationFormState";
import type { AllocationPercentRow } from "@/types/allocationPercent";
import { isValidAllocationPercentForDesignation } from "@/utils/allocationPercent";
import { parseEmployeeAllocationsResponse } from "@/utils/allocationList";
import {
  ALLOCATION_STATUS_OPTIONS,
  type AllocationBillingStatus,
} from "@/constants/allocationOptions";
import {
  ALLOCATION_STATUS_SELECT_OPTIONS,
  ALLOCATION_TYPE_SELECT_OPTIONS,
  allocationTypeForBillingStatus,
} from "@/utils/allocationDefaults";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { UI_COPY } from "@/constants/uiCopy";

const CUSTOM_ROLE_VALUE = "__custom_role__";

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
  const [customRole, setCustomRole] = useState("");
  const [assignProjectManagers, setAssignProjectManagers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const roleOptions = useMemo(
    () => [...allocationRoles, CUSTOM_ROLE_VALUE],
    [allocationRoles]
  );

  const resolvedRole =
    form.role === CUSTOM_ROLE_VALUE ? customRole.trim() : form.role.trim();

  useEffect(() => {
    if (!open) {
      setForm(createEmptyAllocationForm());
      setCustomRole("");
      setAssignProjectManagers([]);
      setLoading(false);
      return;
    }
    if (initialForm) {
      const knownRole = allocationRoles.includes(initialForm.role);
      setForm({
        ...initialForm,
        role: knownRole ? initialForm.role : initialForm.role ? CUSTOM_ROLE_VALUE : "",
      });
      if (!knownRole && initialForm.role) {
        setCustomRole(initialForm.role);
      }
    }
  }, [open, initialForm, allocationRoles]);

  const staffing = isStaffingProject(form.project_code);
  const allocationTypeOptions = staffing
    ? [{ value: "STAFFING", label: "Staffing" }]
    : ALLOCATION_TYPE_SELECT_OPTIONS;
  const showLockedInDate = !staffing && form.allocation_type === "LOCKED";

  async function handleSubmit() {
    const employeeEmail = form.employee_email.trim();
    const projectCode = form.project_code.trim();
    const role = resolvedRole;
    if (!employeeEmail) {
      showErrorToast("Please select an employee.");
      return;
    }
    if (!projectCode) {
      showErrorToast("Please select a project.");
      return;
    }
    if (!role) {
      showErrorToast("Please select or enter a project role.");
      return;
    }
    if (!form.allocated_percent || Number(form.allocated_percent) <= 0 || Number(form.allocated_percent) > 100) {
      showErrorToast("Please enter a valid allocation % (1–100).");
      return;
    }
    if (!form.allocation_type) {
      showErrorToast("Please select allocation type.");
      return;
    }
    if (!form.billing_status) {
      showErrorToast("Please select status.");
      return;
    }
    const startDate = normalizeToApiDate(form.start_date);
    if (!startDate) {
      showErrorToast("Start date is required.");
      return;
    }
    const endDate = normalizeToApiDate(form.end_date);
    if (!endDate) {
      showErrorToast("End date is required.");
      return;
    }
    const startParsed = parseApiDate(startDate);
    const endParsed = parseApiDate(endDate);
    if (startParsed && endParsed && endParsed < startParsed) {
      showErrorToast("End date must be on or after the start date.");
      return;
    }

    const nextPercent = Number(form.allocated_percent);
    try {
      const res = await hrmsService.getEmployeeAllocations({ userEmail: employeeEmail });
      let current = parseEmployeeAllocationsResponse(res.data ?? res)?.totalAllocatedPercent ?? 0;
      if (editingAllocationId && initialForm?.allocated_percent) {
        const previous = Number(initialForm.allocated_percent);
        if (Number.isFinite(previous)) {
          current = Math.max(0, current - previous);
        }
      }
      if (current + nextPercent > 100) {
        showErrorToast(
          `Total allocation cannot exceed 100% (current ${current}%, adding ${nextPercent}%).`
        );
        return;
      }
    } catch {
      /* allow submit if lookup fails */
    }

    setLoading(true);
    try {
      const allocationType = staffing ? "STAFFING" : form.allocation_type;
      const lockedInDate =
        allocationType === "LOCKED"
          ? normalizeToApiDate(form.locked_in_date || form.start_date)
          : null;
      if (allocationType === "LOCKED" && !lockedInDate) {
        showErrorToast("Locked-in date is required for locked allocations.");
        setLoading(false);
        return;
      }
      const payload = {
        employeeEmail,
        projectCode,
        role: role || null,
        allocatedPercent: nextPercent,
        startDate,
        endDate,
        allocationType,
        billingStatus: form.billing_status,
        lockedInDate,
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
      title={editingAllocationId ? "Edit Allocation" : "People Allocation"}
      description={
        editingAllocationId
          ? "Update allocation details for this employee."
          : "Assign an employee to a project with role, type, status, and dates."
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel={editingAllocationId ? UI_COPY.saveChanges : "Allocate Employee"}
      loading={loading}
      maxWidthClass="max-w-3xl"
    >
      <FormSection title="People Allocation">
        <div className="grid gap-4 sm:grid-cols-2">
          <InternalEmployeeSelect
            label="Name"
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
            label="Role"
            required
            value={form.role}
            placeholder="Select project role"
            options={roleOptions.map((role) =>
              role === CUSTOM_ROLE_VALUE
                ? { value: role, label: "Create new role…" }
                : { value: role, label: role }
            )}
            onChange={(role) => setForm((prev) => ({ ...prev, role }))}
          />
          {form.role === CUSTOM_ROLE_VALUE ? (
            <InputField
              label="New Role"
              required
              value={customRole}
              onChange={setCustomRole}
              placeholder="Enter role name"
            />
          ) : null}
          <AllocatedPercentSelect
            required
            designation={resolvedRole}
            enabled={enabled}
            value={form.allocated_percent}
            onChange={(value) => setForm((prev) => ({ ...prev, allocated_percent: value }))}
          />
          <div className="sm:col-span-2">
            <CurrentAllocationHint email={form.employee_email} />
          </div>
          <SelectField
            label="Allocation Type"
            placeholder={staffing ? "Staffing (required for staffing projects)" : "Select allocation type"}
            required
            value={staffing ? "STAFFING" : form.allocation_type}
            options={allocationTypeOptions}
            disabled={staffing}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                allocation_type: value,
                locked_in_date: value === "LOCKED" ? prev.locked_in_date || prev.start_date : "",
              }))
            }
          />
          <SelectField
            label="Status"
            placeholder="Select status"
            required
            value={form.billing_status}
            options={ALLOCATION_STATUS_SELECT_OPTIONS}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                billing_status: ALLOCATION_STATUS_OPTIONS.some((o) => o.value === value)
                  ? (value as AllocationBillingStatus)
                  : "",
                allocation_type: staffing
                  ? "STAFFING"
                  : allocationTypeForBillingStatus(value as AllocationBillingStatus, prev.allocation_type),
              }))
            }
          />
          {showLockedInDate ? (
            <InputField
              label="Locked-In Date"
              required
              type="date"
              value={form.locked_in_date}
              onChange={(value) => setForm((prev) => ({ ...prev, locked_in_date: value }))}
            />
          ) : null}
          <InputField
            label="Start Date"
            required
            type="date"
            value={form.start_date}
            onChange={(value) => setForm((prev) => ({ ...prev, start_date: value, locked_in_date: prev.allocation_type === "LOCKED" && !prev.locked_in_date ? value : prev.locked_in_date }))}
          />
          <InputField
            label="End Date"
            required
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
      </FormSection>
    </WtFormDialog>
  );
}
