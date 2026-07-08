"use client";

import { useEffect, useState } from "react";
import { InputField } from "@/components/dashboard/ui/forms";
import { AccountManagerSelect } from "@/components/allocation/AccountManagerSelect";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
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
        spoc_external_email: null,
        spoc_external_phone: null,
        poc_internal_email: null,
        account_manager_email: form.account_manager_email.trim() || null,
        delivery_manager_email: null,
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
      description="Client name, secondary point of contact, and account manager."
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel={editingClient ? UI_COPY.saveChanges : "Create Client"}
      loading={loading}
      maxWidthClass="max-w-xl"
    >
      <div className="grid gap-4">
        <InputField
          label="Name"
          required
          value={form.name}
          onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
        />
        <InputField
          label="S. POC"
          value={form.spoc_external_name}
          onChange={(value) => setForm((prev) => ({ ...prev, spoc_external_name: value }))}
        />
        <AccountManagerSelect
          value={form.account_manager_email}
          onChange={(value) => setForm((prev) => ({ ...prev, account_manager_email: value }))}
        />
      </div>
    </WtFormDialog>
  );
}
