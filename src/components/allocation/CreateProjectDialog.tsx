"use client";

import { useEffect, useState } from "react";
import { InputField } from "@/components/dashboard/ui/forms";
import { useAllocationPercentages } from "@/hooks/useAllocationPercentages";
import { useClientOpportunities } from "@/hooks/clients/useClientOpportunities";
import { useClients } from "@/hooks/clients/useClients";
import { ClientSelect } from "@/components/allocation/ClientSelect";
import { OpportunityMultiSelect } from "@/components/allocation/OpportunityMultiSelect";
import { ProjectTypeSelect } from "@/components/allocation/ProjectTypeSelect";
import { RoleEmployeeSelect } from "@/components/allocation/RoleEmployeeSelect";
import {
  ManagerAllocationFields,
  createEmptyManagerAllocationFields,
  type ManagerAllocationFieldsState,
} from "@/components/allocation/ManagerAllocationFields";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { hrmsService } from "@/services/hrms.service";
import { compareApiDates, validateRequiredApiDate } from "@/utils/apiDate";
import {
  createEmptyProjectForm,
  type ProjectFormState,
} from "@/utils/allocationFormState";
import { generateAutomaticProjectCode } from "@/utils/dashboard/validation";
import { isKnownProjectTypeCode } from "@/utils/projectTypes";
import { normalizePickerEmail } from "@/utils/learning/onboardOptions";
import {
  allocationPercentOptionsForDesignation,
  isValidAllocationPercentForDesignation,
} from "@/utils/allocationPercent";
import { parseEmployeeAllocationsResponse } from "@/utils/allocationList";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { UI_COPY } from "@/constants/uiCopy";

import type { ProjectTypeRow } from "@/types/projectType";
import type { AllocationPercentRow } from "@/types/allocationPercent";

/** Backend default when create UI omits project type. */
const DEFAULT_CREATE_PROJECT_TYPE = "IN_HOUSE";

async function readCurrentAllocationPercent(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return 0;
  try {
    const res = await hrmsService.getEmployeeAllocations({ userEmail: normalized });
    return parseEmployeeAllocationsResponse(res.data ?? res)?.totalAllocatedPercent ?? 0;
  } catch {
    return 0;
  }
}

async function assertAllocationWithinCap(email: string, nextPercent: number) {
  const current = await readCurrentAllocationPercent(email);
  if (current + nextPercent > 100) {
    throw new Error(
      `Allocation would exceed 100% for ${email} (current ${current}%, adding ${nextPercent}%).`
    );
  }
}

async function allocateManagerOnProject({
  email,
  fields,
  projectCode,
  projectStart,
  projectEnd,
  isManager = false,
  allocationPercentOptions = [],
}: {
  email: string;
  fields: ManagerAllocationFieldsState;
  projectCode: string;
  projectStart: string;
  projectEnd: string;
  isManager?: boolean;
  allocationPercentOptions?: AllocationPercentRow[];
}) {
  const normalized = normalizePickerEmail(email);
  if (!normalized) return;
  const percent = Number(fields.allocated_percent);
  if (!Number.isFinite(percent) || percent <= 0) {
    throw new Error("Project Manager allocation % is required.");
  }
  const roleDesignation = fields.role || "Project Manager";
  if (!isValidAllocationPercentForDesignation(String(percent), roleDesignation, allocationPercentOptions)) {
    const allowed = allocationPercentOptionsForDesignation(roleDesignation, allocationPercentOptions)
      .map((option) => option.label)
      .join(", ");
    throw new Error(
      allowed
        ? `Allocation % must be one of: ${allowed} for ${roleDesignation}.`
        : `Allocation % is not valid for ${roleDesignation}.`
    );
  }
  await assertAllocationWithinCap(normalized, percent);
  const startResult = validateRequiredApiDate(
    fields.start_date.trim() || projectStart,
    "Project Manager start date"
  );
  if (!startResult.ok) {
    throw new Error(startResult.error);
  }
  const startDate = startResult.date;
  const endResult = validateRequiredApiDate(
    fields.end_date.trim() || projectEnd,
    "Project Manager end date"
  );
  if (!endResult.ok) {
    throw new Error(endResult.error);
  }
  const endDate = endResult.date;
  if (compareApiDates(startDate, endDate) > 0) {
    throw new Error("Project Manager start date must be on or before end date.");
  }
  if (
    compareApiDates(startDate, projectStart) < 0 ||
    compareApiDates(endDate, projectEnd) > 0
  ) {
    throw new Error(
      "Project Manager dates must fall within the project start and end dates."
    );
  }
  const allocationType = fields.allocation_type || "DEPLOYABLE";
  let lockedInDate: string | null = null;
  if (allocationType === "LOCKED") {
    const lockedResult = validateRequiredApiDate(
      (fields.locked_in_date || fields.start_date || projectStart).trim(),
      "Locked-in date"
    );
    if (!lockedResult.ok) {
      throw new Error(lockedResult.error);
    }
    lockedInDate = lockedResult.date;
  }
  const billingStatus = fields.billing_status || "BILLED";
  await hrmsService.createAllocation({
    employeeEmail: normalized,
    projectCode,
    role: fields.role,
    allocatedPercent: percent,
    startDate,
    endDate,
    allocationType,
    billingStatus,
    lockedInDate,
    isManager,
  });
}

