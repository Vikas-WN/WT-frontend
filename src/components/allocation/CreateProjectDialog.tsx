"use client";

import { useEffect, useState } from "react";
import { InputField } from "@/components/dashboard/ui/forms";
import { AccountManagerSelect } from "@/components/allocation/AccountManagerSelect";
import { ClientSelect } from "@/components/allocation/ClientSelect";
import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";
import { InternalEmployeesMultiSelect } from "@/components/allocation/InternalEmployeesMultiSelect";
import { ProjectTypeSelect } from "@/components/allocation/ProjectTypeSelect";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { hrmsService } from "@/services/hrms.service";
import { todayApiDate } from "@/utils/apiDate";
import {
  createEmptyProjectForm,
  type ProjectFormState,
} from "@/utils/allocationFormState";
import { generateAutomaticProjectCode } from "@/utils/dashboard/validation";
import { isKnownProjectTypeCode } from "@/utils/projectTypes";
import { normalizePickerEmail } from "@/utils/learning/onboardOptions";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

import type { ProjectTypeRow } from "@/types/projectType";

export function CreateProjectDialog({
  open,
  onClose,
  onCreated,
  activeProjectTypes,
  enabled,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  activeProjectTypes: ProjectTypeRow[];
  enabled: boolean;
}) {
  const [form, setForm] = useState<ProjectFormState>(createEmptyProjectForm());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(createEmptyProjectForm());
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
    const startDate = form.start_date.trim();
    const endDate = form.end_date.trim();
    if (startDate && endDate && startDate > endDate) {
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
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      });

      const managerEmails = form.project_manager_emails
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      const allocationStart = startDate || todayApiDate();

      for (const email of managerEmails) {
        try {
          await hrmsService.createAllocation({
            employeeEmail: email,
            projectCode,
            role: "Project Manager",
            allocatedPercent: 100,
            startDate: allocationStart,
            endDate: endDate || null,
            allocationType: "DEPLOYABLE",
            billingStatus: "BILLED",
          });
        } catch {
          /* Employee may already be allocated on this project */
        }
        try {
          await hrmsService.assignProjectManager({ userEmail: email, projectCode });
        } catch {
          /* Assign requires an active allocation */
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
      description="Link a client, set managers, and optionally pre-select project managers to allocate."
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel="Create Project"
      loading={loading}
      maxWidthClass="max-w-3xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Project Name"
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
        <AccountManagerSelect
          required
          value={form.account_manager_email}
          onChange={(value) => setForm((prev) => ({ ...prev, account_manager_email: value }))}
        />
        <InternalEmployeeSelect
          label="Delivery Manager"
          value={form.delivery_manager_email}
          onChange={(value) => setForm((prev) => ({ ...prev, delivery_manager_email: value }))}
        />
        <ProjectTypeSelect
          required
          activeOnly
          enabled={enabled}
          value={form.project_type}
          onChange={(value) => setForm((prev) => ({ ...prev, project_type: value }))}
        />
        <InputField
          label="Start Date"
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
        <div className="sm:col-span-2">
          <InternalEmployeesMultiSelect
            label="Project Managers"
            value={form.project_manager_emails}
            onChange={(emails) => setForm((prev) => ({ ...prev, project_manager_emails: emails }))}
            placeholder="Search and select project managers…"
          />
          <p className="mt-2 text-xs text-wt-text-muted">
            Selected managers are allocated on this project and assigned the project manager role when possible.
          </p>
        </div>
      </div>
    </WtFormDialog>
  );
}
