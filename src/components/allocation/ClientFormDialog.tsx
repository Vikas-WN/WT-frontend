"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InputField } from "@/components/dashboard/ui/forms";
import { AccountManagerSelect } from "@/components/allocation/AccountManagerSelect";
import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { FORM_FIELD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { UI_COPY } from "@/constants/uiCopy";
import { hrmsService } from "@/services/hrms.service";
import {
  createEmptyClientForm,
  type ClientFormState,
  type ClientRecord,
} from "@/types/client";
import { clientToFormState } from "@/utils/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

export function ClientFormDialog({
  open,
  editingClient,
  onClose,
  onSaved,
}: {
  open: boolean;
  editingClient: ClientRecord | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<ClientFormState>(createEmptyClientForm());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(createEmptyClientForm());
      setLoading(false);
      return;
    }
    setForm(editingClient ? clientToFormState(editingClient) : createEmptyClientForm());
  }, [open, editingClient]);

  async function handleSubmit() {
    const name = form.name.trim();
    if (!name) {
      showErrorToast("Client name is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        spoc_external_name: form.spoc_external_name.trim() || null,
        spoc_external_email: form.spoc_external_email.trim() || null,
        spoc_external_phone: form.spoc_external_phone.trim() || null,
        poc_internal_email: form.poc_internal_email.trim() || null,
        account_manager_email: form.account_manager_email.trim() || null,
        delivery_manager_email: form.delivery_manager_email.trim() || null,
        is_active: form.is_active,
      };

      if (editingClient) {
        await hrmsService.updateClient(editingClient.id, payload);
        showSuccessToast("Client updated.");
      } else {
        await hrmsService.createClient(payload);
        showSuccessToast("Client created.");
      }
      await onSaved();
      onClose();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Could not save client.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <WtFormDialog
      open={open}
      title={editingClient ? "Edit Client" : "Create Client"}
      description="Each client can have multiple projects. Projects must reference a client when created."
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel={editingClient ? UI_COPY.saveChanges : "Create Client"}
      loading={loading}
      maxWidthClass="max-w-3xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Client Name"
          required
          value={form.name}
          onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
        />
        <label className={FORM_FIELD_CLASS}>
          <span className="text-xs font-medium text-wt-text-muted">Status</span>
          <select
            className="mt-1 w-full rounded-xl border border-wt-border bg-wt-surface-2 px-3 py-2 text-sm"
            value={form.is_active ? "active" : "inactive"}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_active: event.target.value === "active" }))
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <InputField
          label="SPOC Name"
          value={form.spoc_external_name}
          onChange={(value) => setForm((prev) => ({ ...prev, spoc_external_name: value }))}
        />
        <InputField
          label="SPOC Email"
          value={form.spoc_external_email}
          onChange={(value) => setForm((prev) => ({ ...prev, spoc_external_email: value }))}
        />
        <InputField
          label="SPOC Phone"
          value={form.spoc_external_phone}
          onChange={(value) => setForm((prev) => ({ ...prev, spoc_external_phone: value }))}
        />
        <InternalEmployeeSelect
          label="POC (Internal)"
          value={form.poc_internal_email}
          onChange={(value) => setForm((prev) => ({ ...prev, poc_internal_email: value }))}
        />
        <AccountManagerSelect
          value={form.account_manager_email}
          onChange={(value) => setForm((prev) => ({ ...prev, account_manager_email: value }))}
        />
        <InternalEmployeeSelect
          label="Delivery Manager"
          value={form.delivery_manager_email}
          onChange={(value) => setForm((prev) => ({ ...prev, delivery_manager_email: value }))}
        />
      </div>
      <Link
        href={DASHBOARD_ROUTES.allocation}
        className="mt-4 inline-flex text-sm text-blue-600 hover:underline"
      >
        Go to Projects Allocation
      </Link>
    </WtFormDialog>
  );
}