export function CreateProjectDialog({
  open,
  onClose,
  onCreated,
  activeProjectTypes,
  enabled,
  allocationPercentOptions,
  initialProjectName,
  editingProjectCode = "",
  initialForm,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  activeProjectTypes: ProjectTypeRow[];
  enabled: boolean;
  allocationPercentOptions: AllocationPercentRow[];
  initialProjectName?: string;
  /** When set, dialog updates this project instead of creating. */
  editingProjectCode?: string;
  initialForm?: ProjectFormState | null;
}) {
  const [form, setForm] = useState<ProjectFormState>(createEmptyProjectForm());
  const [dmFields, setDmFields] = useState(() =>
    createEmptyManagerAllocationFields("Delivery Manager")
  );
  const [pmFields, setPmFields] = useState(() =>
    createEmptyManagerAllocationFields("Project Manager")
  );
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(editingProjectCode.trim());
  const { data: projectManagerPercentOptions = [] } = useAllocationPercentages(
    "Project Manager",
    enabled
  );
  const pmPercentOptions = projectManagerPercentOptions.length
    ? projectManagerPercentOptions
    : allocationPercentOptions;

  const clientIdForOpportunities = form.client_id.trim();
  // Same query key as ClientSelect, so this shares the cached list rather than refetching.
  // Needed at submit time: a stored client that is inactive (or otherwise absent from the
  // list) leaves the picker rendering its placeholder, so the field looks empty while the
  // form still holds the old id.
  const clientsQ = useClients({ activeOnly: true, enabled: open });
  const opportunitiesQ = useClientOpportunities({
    clientId: clientIdForOpportunities || null,
    enabled: open && !isEditing && Boolean(clientIdForOpportunities),
  });
  const clientHasOpportunities = (opportunitiesQ.data?.items.length ?? 0) > 0;
  const opportunitiesRequired = !isEditing && clientHasOpportunities;

  useEffect(() => {
    if (!open) {
      setForm(createEmptyProjectForm());
      setDmFields(createEmptyManagerAllocationFields("Delivery Manager"));
      setPmFields(createEmptyManagerAllocationFields("Project Manager"));
      setLoading(false);
      return;
    }
    if (initialForm) {
      const next = { ...createEmptyProjectForm(), ...initialForm };
      setForm(next);
      const pmEmail = (initialForm.project_manager_emails?.[0] ?? "").trim().toLowerCase();
      setPmFields({
        ...createEmptyManagerAllocationFields("Project Manager"),
        email: pmEmail,
        start_date: next.start_date || "",
        end_date: next.end_date || "",
      });
      return;
    }
    const prefillsName = initialProjectName?.trim() ?? "";
    if (prefillsName) {
      setForm((prev) => ({ ...prev, project_name: prefillsName }));
    }
  }, [open, initialProjectName, initialForm, editingProjectCode]);

  async function handleSubmit() {
    const name = form.project_name.trim();
    if (!name) {
      showErrorToast("Project name is required.");
      return;
    }
    const clientIdRaw = form.client_id.trim();
    if (!clientIdRaw) {
      showErrorToast("Client is required.");
      return;
    }
    // Guard against saving an id the picker cannot display, which would let a blank-looking
    // mandatory field through.
    if (clientsQ.isLoading) {
      showErrorToast("Still loading clients. Try again in a moment.");
      return;
    }
    const clientIsSelectable = (clientsQ.data ?? []).some(
      (client) => String(client.id) === clientIdRaw
    );
    if (!clientIsSelectable) {
      showErrorToast("Select a client from the list.");
      return;
    }
    if (!isEditing && clientIdForOpportunities) {
      if (opportunitiesQ.isLoading) {
        showErrorToast("Still loading opportunities for this client.");
        return;
      }
      if (opportunitiesQ.isError) {
        showErrorToast("Could not load opportunities for this client. Try again.");
        return;
      }
      // Only require a selection when the client actually has opportunities to choose from.
      if (clientHasOpportunities && !form.opportunity_ids.length) {
        showErrorToast("Select at least one opportunity for this client.");
        return;
      }
    }
    if (
      isEditing &&
      (!form.project_type || !isKnownProjectTypeCode(form.project_type, activeProjectTypes))
    ) {
      showErrorToast("Please select a valid project type.");
      return;
    }
    const accountManagerEmail = normalizePickerEmail(form.account_manager_email);
    if (
      !isEditing &&
      (!accountManagerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountManagerEmail))
    ) {
      showErrorToast(
        form.client_id.trim()
          ? "Select an account manager from the list."
          : "Select a client, then choose an account manager."
      );
      return;
    }
    const startResult = validateRequiredApiDate(form.start_date, "Start date");
    if (!startResult.ok) {
      showErrorToast(startResult.error);
      return;
    }
    const endResult = validateRequiredApiDate(form.end_date, "End date");
    if (!endResult.ok) {
      showErrorToast(endResult.error);
      return;
    }
    const startDate = startResult.date;
    const endDate = endResult.date;
    if (compareApiDates(startDate, endDate) > 0) {
      showErrorToast("Project start date must be on or before end date.");
      return;
    }

    // Create and edit both manage Project Manager here (Account Manager stays on the client).
    const pmEmail = pmFields.email.trim();
    if (!pmEmail) {
      showErrorToast("Project Manager is required.");
      return;
    }
    const pmStartResult = validateRequiredApiDate(
      pmFields.start_date.trim() || form.start_date,
      "Project Manager start date"
    );
    if (!pmStartResult.ok) {
      showErrorToast(pmStartResult.error);
      return;
    }
    const pmEndResult = validateRequiredApiDate(
      pmFields.end_date.trim() || form.end_date,
      "Project Manager end date"
    );
    if (!pmEndResult.ok) {
      showErrorToast(pmEndResult.error);
      return;
    }
    const pmStartDate = pmStartResult.date;
    const pmEndDate = pmEndResult.date;
    if (compareApiDates(pmStartDate, pmEndDate) > 0) {
      showErrorToast("Project Manager start date must be on or before end date.");
      return;
    }
    if (
      compareApiDates(pmStartDate, startDate) < 0 ||
      compareApiDates(pmEndDate, endDate) > 0
    ) {
      showErrorToast(
        "Project Manager dates must fall within the project start and end dates."
      );
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const code = editingProjectCode.trim();
        await hrmsService.updateProject(code, {
          project_name: name,
          project_type: form.project_type,
          client_id: clientIdRaw,
          start_date: startDate,
          end_date: endDate,
        });

        if (pmEmail) {
          const previousPm = (initialForm?.project_manager_emails?.[0] ?? "").trim().toLowerCase();
          const nextPm = normalizePickerEmail(pmEmail);
          if (nextPm && nextPm !== previousPm) {
            try {
              await hrmsService.assignProjectManager({
                userEmail: nextPm,
                projectCode: code,
              });
            } catch {
              await allocateManagerOnProject({
                email: nextPm,
                fields: {
                  ...pmFields,
                  email: nextPm,
                  role: "Project Manager",
                  start_date: pmFields.start_date || form.start_date,
                  end_date: pmFields.end_date || form.end_date,
                },
                projectCode: code,
                projectStart: startDate,
                projectEnd: endDate,
                isManager: true,
                allocationPercentOptions: pmPercentOptions,
              });
            }
          }
        }

        showSuccessToast("Project updated successfully.");
        onCreated();
        onClose();
        return;
      }

      const projectCode = generateAutomaticProjectCode();
      await hrmsService.createProject({
        project_code: projectCode,
        project_name: name,
        project_type: DEFAULT_CREATE_PROJECT_TYPE,
        client_id: clientIdRaw,
        account_manager_email: accountManagerEmail,
        start_date: startDate,
        end_date: endDate,
        opportunity_ids: form.opportunity_ids,
      });

      // Delivery Manager is contact-only on create (no allocation). PM is allocated.
      if (pmEmail) {
        await allocateManagerOnProject({
          email: pmEmail,
          fields: {
            ...pmFields,
            email: pmEmail,
            role: "Project Manager",
            start_date: pmFields.start_date || form.start_date,
            end_date: pmFields.end_date || form.end_date,
          },
          projectCode,
          projectStart: startDate,
          projectEnd: endDate,
          isManager: true,
          allocationPercentOptions: pmPercentOptions,
        });
      }

      showSuccessToast("Project created successfully.");
      onCreated();
      onClose();
    } catch (error) {
      showErrorToast(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Could not update project."
            : "Could not create project."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <WtFormDialog
      open={open}
      title={isEditing ? "Edit Project" : "Create Project"}
      description={
        isEditing
          ? "Update project details and project manager. Account manager comes from the client."
          : "Set project details, then assign managers. Account manager is taken from the client."
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel={isEditing ? UI_COPY.updateProject : "Create Project"}
      loading={loading}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-6">
        <FormSection title={isEditing ? "Edit Project" : "Create Project"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Name"
              required
              value={form.project_name}
              onChange={(value) => setForm((prev) => ({ ...prev, project_name: value }))}
            />
            <ClientSelect
              required
              value={form.client_id}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  client_id: value,
                  ...(value !== prev.client_id
                    ? {
                        client_name: value ? prev.client_name : "",
                        opportunity_ids: [],
                        account_manager_email: value ? prev.account_manager_email : "",
                        delivery_manager_email: value ? prev.delivery_manager_email : "",
                      }
                    : {}),
                }))
              }
              onClientSelected={(client) => {
                const dmEmail = client.deliveryManagerEmail?.trim() || "";
                const amEmail = client.accountManagerEmail?.trim() || "";
                setForm((prev) => ({
                  ...prev,
                  client_id: String(client.id),
                  client_name: client.name,
                  account_manager_email: amEmail,
                  delivery_manager_email: dmEmail || prev.delivery_manager_email,
                  opportunity_ids: [],
                }));
                if (dmEmail) {
                  setDmFields((prev) => ({ ...prev, email: dmEmail }));
                }
              }}
            />
            {!isEditing ? (
              <OpportunityMultiSelect
                clientId={form.client_id}
                value={form.opportunity_ids}
                onChange={(opportunityIds) =>
                  setForm((prev) => ({ ...prev, opportunity_ids: opportunityIds }))
                }
                disabled={loading}
                required={opportunitiesRequired}
              />
            ) : null}
            <InputField
              label="Start Date"
              required
              type="date"
              value={form.start_date}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, start_date: value }));
                setPmFields((prev) => ({ ...prev, start_date: value }));
              }}
            />
            <InputField
              label="End Date"
              required
              type="date"
              value={form.end_date}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, end_date: value }));
                setPmFields((prev) => ({ ...prev, end_date: value }));
              }}
            />
            {!isEditing ? (
              <RoleEmployeeSelect
                label="Account Manager"
                role="AM"
                required
                value={form.account_manager_email}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, account_manager_email: value }))
                }
                disabled={!form.client_id.trim()}
                extraEmails={
                  form.account_manager_email ? [form.account_manager_email] : []
                }
              />
            ) : null}
            {isEditing ? (
              <ProjectTypeSelect
                required
                activeOnly
                enabled={enabled}
                value={form.project_type}
                onChange={(value) => setForm((prev) => ({ ...prev, project_type: value }))}
              />
            ) : null}
          </div>
        </FormSection>

        {!isEditing ? (
          <ManagerAllocationFields
            title="Delivery Manager"
            state={dmFields}
            onChange={(next) => {
              setDmFields(next);
              setForm((prev) => ({
                ...prev,
                delivery_manager_email: next.email,
              }));
            }}
            allocationPercentOptions={allocationPercentOptions}
            enabled={enabled}
            percentDesignation="Delivery Manager"
            managerContactOnly
          />
        ) : null}

        <ManagerAllocationFields
          title="Project Manager"
          state={pmFields}
          onChange={setPmFields}
          allocationPercentOptions={pmPercentOptions}
          enabled={enabled}
          percentDesignation="Project Manager"
        />
      </div>
    </WtFormDialog>
  );
}
