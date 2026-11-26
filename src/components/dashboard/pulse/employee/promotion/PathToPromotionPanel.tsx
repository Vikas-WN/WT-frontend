"use client";

import { TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { BandJourney } from "@/components/dashboard/pulse/employee/promotion/BandJourney";
import { DesignationKpiCard } from "@/components/dashboard/pulse/employee/promotion/DesignationKpiCard";
import { Button } from "@/components/ui/button";
import { NEXT_BAND_KPIS_COPY as COPY } from "@/constants/nextBandKpis";
import { useNextBandKpis } from "@/hooks/career/useNextBandKpis";

/** Pulse tab: the KPIs of the employee's next band, so they know what to work towards for a promotion. */
export function PathToPromotionPanel() {
  const { data, isLoading, isError, refetch } = useNextBandKpis();

  if (isLoading) return <SectionLoading label={COPY.loading} />;

  if (isError || !data) {
    return (
      <EmptyState
        title={COPY.errorTitle}
        description={COPY.errorDescription}
        icon={<TrendingUp className="size-6" />}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            {COPY.retry}
          </Button>
        }
      />
    );
  }

  if (data.next_band_designations.length === 0) {
    return (
      <EmptyState
        title={COPY.emptyTitle}
        description={data.message ?? COPY.emptyFallback}
        icon={<TrendingUp className="size-6" />}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-wt-text">{COPY.heading}</h3>
        <p className="mt-1 max-w-3xl text-sm text-wt-text-muted">{COPY.intro}</p>
      </div>
      <BandJourney data={data} />
      <div className="space-y-4">
        {data.next_band_designations.map((group) => (
          <DesignationKpiCard key={group.designation} group={group} />
        ))}
      </div>
    </div>
  );
}
