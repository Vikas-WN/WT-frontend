import type { AssetStatus } from "@/types/asset";

export const ASSET_STATUS_ORDER: AssetStatus[] = [
  "AVAILABLE",
  "ASSIGNED",
  "IN_REPAIR",
  "RETIRED",
  "LOST",
];

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: "Available",
  ASSIGNED: "Assigned",
  IN_REPAIR: "In Repair",
  RETIRED: "Retired",
  LOST: "Lost",
};

export const ASSET_STATUS_TONE: Record<AssetStatus, string> = {
  AVAILABLE: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  ASSIGNED: "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]",
  IN_REPAIR: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  RETIRED: "bg-wt-surface-3 text-wt-text-muted",
  LOST: "bg-rose-500/12 text-rose-700 dark:text-rose-400",
};

export function isAssetStatus(value: string): value is AssetStatus {
  return Object.prototype.hasOwnProperty.call(ASSET_STATUS_LABELS, value);
}

export function statusLabel(status: string): string {
  return isAssetStatus(status) ? ASSET_STATUS_LABELS[status] : status;
}

export function statusTone(status: string): string {
  return isAssetStatus(status) ? ASSET_STATUS_TONE[status] : ASSET_STATUS_TONE.RETIRED;
}
