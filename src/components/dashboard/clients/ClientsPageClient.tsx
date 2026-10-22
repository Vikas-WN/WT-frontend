"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
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
import { SegmentedTabs } from "@/components/dashboard/ui/SegmentedTabs";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS as SHARED_PAGE_SIZE_OPTIONS,
} from "@/hooks/useClientPagination";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { ClientDetailDialog } from "@/components/dashboard/clients/ClientDetailDialog";
import { useClientsPage } from "@/hooks/clients/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ClientRecord } from "@/types/client";

type StatusFilter = "all" | "active" | "inactive";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PAGE_SIZE_OPTIONS = SHARED_PAGE_SIZE_OPTIONS;

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
              key={project.projectCode || project.projectName}
              title={project.projectName}
              className="inline-flex max-w-[9rem] truncate rounded-md bg-wt-surface-2 px-1.5 py-0.5 text-[11px] text-wt-text-muted"
            >
              {project.projectName || project.projectCode}
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

function StatCard({ label, value, note, tone = "neutral" }: { label: string; value: number; note: string; tone?: "neutral" | "good" | "warn" }) {
  return (
    <div className={cn("rounded-xl border bg-wt-surface-1 px-5 py-4", tone === "warn" ? "border-amber-300/60" : "border-wt-border")}>
      <p className={cn("text-sm", tone === "warn" ? "text-amber-800" : "text-wt-text-muted")}>{label}</p>
      <p className="mt-1 text-[2rem] font-bold leading-none tracking-tight tabular-nums text-wt-text">{value}</p>
      <p className={cn("mt-2 text-sm font-semibold", tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-800" : "font-normal text-wt-text-muted")}>{note}</p>
    </div>
  );
}

function ClientAvatar({ name }: { name: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-wt-surface-3 text-xs font-semibold uppercase text-wt-text-muted" aria-hidden>
      {name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2) || "?"}
    </span>
  );
}

export function ClientsPageClient() {
  const { user, status: authStatus } = useAuth();
  const roles = user?.roles ?? [];
  const canView = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const queriesEnabled = authStatus === "authenticated" && canView;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter, pageSize]);

  const { data, isLoading, isError, refetch, isFetching } = useClientsPage({
    enabled: queriesEnabled,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    includeProjects: true,
    page,
    size: pageSize,
  });
  const clients = data?.items ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(data?.totalPages ?? 1, 1);
  const summary = data?.summary;
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);

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

  return (
    <DashboardPageShell className="wt-detail-page">
      <ManagementListCard
        density="compact"
        aboveCard={
          !isLoading && !isError && summary ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Clients" value={summary.total} note={summary.inactive === 0 ? "All active" : `${summary.active} active`} tone={summary.inactive === 0 ? "good" : "neutral"} />
              <StatCard label="With linked projects" value={summary.withProjects} note={`${summary.total ? Math.round((summary.withProjects / summary.total) * 100) : 0}% of clients`} />
              <StatCard label="Inactive" value={summary.inactive} note={summary.inactive === 0 ? "None" : "Review"} tone={summary.inactive === 0 ? "neutral" : "warn"} />
            </div>
          ) : null
        }
        title="Clients"
        description="Client accounts, who owns them, and which projects they're linked to."
        headerAction={
          <RefreshIconButton onClick={() => void refetch()} loading={isLoading || isFetching} />
        }
        search={
          <SearchInput
            id="clients-search"
            value={search}
            onChange={setSearch}
            placeholder="Search by client name"
            aria-label="Search clients"
            className="h-9 border-wt-border bg-wt-surface-1 shadow-sm"
          />
        }
        filters={
          <SegmentedTabs value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)} options={STATUS_FILTER_OPTIONS} label="Filter by status" />
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


        <ManagementListContent
          isLoading={isLoading && !clients.length}
          isEmpty={!isError && !clients.length}
          emptyTitle="No clients to show"
          emptyDescription={
            search.trim() || statusFilter !== "all"
              ? "Try adjusting your search or status filter."
              : "Clients will appear here once synced from the catalog."
          }
          emptyIcon={<Building2 className="size-5" aria-hidden />}
          skeletonRows={8}
          skeletonColumns={5}
        >
          <div className="wt-detail-scroll-section min-h-0">
            <ScrollableTable
              scrollChain
              maxHeightClass="max-h-[min(68vh,640px)]"
            >
              <WtTable className="w-full text-sm">
                <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Client</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Account Manager</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Delivery Manager</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Projects</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow
                      key={String(client.id)}
                      className="cursor-pointer transition hover:bg-blue-50/40 dark:hover:bg-wt-surface-2"
                      onClick={() => setSelectedClient(client)}
                    >
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <div className="flex min-w-0 max-w-[16rem] items-center gap-3">
                          <ClientAvatar name={client.name} />
                          <div className="min-w-0">
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
                        </div>
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
                        <span className={cn("inline-flex items-center gap-2 text-sm font-semibold", client.isActive ? "text-emerald-700" : "text-wt-text-muted")}>
                          <span className={cn("size-1.5 rounded-full", client.isActive ? "bg-emerald-600" : "bg-wt-text-faint")} aria-hidden />
                          {client.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </WtTable>
            </ScrollableTable>
          </div>

          {totalItems > 0 ? (
            <ListPagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
              loading={isFetching}
              className="mt-3"
            />
          ) : null}
        </ManagementListContent>
      </ManagementListCard>
      <ClientDetailDialog
        open={Boolean(selectedClient)}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
      />
    </DashboardPageShell>
  );
}
