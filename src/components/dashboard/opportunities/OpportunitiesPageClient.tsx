"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Briefcase, Building2, TrendingUp, Target, MapPin, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { hrmsService } from "@/services/hrms.service";
import { useQuery } from "@tanstack/react-query";
import { parseOpportunityList, parseOpportunityRow } from "@/utils/opportunity";
import { type OpportunityRecord } from "@/types/opportunity";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WT_TABLE_CELL_CLASS,
  WT_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { formatApiDateDisplay } from "@/utils/apiDate";
import { formatOpportunityLabel } from "@/utils/opportunity";
import { cn } from "@/lib/utils";

function formatOpportunityStatus(status: string | null): { label: string; tone: "success" | "info" | "warning" | "danger" | "neutral" } {
  if (!status) return { label: "—", tone: "neutral" };
  const key = status.trim().toLowerCase();
  if (key === "open" || key === "in progress") return { label: "Open", tone: "info" };
  if (key === "won" || key === "closed won") return { label: "Won", tone: "success" };
  if (key === "lost" || key === "closed lost") return { label: "Lost", tone: "danger" };
  if (key === "on hold" || key === "paused") return { label: "On Hold", tone: "warning" };
  return { label: formatOpportunityLabel(status), tone: "neutral" };
}

function StatusBadge({ status }: { status: string | null }) {
  const { label, tone } = formatOpportunityStatus(status);
  const toneClass = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  }[tone];

  return (
    <Badge variant="secondary" className={cn("gap-1", toneClass)}>
      {label}
    </Badge>
  );
}

interface ClientOpportunities {
  clientId: string;
  clientName: string;
  clientCode: string | undefined;
  accountManagerName: string | undefined;
  deliveryManagerName: string | undefined;
  opportunities: OpportunityRecord[];
}

interface RawClientWithOpportunities {
  clientId: string;
  clientName: string;
  clientCode: string | undefined;
  accountManagerName: string | undefined;
  deliveryManagerName: string | undefined;
  opportunities: OpportunityRecord[];
}

async function fetchAllOpportunities(): Promise<ClientOpportunities[]> {
  const res = await hrmsService.getAllClientsWithOpportunities();
  const payload = (res as { data?: unknown }).data ?? res;
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  const clients = Array.isArray(obj.items) ? obj.items : Array.isArray(obj) ? obj : [];

  const mapped = clients
    .map((client: unknown): RawClientWithOpportunities | null => {
      if (!client || typeof client !== "object") return null;
      const c = client as Record<string, unknown>;
      const clientId = String(c.id ?? c.client_id ?? c.clientId ?? "").trim();
      if (!clientId) return null;
      return {
        clientId,
        clientName: String(c.name ?? c.client_name ?? "").trim() || "Unknown Client",
        clientCode: c.code ? String(c.code).trim() : undefined,
        accountManagerName: c.accountManagerName ? String(c.accountManagerName).trim() : undefined,
        deliveryManagerName: c.deliveryManagerName ? String(c.deliveryManagerName).trim() : undefined,
        opportunities: Array.isArray(c.opportunities)
          ? c.opportunities
              .map((o: unknown) => parseOpportunityRow(o as Record<string, unknown>))
              .filter((o): o is OpportunityRecord => Boolean(o))
          : [],
      };
    })
    .filter((c): c is RawClientWithOpportunities => c !== null);

  return mapped;
}

function useAllClientOpportunities() {
  return useQuery({
    queryKey: ["opportunities", "all-clients"],
    queryFn: fetchAllOpportunities,
    staleTime: 60_000,
  });
}

