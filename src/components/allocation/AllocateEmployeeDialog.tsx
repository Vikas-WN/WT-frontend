"use client";

import { useEffect, useMemo, useState } from "react";
import { InputField, SelectField } from "@/components/dashboard/ui/forms";
import { AllocatedPercentSelect } from "@/components/allocation/AllocatedPercentSelect";
import { CurrentAllocationHint } from "@/components/allocation/CurrentAllocationHint";
import { EmployeeCurrentAllocationsPanel } from "@/components/allocation/EmployeeCurrentAllocationsPanel";
import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { useAllocationPercentages } from "@/hooks/useAllocationPercentages";
import { hrmsService } from "@/services/hrms.service";
import { parseApiDate, validateRequiredApiDate, formatApiDateDisplay } from "@/utils/apiDate";
import {
  createEmptyAllocationForm,
  type AllocationFormState,
} from "@/utils/allocationFormState";
import type { AllocationPercentRow } from "@/types/allocationPercent";
import {
  parseEmployeeAllocationsResponse,
  sumOverlappingProjectAllocatedPercent,
} from "@/utils/allocationList";
import {
  allocationPercentOptionsForDesignation,
  isValidAllocationPercentForDesignation,
} from "@/utils/allocationPercent";
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
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { UI_COPY } from "@/constants/uiCopy";
import { useAllocationEmployees } from "@/hooks/useAllocationEmployees";
import { validateAllocationWithinProjectDates } from "@/utils/allocationProjectDates";
import { isEligibleForProjectAllocation } from "@/utils/userStatus";

const CUSTOM_ROLE_VALUE = "__custom_role__";
const ALLOCATE_STEPS = ["Employee", "Project", "Details"] as const;
type AllocateStep = (typeof ALLOCATE_STEPS)[number];

