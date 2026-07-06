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
import { ClientFormDialog } from "@/components/allocation/ClientFormDialog";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { UI_COPY } from "@/constants/uiCopy";
import { useClients, useInvalidateClients } from "@/hooks/clients/useClients";
import type { ClientRecord } from "@/types/client";

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
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

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

  function openCreateDialog() {
    setEditingClient(null);
    setClientDialogOpen(true);
  }

  function openEditDialog(client: ClientRecord) {
    setEditingClient(client);
    setClientDialogOpen(true);
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
              {canEdit ? (
                <Button variant="brand" size="sm" type="button" className="px-4 py-2 text-sm" onClick={openCreateDialog}>
                  Create Client
                </Button>
              ) : null}
              <Button
                variant="outline"
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
                                onClick={() => openEditDialog(client)}
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
      </div>

      {canEdit ? (
        <ClientFormDialog
          open={clientDialogOpen}
          editingClient={editingClient}
          onClose={() => {
            setClientDialogOpen(false);
            setEditingClient(null);
          }}
          onSaved={async () => {
            invalidateClients();
            await refetch();
          }}
        />
      ) : null}
    </DashboardPageShell>
  );
}