export function OpportunitiesPageClient() {
  const { user } = useAuth();
  const { data: clientOpportunities = [], isLoading, isError, error, refetch } = useAllClientOpportunities();
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clientOpportunities;

    const query = searchQuery.toLowerCase();
    return clientOpportunities.filter((client) => {
      const clientMatch =
        client.clientName.toLowerCase().includes(query) ||
        client.clientCode?.toLowerCase().includes(query) ||
        client.accountManagerName?.toLowerCase().includes(query) ||
        client.deliveryManagerName?.toLowerCase().includes(query);

      if (clientMatch) return true;

      return client.opportunities.some(
        (opp) =>
          opp.opportunityName.toLowerCase().includes(query) ||
          opp.oppId?.toLowerCase().includes(query) ||
          opp.domain?.toLowerCase().includes(query) ||
          opp.businessType?.toLowerCase().includes(query) ||
          opp.location?.toLowerCase().includes(query),
      );
    });
  }, [clientOpportunities, searchQuery]);

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedClients.size === filteredClients.length) {
      setExpandedClients(new Set());
    } else {
      setExpandedClients(new Set(filteredClients.map((c) => c.clientId)));
    }
  };

  const totalOpportunities = useMemo(
    () => filteredClients.reduce((sum, c) => sum + c.opportunities.length, 0),
    [filteredClients],
  );

  if (isLoading) {
    return (
      <DashboardPageShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-wt-text">Opportunities</h1>
              <p className="mt-1 text-sm text-wt-text-muted">All client opportunities</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-6 w-24 bg-wt-surface-3 rounded" />
                <div className="h-6 w-24 bg-wt-surface-3 rounded" />
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 w-24 bg-wt-surface-3 rounded mb-2" />
                <div className="h-4 w-16 bg-wt-surface-3 rounded" />
              </Card>
            ))}
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  if (isError) {
    return (
      <DashboardPageShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-wt-text">Opportunities</h1>
              <p className="mt-1 text-sm text-wt-text-muted">All client opportunities</p>
            </div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-rose-800">Failed to load opportunities.</p>
            <p className="mt-2 text-sm text-rose-600">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-wt-text">Opportunities</h1>
            <p className="mt-1 text-sm text-wt-text-muted">
              {clientOpportunities.length} client{clientOpportunities.length !== 1 ? "s" : ""} ·
              {totalOpportunities} opportunity{totalOpportunities !== 1 ? "ies" : ""}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <input
                type="search"
                placeholder="Search clients, opportunities, domains…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm bg-wt-surface-1 border border-wt-border rounded-xl focus:border-[var(--wt-brand)] focus:ring-2 focus:ring-[var(--wt-brand)]/20 outline-none transition-colors"
              />
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wt-text-muted" aria-hidden />
            </div>
            <button
              onClick={toggleAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-wt-text bg-wt-surface-1 border border-wt-border rounded-xl hover:bg-wt-surface-2 transition-colors"
            >
              {expandedClients.size === filteredClients.length ? (
                <>
                  <ChevronDown className="size-4 rotate-180" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" />
                  Expand All
                </>
              )}
            </button>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No matching clients" : "No opportunities found"}
            description={searchQuery
              ? "Try adjusting your search query"
              : "No client opportunities are available at the moment."}
            icon={<Briefcase className="size-6" />}
          />
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => {
              const isExpanded = expandedClients.has(client.clientId);
              const oppCount = client.opportunities.length;
              const wonCount = client.opportunities.filter((o) =>
                ["won", "closed won"].includes((o.currentStatus ?? "").toLowerCase()),
              ).length;
              const openCount = client.opportunities.filter((o) =>
                ["open", "in progress"].includes((o.currentStatus ?? "").toLowerCase()),
              ).length;

              return (
                <Card
                  key={client.clientId}
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isExpanded ? "ring-1 ring-[var(--wt-brand)]/30" : "",
                  )}
                >
                  <CardHeader
                    className="cursor-pointer px-5 py-4 sm:px-6"
                    onClick={() => toggleClient(client.clientId)}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
                          <Building2 className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold truncate">
                              {client.clientName}
                            </CardTitle>
                            {client.clientCode && (
                              <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
                                {client.clientCode}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-wt-text-muted">
                            {client.accountManagerName && (
                              <span className="inline-flex items-center gap-1">
                                <Users className="size-3" />
                                AM: {client.accountManagerName}
                              </span>
                            )}
                            {client.deliveryManagerName && (
                              <span className="inline-flex items-center gap-1">
                                <Users className="size-3" />
                                DM: {client.deliveryManagerName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 text-sm text-wt-text-muted hidden sm:flex">
                          <span className="inline-flex items-center gap-1">
                            <TrendingUp className="size-3.5 text-green-600" />
                            {wonCount} Won
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Target className="size-3.5 text-blue-600" />
                            {openCount} Open
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="size-3.5" />
                            {oppCount} Total
                          </span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "size-5 text-wt-text-muted transition-transform duration-200 flex-shrink-0",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isExpanded ? "animate-expand" : "animate-collapse",
                    )}
                  >
                    <CardContent className="p-0">
                      <div className="border-t border-wt-border">
                        <div className="overflow-x-auto">
                          <WtTable className="w-full min-w-[900px]">
                            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className={WT_TABLE_HEAD_CLASS}>Opportunity</TableHead>
                                <TableHead className={WT_TABLE_HEAD_CLASS}>Status</TableHead>
                                <TableHead className={WT_TABLE_HEAD_CLASS}>Domain</TableHead>
                                <TableHead className={WT_TABLE_HEAD_CLASS}>Business Type</TableHead>
                                <TableHead className={WT_TABLE_HEAD_CLASS}>Billing</TableHead>
                                <TableHead className={WT_TABLE_HEAD_CLASS}>Tech</TableHead>
                                <TableHead className={cn(WT_TABLE_HEAD_CLASS, "text-right")}>Probability</TableHead>
                                <TableHead className={WT_TABLE_HEAD_CLASS}>Location</TableHead>
                                <TableHead className={WT_TABLE_HEAD_CLASS}>Project Dates</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {client.opportunities.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={9} className={cn(WT_TABLE_CELL_CLASS, "py-8 text-center text-wt-text-muted")}>
                                    No opportunities linked to this client.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                client.opportunities.map((opp) => (
                                  <TableRow key={opp.id}>
                                    <TableCell className={cn(WT_TABLE_CELL_CLASS, "max-w-[20rem]")}>
                                      <div className="min-w-0">
                                        <p className="font-medium text-wt-text truncate">{opp.opportunityName}</p>
                                        {opp.oppId && (
                                          <p className="text-[11px] text-wt-text-faint">{opp.oppId}</p>
                                        )}
                                        {opp.description && (
                                          <p className="mt-1 line-clamp-2 text-xs text-wt-text-muted">{opp.description}</p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className={WT_TABLE_CELL_CLASS}>
                                      <StatusBadge status={opp.currentStatus} />
                                    </TableCell>
                                    <TableCell className={WT_TABLE_CELL_CLASS}>{opp.domain || "—"}</TableCell>
                                    <TableCell className={WT_TABLE_CELL_CLASS}>{opp.businessType || "—"}</TableCell>
                                    <TableCell className={WT_TABLE_CELL_CLASS}>{opp.billingType || "—"}</TableCell>
                                    <TableCell className={WT_TABLE_CELL_CLASS}>{opp.techType || "—"}</TableCell>
                                    <TableCell className={cn(WT_TABLE_CELL_CLASS, "text-right tabular-nums")}>
                                      {opp.probabilityPercent != null ? `${opp.probabilityPercent}%` : "—"}
                                    </TableCell>
                                    <TableCell className={WT_TABLE_CELL_CLASS}>{opp.location || "—"}</TableCell>
                                    <TableCell className={WT_TABLE_CELL_CLASS}>
                                      {opp.projectStartDate || opp.projectEndDate ? (
                                        [
                                          opp.projectStartDate ? formatApiDateDisplay(opp.projectStartDate) : "?",
                                          opp.projectEndDate ? formatApiDateDisplay(opp.projectEndDate) : "Open",
                                        ].join(" → ")
                                      ) : (
                                        "—"
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </WtTable>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardPageShell>
  );
}