type ProjectOption = {
  code: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
};

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
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AllocateStep>("Employee");
  const [allocationVersion, setAllocationVersion] = useState(0);
  const { data: allocationEmployees = [] } = useAllocationEmployees(open && enabled);

  const isEditMode = Boolean(editingAllocationId);
  const stepIndex = ALLOCATE_STEPS.indexOf(step);

  const roleOptions = useMemo(
    () => [...allocationRoles, CUSTOM_ROLE_VALUE],
    [allocationRoles]
  );

  const resolvedRole =
    form.role === CUSTOM_ROLE_VALUE ? customRole.trim() : form.role.trim();

  const { data: rolePercentOptions = [] } = useAllocationPercentages(
    resolvedRole,
    enabled && Boolean(resolvedRole.trim())
  );
  const effectivePercentOptions = rolePercentOptions.length
    ? rolePercentOptions
    : allocationPercentOptions;

  useEffect(() => {
    if (!open || !resolvedRole.trim()) return;
    if (
      form.allocated_percent &&
      !isValidAllocationPercentForDesignation(
        form.allocated_percent,
        resolvedRole,
        effectivePercentOptions
      )
    ) {
      setForm((prev) => ({ ...prev, allocated_percent: "" }));
    }
  }, [open, resolvedRole, effectivePercentOptions, form.allocated_percent]);

  useEffect(() => {
    if (!open) {
      setForm(createEmptyAllocationForm());
      setCustomRole("");
      setLoading(false);
      setStep("Employee");
      setAllocationVersion(0);
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
  const percentOptions = useMemo(
    () => allocationPercentOptionsForDesignation(resolvedRole, effectivePercentOptions),
    [resolvedRole, effectivePercentOptions]
  );
  const allocationTypeOptions = staffing
    ? [{ value: "STAFFING", label: "Staffing" }]
    : ALLOCATION_TYPE_SELECT_OPTIONS;
  const showLockedInDate = !staffing && form.allocation_type === "LOCKED";

  function validateEmployeeStep(): boolean {
    if (!form.employee_email.trim()) {
      showErrorToast("Please select an employee.");
      return false;
    }
    return true;
  }

  function validateProjectStep(): boolean {
    if (!form.project_code.trim()) {
      showErrorToast("Please select a project.");
      return false;
    }
    return true;
  }

  function goToNextStep() {
    if (isEditMode) {
      void handleSubmit();
      return;
    }
    if (step === "Employee") {
      if (!validateEmployeeStep()) return;
      setStep("Project");
      return;
    }
    if (step === "Project") {
      if (!validateProjectStep()) return;
      setStep("Details");
    }
  }

  function goToPreviousStep() {
    if (step === "Project") setStep("Employee");
    if (step === "Details") setStep("Project");
  }

  async function handleSubmit() {
    const employeeEmail = form.employee_email.trim();
    const projectCode = form.project_code.trim();
    const role = resolvedRole;
    if (!validateEmployeeStep() || !validateProjectStep()) return;
    if (!role) {
      showErrorToast("Please select or enter a project role.");
      return;
    }
    if (!form.allocated_percent || Number(form.allocated_percent) <= 0 || Number(form.allocated_percent) > 100) {
      showErrorToast("Please select a valid allocation %.");
      return;
    }
    if (
      !isValidAllocationPercentForDesignation(
        form.allocated_percent,
        resolvedRole,
        effectivePercentOptions
      )
    ) {
      const allowed = percentOptions.map((option) => option.label).join(", ");
      showErrorToast(
        allowed
          ? `Allocation % must be one of: ${allowed} for ${resolvedRole}.`
          : `Allocation % is not valid for ${resolvedRole}.`
      );
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
    const startResult = validateRequiredApiDate(form.start_date, "Start date");
    if (!startResult.ok) {
      showErrorToast(startResult.error);
      return;
    }
    const startDate = startResult.date;

    const selectedEmployee = allocationEmployees.find(
      (row) => row.employeeEmail === employeeEmail.toLowerCase()
    );
    if (selectedEmployee?.status && !isEligibleForProjectAllocation(selectedEmployee.status)) {
      showErrorToast(
        "This employee has not completed onboarding yet. Allocation is allowed only after onboarding is complete and the employee is Active."
      );
      return;
    }
    const dojParsed = parseApiDate(selectedEmployee?.doj ?? "");
    const startParsedForDoj = parseApiDate(startDate);
    if (dojParsed && startParsedForDoj && startParsedForDoj < dojParsed) {
      showErrorToast(
        `Allocation start date cannot be before date of joining (${formatApiDateDisplay(selectedEmployee?.doj)}).`
      );
      return;
    }

    const endResult = validateRequiredApiDate(form.end_date, "End date");
    if (!endResult.ok) {
      showErrorToast(endResult.error);
      return;
    }
    const endDate = endResult.date;

    const startParsed = parseApiDate(startDate);
    const endParsed = parseApiDate(endDate);
    if (startParsed && endParsed && !(startParsed < endParsed)) {
      showErrorToast("End date must be after the start date.");
      return;
    }

    const selectedProject = projects.find(
      (project) => project.code.trim().toUpperCase() === projectCode.toUpperCase()
    );
    if (selectedProject) {
      const projectDateError = validateAllocationWithinProjectDates(
        startDate,
        endDate,
        selectedProject
      );
      if (projectDateError) {
        showErrorToast(projectDateError);
        return;
      }
    }

    const nextPercent = Number(form.allocated_percent);
    try {
      const res = await hrmsService.getEmployeeAllocations({ userEmail: employeeEmail });
      const parsed = parseEmployeeAllocationsResponse(res.data ?? res);
      let current = sumOverlappingProjectAllocatedPercent(
        parsed?.allocations ?? [],
        startDate,
        endDate
      );
      if (editingAllocationId && initialForm?.allocated_percent) {
        const previous = Number(initialForm.allocated_percent);
        if (Number.isFinite(previous)) {
          current = Math.max(0, current - previous);
        }
      }
      const available = Math.max(0, 100 - current);
      if (nextPercent > available) {
          showErrorToast(
            `Only ${available}% is available to allocate (projects use ${current}%; talent pool is free capacity).`
          );
        return;
      }
    } catch {
      /* allow submit if lookup fails */
    }

    setLoading(true);
    try {
      const allocationType = staffing ? "STAFFING" : form.allocation_type;
      let lockedInDate: string | null = null;
      if (allocationType === "LOCKED") {
        const lockedInRaw = (form.locked_in_date || form.start_date).trim();
        const lockedResult = validateRequiredApiDate(lockedInRaw, "Locked-in date");
        if (!lockedResult.ok) {
          showErrorToast(lockedResult.error);
          setLoading(false);
          return;
        }
        lockedInDate = lockedResult.date;
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
      }

      showSuccessToast(editingAllocationId ? "Allocation updated." : "Employee allocated successfully.");
      await onSaved();
      onClose();
    } catch (error) {
      showErrorToast(
        toUserFriendlyApiErrorMessage(error, "Could not create allocation. Please check the details and try again.")
      );
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
          : `Step ${stepIndex + 1} of ${ALLOCATE_STEPS.length}: ${
              step === "Employee"
                ? "Choose the employee and review their current allocations."
                : step === "Project"
                  ? "Select the project to assign."
                  : "Set role, allocation %, type, status, and dates."
            }`
      }
      onClose={onClose}
      onSubmit={() => void (step === "Details" || isEditMode ? handleSubmit() : goToNextStep())}
      submitLabel={
        editingAllocationId
          ? UI_COPY.saveChanges
          : step === "Details"
            ? "Allocate Employee"
            : "Next"
      }
      secondaryAction={
        !isEditMode && step !== "Employee"
          ? { label: "Back", onClick: goToPreviousStep, disabled: loading }
          : undefined
      }
      loading={loading}
      maxWidthClass="max-w-3xl"
    >
      {!isEditMode ? (
        <ol className="mb-4 flex flex-wrap gap-2 text-xs font-medium">
          {ALLOCATE_STEPS.map((label, index) => (
            <li
              key={label}
              className={`rounded-full px-3 py-1 ${
                index === stepIndex
                  ? "bg-wt-brand text-white"
                  : index < stepIndex
                    ? "bg-wt-surface-2 text-wt-text"
                    : "bg-wt-surface-1 text-wt-text-muted"
              }`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
      ) : null}
      <FormSection title={isEditMode ? "People Allocation" : step}>
        {isEditMode || step === "Employee" ? (
          <div className="space-y-4">
            <InternalEmployeeSelect
              label="Name"
              required
              value={form.employee_email}
              onChange={(value) => setForm((prev) => ({ ...prev, employee_email: value }))}
            />
            <EmployeeCurrentAllocationsPanel
              email={form.employee_email}
              onChanged={() => setAllocationVersion((value) => value + 1)}
            />
          </div>
        ) : null}

        {!isEditMode && step === "Project" ? (
          <div className="space-y-4">
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
            <CurrentAllocationHint
              key={`${form.employee_email}-${allocationVersion}`}
              email={form.employee_email}
              detailed
            />
          </div>
        ) : null}

        {isEditMode || step === "Details" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {isEditMode ? (
            <>
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
            </>
          ) : null}
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
            allocationPercentOptions={effectivePercentOptions}
            value={form.allocated_percent}
            onChange={(value) => setForm((prev) => ({ ...prev, allocated_percent: value }))}
          />
          {!isEditMode ? (
            <div className="sm:col-span-2">
              <CurrentAllocationHint
                key={`${form.employee_email}-${allocationVersion}`}
                email={form.employee_email}
                detailed
              />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <CurrentAllocationHint
                key={`${form.employee_email}-${allocationVersion}`}
                email={form.employee_email}
              />
            </div>
          )}
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
        </div>
        ) : null}
      </FormSection>
    </WtFormDialog>
  );
}
