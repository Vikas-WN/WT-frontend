"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, FolderPlus, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import {
  WT_TABLE_CELL_COMPACT_CLASS,
  WT_TABLE_HEAD_COMPACT_CLASS,
} from "@/components/dashboard/ui/tableLayout";
import {
  ManagementListCard,
  ManagementListContent,
} from "@/components/dashboard/ui/ManagementListCard";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { ToolbarFilterSelect } from "@/components/dashboard/ui/ToolbarFilterSelect";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { WtStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { ClientFormDialog } from "@/components/allocation/ClientFormDialog";
import { AllocateProjectToClientDialog } from "@/components/allocation/AllocateProjectToClientDialog";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useClients, useInvalidateClients } from "@/hooks/clients/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isExternalClientId } from "@/utils/client";
import type { ClientRecord } from "@/types/client";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function PersonCell({
  name,
  email,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
}) {
  if (!name && !email) {
    return <span className="text-wt-text-muted">—</span>;
  }
  return (
    <div className="min-w-0 max-w-[11rem]">
      <p className="truncate font-medium text-wt-text">{name || email}</p>
      {name && email ? (
        <p className="truncate text-xs text-wt-text-muted" title={email}>
          {email}
        </p>
      ) : null}
    </div>
  );
}

function ProjectsCell({ client }: { client: ClientRecord }) {
  const projects = client.projects ?? [];
  if (!client.projectCount && !projects.length) {
    return <span className="text-wt-text-muted">—</span>;
  }

  const visible = projects.slice(0, 2);
  const remaining = Math.max(projects.length - visible.length, 0);

  return (
    <div className="flex min-w-[9rem] flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Badge
          variant="secondary"
          className={cn(filledBadgeClass("info"), "tabular-nums")}
        >
          {client.projectCount} {client.projectCount === 1 ? "project" : "projects"}
        </Badge>
      </div>
      {visible.length ? (
        <div className="flex flex-wrap gap-1">
          {visible.map((project) => (
            <span
              key={project.projectCode}
              title={project.projectName}
              className="inline-flex max-w-[9rem] truncate rounded-md bg-wt-surface-2 px-1.5 py-0.5 text-[11px] text-wt-text-muted"
            >
              {project.projectName}
            </span>
          ))}
          {remaining > 0 ? (
            <span className="inline-flex rounded-md bg-wt-surface-2 px-1.5 py-0.5 text-[11px] text-wt-text-muted">
              +{remaining}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-wt-border bg-wt-surface-2/60 px-3.5 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-wt-text">{value}</p>
    </div>
  );
}

export function ClientsPageClient() {
  const { user, status: authStatus } = useAuth();
  const roles = user?.roles ?? [];
  const canView = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const canEdit = canView;
  const queriesEnabled = authStatus === "authenticated" && canView;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [allocateClient, setAllocateClient] = useState<ClientRecord | null>(null);

  const { data: clients = [], isLoading, isError, refetch } = useClients({
    enabled: queriesEnabled,
    search: debouncedSearch.trim() || undefined,
    includeProjects: true,
  });
  const invalidateClients = useInvalidateClients();

  const filteredClients = useMemo(() => {
    if (statusFilter === "active") return clients.filter((c) => c.isActive);
    if (statusFilter === "inactive") return clients.filter((c) => !c.isActive);
    return clients;
  }, [clients, statusFilter]);

  const stats = useMemo(() => {
    const active = clients.filter((c) => c.isActive).length;
    const withProjects = clients.filter((c) => c.projectCount > 0).length;
    return {
      total: clients.length,
      active,
      inactive: clients.length - active,
      withProjects,
    };
  }, [clients]);

  if (authStatus !== "loading" && !canView) {
    return (
      <DashboardPageShell>
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 shadow-sm">
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="mt-2 text-sm text-wt-text-muted">
            Clients are available to HR and admin only.
          </p>
          <Link
            href={DASHBOARD_ROUTES.profile}
            className="mt-4 inline-block text-sm text-[var(--wt-brand)] hover:underline"
          >
            Back To Home
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
    <DashboardPageShell className="wt-detail-page">
      <ManagementListCard
        density="compact"
        title="Clients"
        description="Manage client masters and link projects to the right account."
        headerAction={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canEdit ? (
              <Button
                variant="brand"
                size="sm"
                type="button"
                className="h-9 gap-1.5 px-3.5"
                onClick={openCreateDialog}
              >
                <Plus className="size-4" aria-hidden />
                Create client
              </Button>
            ) : null}
            <RefreshIconButton onClick={() => void refetch()} loading={isLoading} />
          </div>
        }
        search={
          <SearchInput
            id="clients-search"
            value={search}
            onChange={setSearch}
            placeholder="Search by client or SPOC"
            aria-label="Search clients"
            className="h-9 border-wt-border bg-wt-surface-1 shadow-sm"
          />
        }
        filters={
          <ToolbarFilterSelect
            id="clients-status-filter"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            options={STATUS_FILTER_OPTIONS}
            placeholder="All statuses"
            aria-label="Filter by status"
            compact
          />
        }
      >
        {isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            <p>Could not load clients.</p>
            <Button
              variant="ghost"
              size="xs"
              type="button"
              className="mt-3 px-3 py-1.5 text-xs"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatChip label="Total" value={stats.total} />
            <StatChip label="Active" value={stats.active} />
            <StatChip label="Inactive" value={stats.inactive} />
            <StatChip label="With projects" value={stats.withProjects} />
          </div>
        ) : null}

        <ManagementListContent
          isLoading={isLoading && !clients.length}
          isEmpty={!isError && !filteredClients.length}
          emptyTitle="No clients to show"
          emptyDescription={
            search.trim() || statusFilter !== "all"
              ? "Try adjusting your search or status filter."
              : "Create a client to start linking projects."
          }
          emptyIcon={<Building2 className="size-5" aria-hidden />}
          skeletonRows={8}
          skeletonColumns={canEdit ? 7 : 6}
        >
          <div className="wt-detail-scroll-section min-h-0">
            <ScrollableTable
              scrollChain
              axis="y"
              maxHeightClass="max-h-[min(68vh,640px)]"
            >
              <WtTable className="w-full text-sm">
                <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Client</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>SPOC (External)</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Account Manager</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Delivery Manager</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Projects</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Status</TableHead>
                    {canEdit ? (
                      <TableHead className={cn(WT_TABLE_HEAD_COMPACT_CLASS, "text-right")}>
                        Actions
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const isExternal = isExternalClientId(client.id);
                    return (
                    <TableRow
                      key={String(client.id)}
                      className="transition hover:bg-blue-50/40 dark:hover:bg-wt-surface-2"
                    >
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <div className="min-w-0 max-w-[14rem]">
                          <p className="truncate font-semibold text-wt-text">{client.name}</p>
                          {client.address ? (
                            <p
                              className="mt-0.5 truncate text-xs text-wt-text-muted"
                              title={client.address}
                            >
                              {client.address}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-wt-text-faint">No address</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <PersonCell
                          name={client.spocExternalName}
                          email={client.spocExternalEmail}
                        />
                      </TableCell>
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <PersonCell
                          name={client.accountManagerName}
                          email={client.accountManagerEmail}
                        />
                      </TableCell>
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <PersonCell
                          name={client.deliveryManagerName}
                          email={client.deliveryManagerEmail}
                        />
                      </TableCell>
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <ProjectsCell client={client} />
                      </TableCell>
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <WtStatusBadge tone={client.isActive ? "success" : "neutral"}>
                          {client.isActive ? "Active" : "Inactive"}
                        </WtStatusBadge>
                      </TableCell>
                      {canEdit ? (
                        <TableCell
                          className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top text-right")}
                        >
                          <div className="inline-flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 px-2.5"
                              disabled={!client.isActive || isExternal}
                              title={
                                isExternal
                                  ? "Managed in WK Business"
                                  : client.isActive
                                  ? "Allocate project to this client"
                                  : "Activate the client before allocating projects"
                              }
                              onClick={() => setAllocateClient(client)}
                            >
                              <FolderPlus className="size-3.5" aria-hidden />
                              <span className="hidden lg:inline">Allocate</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 px-2.5"
                              title={isExternal ? "Managed in WK Business" : "Edit client"}
                              disabled={isExternal}
                              onClick={() => openEditDialog(client)}
                            >
                              <Pencil className="size-3.5" aria-hidden />
                              <span className="hidden lg:inline">Edit</span>
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                    );
                  })}
                </TableBody>
              </WtTable>
            </ScrollableTable>
          </div>
        </ManagementListContent>
      </ManagementListCard>

      {canEdit ? (
        <>
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
          <AllocateProjectToClientDialog
            open={Boolean(allocateClient)}
            client={allocateClient}
            onClose={() => setAllocateClient(null)}
            onSaved={async () => {
              invalidateClients();
              await refetch();
            }}
          />
        </>
      ) : null}
    </DashboardPageShell>
  );
}
