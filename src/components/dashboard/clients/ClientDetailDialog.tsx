"use client";

import { useMemo } from "react";
import { Briefcase, MapPin } from "lucide-react";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
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
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { WtStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { useClientOpportunities } from "@/hooks/clients/useClientOpportunities";
import { formatApiDateDisplay } from "@/utils/apiDate";
import { formatOpportunityLabel } from "@/utils/opportunity";
import { cn } from "@/lib/utils";
import type { ClientRecord } from "@/types/client";
import type { OpportunityRecord } from "@/types/opportunity";

function DetailLine({
  label,
  value,
  secondary,
}: {
  label: string;
  value?: string | null;
  secondary?: string | null;
}) {
  if (!value && !secondary) return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-muted">{label}</p>
      {value ? <p className="mt-0.5 font-medium text-wt-text">{value}</p> : null}
      {secondary ? (
        <p className="truncate text-xs text-wt-text-muted" title={secondary}>
          {secondary}
        </p>
      ) : null}
    </div>
  );
}

function DetailBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-wt-border bg-wt-surface-2/50 p-4", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-wt-text-muted">{title}</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function OpportunityStatus({ status }: { status: string | null }) {
  if (!status) return <span className="text-wt-text-muted">—</span>;
  const key = status.trim().toLowerCase();
  const tone =
    key === "open" ? "info" : key === "won" ? "success" : key === "lost" ? "danger" : "neutral";
  return (
    <Badge variant="secondary" className={filledBadgeClass(tone)}>
      {formatOpportunityLabel(status)}
    </Badge>
  );
}

export function ClientDetailDialog({
  open,
  client,
  onClose,
}: {
  open: boolean;
  client: ClientRecord | null;
  onClose: () => void;
}) {
  const clientId = client ? String(client.id) : null;
  const opportunitiesQ = useClientOpportunities({
    clientId,
    enabled: open && Boolean(clientId),
  });

  const opportunities = useMemo(() => opportunitiesQ.data?.items ?? [], [opportunitiesQ.data]);
  const projects = client?.projects ?? [];

  return (
    <WtFormDialog
      open={open && Boolean(client)}
      title={client?.name ?? "Client Details"}
      description="Client details and opportunities associated with this client."
      onClose={onClose}
      maxWidthClass="max-w-5xl"
    >
      {client ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <WtStatusBadge tone={client.isActive ? "success" : "neutral"}>
              {client.isActive ? "Active" : "Inactive"}
            </WtStatusBadge>
            {client.projectCount ? (
              <Badge variant="secondary" className={cn(filledBadgeClass("info"), "tabular-nums")}>
                <Briefcase className="mr-1 size-3.5" aria-hidden />
                {client.projectCount} {client.projectCount === 1 ? "project" : "projects"}
              </Badge>
            ) : null}
            {client.address ? (
              <span className="inline-flex items-center gap-1 text-sm text-wt-text-muted">
                <MapPin className="size-4" aria-hidden />
                <span className="truncate" title={client.address}>
                  {client.address}
                </span>
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DetailBlock title="Account Manager">
              <DetailLine
                label="Name"
                value={client.accountManagerName || client.accountManagerEmail}
              />
              {client.accountManagerEmail ? (
                <DetailLine label="Email" value={client.accountManagerEmail} />
              ) : null}
            </DetailBlock>
            <DetailBlock title="Delivery Manager">
              <DetailLine
                label="Name"
                value={client.deliveryManagerName || client.deliveryManagerEmail}
              />
              {client.deliveryManagerEmail ? (
                <DetailLine label="Email" value={client.deliveryManagerEmail} />
              ) : null}
            </DetailBlock>
            <DetailBlock title="Project Manager">
              <DetailLine
                label="Name"
                value={client.projectManagerName || client.projectManagerEmail}
              />
              {client.projectManagerEmail ? (
                <DetailLine label="Email" value={client.projectManagerEmail} />
              ) : null}
            </DetailBlock>
            <DetailBlock title="Point of Contact">
              <DetailLine label="Internal" value={client.pocInternalName} secondary={client.pocInternalEmail} />
              <DetailLine
                label="External (SPOC)"
                value={client.spocExternalName}
                secondary={
                  client.spocExternalEmail && client.spocExternalPhone
                    ? `${client.spocExternalEmail} · ${client.spocExternalPhone}`
                    : client.spocExternalEmail || client.spocExternalPhone
                }
              />
            </DetailBlock>
          </div>

          <DetailBlock title="Projects">
            {projects.length ? (
              projects.map((project) => (
                <div key={project.projectCode || project.projectName}>
                  <p className="font-medium text-wt-text">{project.projectName || project.projectCode}</p>
                  <p className="text-xs text-wt-text-muted">
                    {project.projectCode}
                    {project.isActive ? " · Active" : " · Inactive"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-wt-text-muted sm:col-span-2">
                No projects are currently linked to this client.
              </p>
            )}
          </DetailBlock>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-wt-text">Opportunities</h3>
              {!opportunitiesQ.isLoading && !opportunitiesQ.isError ? (
                <p className="text-xs text-wt-text-muted tabular-nums">
                  {opportunities.length} opportunity{opportunities.length === 1 ? "" : "ies"}
                </p>
              ) : null}
            </div>
            <div className="overflow-hidden rounded-xl border border-wt-border">
              {opportunitiesQ.isLoading ? (
                <TableRowsSkeleton rows={4} columns={6} />
              ) : opportunitiesQ.isError ? (
                <div className="p-5 text-sm text-rose-800">
                  Could not load opportunities for this client.
                </div>
              ) : !opportunities.length ? (
                <EmptyState
                  title="No opportunities"
                  description="No opportunities are currently linked to this client."
                  icon={<Briefcase className="size-5" aria-hidden />}
                />
              ) : (
                <ScrollableTable maxHeightClass="max-h-[min(45vh,400px)]">
                  <WtTable className="w-full text-sm">
                    <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Opportunity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Domain</TableHead>
                        <TableHead>Business Type</TableHead>
                        <TableHead>Billing</TableHead>
                        <TableHead>Tech</TableHead>
                        <TableHead className="text-right">Probability</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Project</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opportunities.map((opp: OpportunityRecord) => (
                        <TableRow key={opp.id}>
                          <TableCell className="align-top">
                            <div className="min-w-0 max-w-[16rem]">
                              <p className="font-medium text-wt-text">{opp.opportunityName}</p>
                              {opp.oppId ? (
                                <p className="text-[11px] text-wt-text-faint">{opp.oppId}</p>
                              ) : null}
                              {opp.description ? (
                                <p className="mt-0.5 line-clamp-2 text-xs text-wt-text-muted">
                                  {opp.description}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">
                            <OpportunityStatus status={opp.currentStatus} />
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">
                            {opp.domain || "—"}
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">
                            {opp.businessType || "—"}
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">
                            {opp.billingType || "—"}
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">
                            {opp.techType || "—"}
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap text-right tabular-nums">
                            {opp.probabilityPercent != null ? `${opp.probabilityPercent}%` : "—"}
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">
                            {opp.location || "—"}
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">
                            {opp.projectStartDate || opp.projectEndDate
                              ? [
                                  formatApiDateDisplay(opp.projectStartDate ?? "") || "?",
                                  formatApiDateDisplay(opp.projectEndDate ?? "") || "Open",
                                ].join(" → ")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </WtTable>
                </ScrollableTable>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </WtFormDialog>
  );
}
