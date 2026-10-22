"use client";

import { useQuery } from "@tanstack/react-query";
import { Laptop, Package, RefreshCw } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { Button } from "@/components/ui/button";
import { hrmsService } from "@/services/hrms.service";
import { apiCollection } from "@/utils/apiCollection";
import type { AssetItem } from "@/types/asset";
import { ASSET_STATUS_TONE } from "@/utils/assetStatus";
import { cn } from "@/lib/utils";

export function MyAssetsPanel() {
  const query = useQuery({ queryKey: ["assets", "mine"], queryFn: async () => apiCollection<AssetItem>(await hrmsService.getMyAssets()), retry: 1 });
  const assets = query.data ?? [];
  return (
    <DashboardPageShell>
      <PageHero title="My assets" description="Your equipment, all in one place. Keep these details handy when you need support." eyebrow="Your workspace essentials" action={<Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw className="size-4" />Refresh</Button>} />
      {query.isPending ? <TableRowsSkeleton rows={3} columns={3} /> : query.isError ? <EmptyState title="We couldn't load your equipment" description="Please try again. Your assigned equipment hasn't changed." icon={<Package className="size-6" />} action={<Button variant="outline" onClick={() => void query.refetch()}>Try again</Button>} /> : assets.length === 0 ? <EmptyState title="No equipment assigned yet" description="Your company equipment will appear here once it is assigned to you." icon={<Laptop className="size-6" />} /> : (
        <>
          <p className="text-sm text-wt-text-muted">{assets.length} {assets.length === 1 ? "item" : "items"} assigned to you</p>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.filter((asset) => asset && typeof asset === "object").map((asset, index) => (
              <li key={asset.id ?? index} className="rounded-2xl border border-wt-border bg-wt-surface-1 p-6 shadow-[var(--wt-shadow-sm)]">
                <div className="flex items-start justify-between gap-3"><span className="grid size-12 place-items-center rounded-xl bg-wt-brand-soft text-wt-brand"><Laptop className="size-6" aria-hidden /></span><span className={cn("rounded-md px-2 py-1 text-xs font-medium", ASSET_STATUS_TONE[asset.status] ?? "bg-wt-surface-2 text-wt-text-muted")}>{asset.status === "ASSIGNED" ? "With you" : String(asset.status ?? "Assigned").replaceAll("_", " ")}</span></div>
                <h2 className="mt-5 font-[family-name:var(--font-brand)] text-lg font-semibold text-wt-text">{[asset.brand, asset.model].filter(Boolean).join(" ") || asset.category || "Company equipment"}</h2>
                <p className="mt-1 text-sm text-wt-text-muted">{asset.category ?? "Equipment"}</p>
                <dl className="mt-5 space-y-3 border-t border-wt-border pt-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt className="text-wt-text-muted">Asset tag</dt><dd className="font-medium text-wt-text">{asset.asset_tag ?? "—"}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-wt-text-muted">Serial number</dt><dd className="max-w-full break-all font-medium text-wt-text">{asset.serial_number || "Not recorded"}</dd></div></dl>
                {asset.notes ? <p className="mt-4 rounded-lg bg-wt-surface-2 p-3 text-xs leading-relaxed text-wt-text-muted">{asset.notes}</p> : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </DashboardPageShell>
  );
}
