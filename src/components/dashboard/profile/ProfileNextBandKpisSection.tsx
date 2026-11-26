"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import {
  PROFILE_TABLE_BODY_CELL,
  PROFILE_TABLE_CLASS,
  PROFILE_TABLE_HEAD_CELL,
  PROFILE_TABLE_SCROLL,
} from "@/components/dashboard/profile/profileTableStyles";
import { NEXT_BAND_KPIS_COPY as COPY } from "@/constants/nextBandKpis";
import { useNextBandKpis } from "@/hooks/career/useNextBandKpis";
import type { NextBandDesignationKpis, NextBandKpisData } from "@/types/nextBandKpis";

function orDash(value: string | null | undefined): string {
  return value?.trim() || COPY.notSet;
}

function BandSummary({ data }: { data: NextBandKpisData }) {
  return (
    <p className="mb-4 text-sm text-wt-text-muted">
      {COPY.currentLabel}: <span className="font-medium text-wt-text">{orDash(data.current_band)}</span>
      {" · "}
      {orDash(data.department)}
      {" · "}
      {orDash(data.current_designation)}
      {" → "}
      {COPY.nextLabel}: <span className="font-medium text-wt-text">{orDash(data.next_band)}</span>
    </p>
  );
}

function DesignationKpiTable({ group }: { group: NextBandDesignationKpis }) {
  return (
    <div className="mb-5 last:mb-0">
      <h5 className="mb-2 text-sm font-medium text-wt-text">{group.designation}</h5>
      <div className={PROFILE_TABLE_SCROLL}>
        <WtTable className={PROFILE_TABLE_CLASS}>
          <TableHeader className="bg-wt-surface-1 [&_tr]:border-b">
            <TableRow className="hover:bg-transparent">
              <TableHead className={PROFILE_TABLE_HEAD_CELL}>{COPY.kpiColumn}</TableHead>
              <TableHead className={PROFILE_TABLE_HEAD_CELL}>{COPY.weightageColumn}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.kpis.map((kpi) => (
              <TableRow key={kpi.kpi_name}>
                <TableCell className={PROFILE_TABLE_BODY_CELL}>{kpi.kpi_name}</TableCell>
                <TableCell className={`${PROFILE_TABLE_BODY_CELL} whitespace-nowrap`}>
                  {`${Number(kpi.weightage)}%`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </WtTable>
      </div>
    </div>
  );
}

export function ProfileNextBandKpisSection({
  empId,
  enabled = true,
}: {
  /** Omit to show the signed-in employee's own KPIs. */
  empId?: string;
  enabled?: boolean;
}) {
  const { data, isLoading, isError, refetch } = useNextBandKpis({ empId, enabled });

  return (
    <div className="mt-8 border-t border-wt-border pt-6">
      <h4 className="mb-1 text-sm font-semibold text-wt-text">{COPY.title}</h4>
      {isLoading ? (
        <TableRowsSkeleton rows={3} columns={2} />
      ) : isError || !data ? (
        <EmptyState
          title={COPY.errorTitle}
          description={COPY.errorDescription}
          className="py-10"
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              {COPY.retry}
            </Button>
          }
        />
      ) : data.next_band_designations.length === 0 ? (
        <EmptyState
          title={COPY.emptyTitle}
          description={data.message ?? COPY.emptyFallback}
          className="py-10"
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-wt-text-muted">{COPY.intro}</p>
          <BandSummary data={data} />
          {data.next_band_designations.map((group) => (
            <DesignationKpiTable key={group.designation} group={group} />
          ))}
        </>
      )}
    </div>
  );
}
