"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { hrmsService } from "@/services/hrms.service";
import type { AssetItem, AssetStatus } from "@/types/asset";
import { cn } from "@/lib/utils";

type Load<T> = { status: "loading" | "done" | "error"; data: T | null };

/** File-local copy of the small async-fetch hook used across dashboard
 *  pages — see HomePageClient's own copy for why it isn't shared. */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading", data: null });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await fn();
        if (alive) setState({ status: "done", data });
      } catch {
        if (alive) setState({ status: "error", data: null });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

const STATUS_TONE: Record<AssetStatus, string> = {
  AVAILABLE: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  ASSIGNED: "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]",
  IN_REPAIR: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  RETIRED: "bg-wt-surface-3 text-wt-text-muted",
  LOST: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
};

/** Every employee's read-only view of what's currently assigned to them —
 *  the self-service side of Asset Tracking (admin-only until now, even
 *  though the backend's GET /assets/mine has always supported this). */
export function MyAssetsPanel() {
  const assetsQuery = useLoad(() => hrmsService.getMyAssets(), []);
  const assets: AssetItem[] = assetsQuery.data?.data ?? [];

  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="border-b border-wt-border px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-wt-text">My Assets</h2>
          <p className="mt-1 text-sm text-wt-text-muted">
            Company equipment currently assigned to you.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {assetsQuery.status === "loading" ? (
            <SectionLoading label="" />
          ) : assetsQuery.status === "error" ? (
            <EmptyState title="Couldn't Load Your Assets" className="py-12" />
          ) : assets.length === 0 ? (
            <EmptyState
              title="Nothing Assigned"
              description="You don't have any company assets checked out right now."
              icon={<Package className="size-6" />}
              className="py-12"
            />
          ) : (
            <ul className="space-y-2">
              {assets.map((asset) => (
                <li
                  key={asset.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-1 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-wt-text">
                      {asset.asset_tag}
                      {[asset.brand, asset.model].filter(Boolean).length ? (
                        <span className="font-normal text-wt-text-muted">
                          {" "}
                          — {[asset.brand, asset.model].filter(Boolean).join(" ")}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-wt-text-muted">
                      {asset.category}
                      {asset.serial_number ? ` · SN ${asset.serial_number}` : ""}
                    </p>
                    {asset.notes ? (
                      <p className="mt-1 text-xs text-wt-text-faint">{asset.notes}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                      STATUS_TONE[asset.status]
                    )}
                  >
                    {asset.status === "ASSIGNED" ? "With you" : asset.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ContentCard>
    </DashboardPageShell>
  );
}
