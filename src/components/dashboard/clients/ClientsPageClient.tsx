"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { InputField } from "@/components/dashboard/ui/forms";
import { AccountManagerSelect } from "@/components/allocation/AccountManagerSelect";
import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { UI_COPY } from "@/constants/uiCopy";
import { useClients, useInvalidateClients } from "@/hooks/clients/useClients";
import { hrmsService } from "@/services/hrms.service";
import {
  createEmptyClientForm,
  type ClientFormState,
  type ClientRecord,
} from "@/types/client";
import { clientToFormState } from "@/utils/client";
import { FORM_FIELD_CLASS } from "@/components/dashboard/ui/uiLayout";

function displayPerson(name: string | null | undefined, email: string | null | undefined) {
  if (name && email) return `${name} (${email})`;
  return name || email || "—";
}

export function ClientsPageClient() {
  const { user, status: authStatus } = useAuth();
  const roles = user?.roles ?? [];
  const canView = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const canEdit = canView;
  const queriesEnabled = authStatus === "authenticated" && canView;

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientFormState>(createEmptyClientForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: clients = [], isLoading, isError, refetch } = useClients({
    enabled: queriesEnabled,
    search: search.trim() || undefined,
    includeProjects: true,
  });
  const invalidateClients = useInvalidateClients();

  if (authStatus !== "loading" && !canView) {
    return (
      <DashboardPageShell>
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 shadow-sm">
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="mt-2 text-sm text-wt-text-muted">
            Clients are available to HR and admin only.
          </p>
          <Link
            href={DASHBOARD_ROUTES.overview}
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Back to overview
          </Link>
        </div>
      </DashboardPageShell>
    );
  }

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyClientForm());
    setMessage(null);
    setError(null);
  }

  function startEdit(client: ClientRecord) {
    setEditingId(client.id);
    setForm(clientToFormState(client));
    setMessage(null);
    setError(null);
  }

  async function handleSubmit() {
    const name = form.name.trim();
    if (!name) {
      setError("Client name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
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

      if (editingId) {
        await hrmsService.updateClient(editingId, payload);
        setMessage("Client updated.");
      } else {
        await hrmsService.createClient(payload);
        setMessage("Client created.");
      }
      invalidateClients();
      await refetch();
      if (!editingId) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardPageShell>
      <div className="space-y-6">
        <div className="rounded-xl border border-wt-border bg-wt-surface-1 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-wt-border px-5 py-5 md:px-7">
            <div>
              <h3 className="text-lg font-semibold">Clients</h3>
              <p className="mt-1 text-sm text-wt-text-muted">
                Manage client records used when creating projects.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-52 max-w-full rounded-xl border border-wt-border bg-wt-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Search clients"
                aria-label="Search clients"
              />
              <Button
                variant="brand"
                size="sm"
                type="button"
                className="px-4 py-2 text-sm"
                disabled={isLoading}
                onClick={() => void refetch()}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="space-y-6 p-5 md:p-7">
            {isError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                Could not load clients.
              </div>
            ) : null}

            {isLoading && !clients.length ? (
              <TableRowsSkeleton rows={6} columns={5} />
            ) : (
              <ScrollableTable>
                <WtTable className="wt-scrollable-table">
                  <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Client Name</TableHead>
                      <TableHead>SPOC (External)</TableHead>
                      <TableHead>POC (Internal)</TableHead>
                      <TableHead>Account Manager</TableHead>
                      <TableHead>Delivery Manager</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Status</TableHead>
                      {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.length ? (
                      clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>
                            {displayPerson(client.spocExternalName, client.spocExternalEmail)}
                          </TableCell>
                          <TableCell>
                            {displayPerson(client.pocInternalName, client.pocInternalEmail)}
                          </TableCell>
                          <TableCell>
                            {displayPerson(client.accountManagerName, client.accountManagerEmail)}
                          </TableCell>
                          <TableCell>
                            {displayPerson(client.deliveryManagerName, client.deliveryManagerEmail)}
                          </TableCell>
                          <TableCell>{client.projectCount}</TableCell>
                          <TableCell>{client.isActive ? "Active" : "Inactive"}</TableCell>
                          {canEdit ? (
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(client)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={canEdit ? 8 : 7} className="text-center text-sm text-wt-text-muted">
                          {UI_COPY.noRecordsFound}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </WtTable>
              </ScrollableTable>
            )}
          </div>
        </div>

        {canEdit ? (
          <FormSection
            title={editingId ? "Edit Client" : "Create Client"}
            description="Each client can have multiple projects. Projects must reference a client when created."
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
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, is_active: e.target.value === "active" }))
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

            {error ? (
              <p className="mt-4 text-sm text-rose-600" role="alert">
                {error}
              </p>
            ) : null}
            {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="brand" type="button" disabled={saving} onClick={() => void handleSubmit()}>
                {saving ? UI_COPY.saving : editingId ? UI_COPY.saveChanges : "Create Client"}
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" disabled={saving} onClick={resetForm}>
                  {UI_COPY.cancel}
                </Button>
              ) : null}
              <Link
                href={DASHBOARD_ROUTES.allocation}
                className="inline-flex items-center text-sm text-blue-600 hover:underline"
              >
                Go to Projects Allocation
              </Link>
            </div>
          </FormSection>
        ) : null}
      </div>
    </DashboardPageShell>
  );
}
