"use client";

import { History, Pencil, RotateCcw, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import type { AssetItem, AssetStatus } from "@/types/asset";
import { isAssetStatus, statusLabel, statusTone } from "@/utils/assetStatus";
import { cn } from "@/lib/utils";

const STATUS_COPY: Record<AssetStatus, string> = {
  AVAILABLE: "Ready to assign.",
  ASSIGNED: "Currently assigned. Return it before assigning to someone else.",
  IN_REPAIR: "In repair; cannot assign until status is Available.",
  RETIRED: "Retired; cannot assign.",
  LOST: "Marked lost; cannot assign.",
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-wt-text-muted">{label}</p>
      <p className="mt-0.5 text-sm text-wt-text">{value}</p>
    </div>
  );
}

export function AssetScanResultDialog({
  asset,
  onClose,
  onAssign,
  onReturn,
  onEdit,
  onHistory,
}: {
  asset: AssetItem;
  onClose: () => void;
  // Omitted entirely for a read-only viewer (e.g. an employee without asset-
  // management access who just scanned the tag) — only the info panel shows.
  onAssign?: () => void;
  onReturn?: () => void;
  onEdit?: () => void;
  onHistory?: () => void;
}) {
  const brandModel = [asset.brand, asset.model].filter(Boolean).join(" ") || "—";
  const known = isAssetStatus(asset.status);
  const holderName = asset.holder?.name?.trim() || null;

  return (
    <div
      className={MODAL_OVERLAY_CLASS}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="asset-scan-result-title" className={MODAL_PANEL_CLASS}>
        <div className={MODAL_HEADER_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 id="asset-scan-result-title" className="text-base font-semibold text-wt-text">
              {asset.asset_tag}
            </h2>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                statusTone(asset.status)
              )}
            >
              {statusLabel(asset.status)}
            </span>
          </div>
          <p className="mt-2 text-sm text-wt-text-muted">
            {asset.status === "ASSIGNED"
              ? holderName
                ? `Currently with ${holderName}. Return it before assigning to someone else.`
                : "Currently assigned. Return it before assigning to someone else."
              : known
                ? STATUS_COPY[asset.status]
                : "This status cannot be assigned from scan."}
          </p>
        </div>
        <div className={MODAL_BODY_CLASS}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Category" value={asset.category || "—"} />
            <Detail label="Brand / Model" value={brandModel} />
            <Detail label="Serial" value={asset.serial_number?.trim() || "—"} />
          </div>
          {asset.status === "ASSIGNED" || asset.holder ? (
            <div className="mt-5 rounded-xl border border-wt-border bg-wt-surface-2/50 px-4 py-3">
              <p className="text-xs font-medium text-wt-text-muted">Holder</p>
              {asset.holder ? (
                <>
                  <p className="mt-1 text-sm font-medium text-wt-text">{asset.holder.name}</p>
                  <p className="text-xs text-wt-text-muted">
                    {asset.holder.email}
                    {asset.holder.emp_id ? ` · ${asset.holder.emp_id}` : ""}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-wt-text">Holder unknown</p>
              )}
            </div>
          ) : null}
          {asset.notes?.trim() ? (
            <div className="mt-5">
              <Detail label="Notes" value={asset.notes.trim()} />
            </div>
          ) : null}
        </div>
        <div className={MODAL_FOOTER_CLASS}>
          {onHistory ? (
            <Button type="button" variant="outline" className="mr-auto" onClick={onHistory}>
              <History className="size-4" />
              History
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {onAssign && asset.status === "AVAILABLE" ? (
            <Button type="button" onClick={onAssign}>
              <UserPlus className="size-4" />
              Assign
            </Button>
          ) : null}
          {onReturn && asset.status === "ASSIGNED" ? (
            <Button type="button" onClick={onReturn}>
              <RotateCcw className="size-4" />
              Return
            </Button>
          ) : null}
          {onEdit &&
          (asset.status === "IN_REPAIR" || asset.status === "RETIRED" || asset.status === "LOST") ? (
            <Button type="button" onClick={onEdit}>
              <Pencil className="size-4" />
              Edit
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
