"use client";

import { useEffect, useState } from "react";
import { InputField, TextAreaField, SelectField } from "@/components/dashboard/ui/forms";
import { AccountManagerSelect } from "@/components/allocation/AccountManagerSelect";
import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { UI_COPY } from "@/constants/uiCopy";
import { hrmsService } from "@/services/hrms.service";
import {
  createEmptyClientForm,
  type ClientFormState,
  type ClientRecord,
} from "@/types/client";
import { clientToFormState } from "@/utils/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

function buildClientPayload(form: ClientFormState, editing: boolean) {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    address: form.address.trim() || null,
    spoc_external_name: form.spoc_external_name.trim() || null,
    spoc_external_email: form.spoc_external_email.trim() || null,
    spoc_external_phone: form.spoc_external_phone.trim() || null,
    is_active: form.is_active,
  };

  const accountManager = form.account_manager_email.trim();
  const deliveryManager = form.delivery_manager_email.trim();
  if (accountManager) payload.account_manager_email = accountManager;
  else if (!editing) payload.account_manager_email = null;

  if (deliveryManager) payload.delivery_manager_email = deliveryManager;
  else if (!editing) payload.delivery_manager_email = null;

  return payload;
}

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
    if (!editingClient && !form.account_manager_email.trim()) {
      showErrorToast("Please select an Account Manager before creating this client.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildClientPayload(form, Boolean(editingClient));

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
      description="Capture client details, external SPOC, and assigned managers."
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel={editingClient ? UI_COPY.saveChanges : "Create Client"}
      loading={loading}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-5">
        <FormSection
          title="Client Details"
          description="Primary identity used when creating projects."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Name"
              required
              value={form.name}
              onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
            />
            <SelectField
              label="Status"
              required
              value={form.is_active ? "ACTIVE" : "INACTIVE"}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, is_active: value === "ACTIVE" }))
              }
            />
            <div className="sm:col-span-2">
              <TextAreaField
                label="Address"
                value={form.address}
                onChange={(value) => setForm((prev) => ({ ...prev, address: value }))}
                placeholder="Street, city, state, postal code, country"
                rows={3}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="External SPOC"
          description="Optional client-side point of contact outside your organization."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="SPOC Name"
              value={form.spoc_external_name}
              onChange={(value) => setForm((prev) => ({ ...prev, spoc_external_name: value }))}
            />
            <InputField
              label="SPOC Email"
              type="email"
              value={form.spoc_external_email}
              onChange={(value) => setForm((prev) => ({ ...prev, spoc_external_email: value }))}
            />
            <InputField
              label="SPOC Phone Number"
              type="tel"
              value={form.spoc_external_phone}
              onChange={(value) => setForm((prev) => ({ ...prev, spoc_external_phone: value }))}
            />
          </div>
        </FormSection>

        <FormSection
          title="Account Leadership"
          description="Account manager and delivery manager assigned to this client."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AccountManagerSelect
              value={form.account_manager_email}
              onChange={(value) => setForm((prev) => ({ ...prev, account_manager_email: value }))}
              required
            />
            <InternalEmployeeSelect
              label="Delivery Manager"
              value={form.delivery_manager_email}
              onChange={(value) => setForm((prev) => ({ ...prev, delivery_manager_email: value }))}
              required
            />
          </div>
        </FormSection>
      </div>
    </WtFormDialog>
  );
}
