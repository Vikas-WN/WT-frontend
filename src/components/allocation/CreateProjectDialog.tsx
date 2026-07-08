"use client";

import { useEffect, useState } from "react";
import { InputField } from "@/components/dashboard/ui/forms";
import { AccountManagerSelect } from "@/components/allocation/AccountManagerSelect";
import { ClientSelect } from "@/components/allocation/ClientSelect";
import { ProjectTypeSelect } from "@/components/allocation/ProjectTypeSelect";
import {
  ManagerAllocationFields,
  createEmptyManagerAllocationFields,
  type ManagerAllocationFieldsState,
} from "@/components/allocation/ManagerAllocationFields";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { hrmsService } from "@/services/hrms.service";
import { normalizeToApiDate } from "@/utils/apiDate";
import {
  createEmptyProjectForm,
  type ProjectFormState,
} from "@/utils/allocationFormState";
import { generateAutomaticProjectCode } from "@/utils/dashboard/validation";
import { isKnownProjectTypeCode } from "@/utils/projectTypes";
import { normalizePickerEmail } from "@/utils/learning/onboardOptions";
import { parseEmployeeAllocationsResponse } from "@/utils/allocationList";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

import type { ProjectTypeRow } from "@/types/projectType";
import type { AllocationPercentRow } from "@/types/allocationPercent";

async function readCurrentAllocationPercent(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return 0;
  try {
    const res = await hrmsService.getEmployeeAllocations({ userEmail: normalized });
    return parseEmployeeAllocationsResponse(res.data ?? res).totalAllocatedPercent;
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
  billingStatus,
}: {
  email: string;
  fields: ManagerAllocationFieldsState;
  projectCode: string;
  projectStart: string;
  projectEnd: string;
  billingStatus: "BILLED" | "BUFFER" | "INVESTMENT" | "TALENT_POOL";
}) {
  const normalized = normalizePickerEmail(email);
  if (!normalized) return;
  const percent = Number(fields.allocated_percent);
  if (!Number.isFinite(percent) || percent <= 0) return;
  await assertAllocationWithinCap(normalized, percent);
  const startDate = normalizeToApiDate(fields.start_date || projectStart);
  if (!startDate) return;
  const endDate = normalizeToApiDate(fields.end_date || projectEnd) || null;
  await hrmsService.createAllocation({
    employeeEmail: normalized,
    projectCode,
    role: fields.role,
    allocatedPercent: percent,
    startDate,
    endDate,
    allocationType: fields.allocation_type || "DEPLOYABLE",
    billingStatus,
  });
}

export function CreateProjectDialog({
  open,
  onClose,
  onCreated,
  activeProjectTypes,
  enabled,
  allocationPercentOptions,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  activeProjectTypes: ProjectTypeRow[];
  enabled: boolean;
  allocationPercentOptions: AllocationPercentRow[];
}) {
  const [form, setForm] = useState<ProjectFormState>(createEmptyProjectForm());
  const [dmFields, setDmFields] = useState(() =>
    createEmptyManagerAllocationFields("Delivery Manager")
  );
  const [pmFields, setPmFields] = useState(() =>
    createEmptyManagerAllocationFields("Project Manager")
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(createEmptyProjectForm());
      setDmFields(createEmptyManagerAllocationFields("Delivery Manager"));
      setPmFields(createEmptyManagerAllocationFields("Project Manager"));
      setLoading(false);
    }
  }, [open]);

  async function handleSubmit() {
    const name = form.project_name.trim();
    if (!name) {
      showErrorToast("Project name is required.");
      return;
    }
    const clientId = Number(form.client_id);
    if (!Number.isFinite(clientId) || clientId <= 0) {
      showErrorToast("Client is required.");
      return;
    }
    if (!form.project_type || !isKnownProjectTypeCode(form.project_type, activeProjectTypes)) {
      showErrorToast("Please select a valid project type.");
      return;
    }
    const accountManagerEmail = normalizePickerEmail(form.account_manager_email);
    if (!accountManagerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountManagerEmail)) {
      showErrorToast("Select a valid account manager.");
      return;
    }
    const startDate = normalizeToApiDate(form.start_date);
    const endDate = normalizeToApiDate(form.end_date);
    if (!startDate) {
      showErrorToast("Start date is required.");
      return;
    }
    if (!endDate) {
      showErrorToast("End date is required.");
      return;
    }
    if (startDate > endDate) {
      showErrorToast("Start date must be on or before end date.");
      return;
    }

    setLoading(true);
    try {
      const projectCode = generateAutomaticProjectCode();
      await hrmsService.createProject({
        project_code: projectCode,
        project_name: name,
        project_type: form.project_type,
        client_id: clientId,
        account_manager_email: accountManagerEmail,
        start_date: startDate,
        end_date: endDate,
      });

      setDmFields((prev) => ({
        ...prev,
        start_date: prev.start_date || form.start_date,
        end_date: prev.end_date || form.end_date,
      }));
      setPmFields((prev) => ({
        ...prev,
        start_date: prev.start_date || form.start_date,
        end_date: prev.end_date || form.end_date,
      }));

      const dmEmail = dmFields.email.trim() || form.delivery_manager_email.trim();
      const pmEmail = pmFields.email.trim();

      if (dmEmail) {
        await allocateManagerOnProject({
          email: dmEmail,
          fields: { ...dmFields, email: dmEmail },
          projectCode,
          projectStart: startDate,
          projectEnd: endDate,
          billingStatus: "BILLED",
        });
      }

      if (pmEmail) {
        await allocateManagerOnProject({
          email: pmEmail,
          fields: { ...pmFields, email: pmEmail },
          projectCode,
          projectStart: startDate,
          projectEnd: endDate,
          billingStatus: "BILLED",
        });
        try {
          await hrmsService.assignProjectManager({
            userEmail: pmEmail.trim().toLowerCase(),
            projectCode,
          });
        } catch {
          /* Requires active allocation */
        }
      }

      showSuccessToast("Project created successfully.");
      onCreated();
      onClose();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Could not create project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <WtFormDialog
      open={open}
      title="Create Project"
      description="Set project details, then assign delivery and project managers."
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel="Create Project"
      loading={loading}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-6">
        <FormSection title="Create Project">
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
              onChange={(value) => setForm((prev) => ({ ...prev, client_id: value }))}
              onClientSelected={(client) =>
                setForm((prev) => ({
                  ...prev,
                  client_id: String(client.id),
                  client_name: client.name,
                  account_manager_email: client.accountManagerEmail || prev.account_manager_email,
                  delivery_manager_email: client.deliveryManagerEmail || prev.delivery_manager_email,
                }))
              }
            />
            <InputField
              label="Start Date"
              required
              type="date"
              value={form.start_date}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, start_date: value }));
                setDmFields((prev) => ({ ...prev, start_date: prev.start_date || value }));
                setPmFields((prev) => ({ ...prev, start_date: prev.start_date || value }));
              }}
            />
            <InputField
              label="End Date"
              required
              type="date"
              value={form.end_date}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, end_date: value }));
                setDmFields((prev) => ({ ...prev, end_date: prev.end_date || value }));
                setPmFields((prev) => ({ ...prev, end_date: prev.end_date || value }));
              }}
            />
            <AccountManagerSelect
              required
              value={form.account_manager_email}
              onChange={(value) => setForm((prev) => ({ ...prev, account_manager_email: value }))}
            />
            <ProjectTypeSelect
              required
              activeOnly
              enabled={enabled}
              value={form.project_type}
              onChange={(value) => setForm((prev) => ({ ...prev, project_type: value }))}
            />
          </div>
        </FormSection>

        <ManagerAllocationFields
          title="Delivery Manager"
          state={dmFields}
          onChange={setDmFields}
          allocationPercentOptions={allocationPercentOptions}
          enabled={enabled}
          percentDesignation="Delivery Manager"
        />

        <ManagerAllocationFields
          title="Project Manager"
          state={pmFields}
          onChange={setPmFields}
          allocationPercentOptions={allocationPercentOptions}
          enabled={enabled}
          percentDesignation="Project Manager"
        />
      </div>
    </WtFormDialog>
  );
}
