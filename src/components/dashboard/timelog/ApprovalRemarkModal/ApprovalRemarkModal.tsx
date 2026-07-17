"use client";

import { Button } from "@/components/ui/button";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";
import { useState } from "react";

type ApprovalRemarkModalProps = {
  open: boolean;
  title: string;
  actionLabel: string;
  actionVariant?: "brand" | "destructive";
  loading?: boolean;
  onConfirm: (remark: string) => void;
  onCancel: () => void;
};

export function ApprovalRemarkModal({
  open,
  title,
  actionLabel,
  actionVariant = "brand",
  loading = false,
  onConfirm,
  onCancel,
}: ApprovalRemarkModalProps) {
  const [remark, setRemark] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-md flex-col gap-4 rounded-xl border border-wt-border bg-wt-surface-1 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-wt-surface-1/80">
            <WtLoaderCentered label="" />
          </div>
        ) : null}
        <h2 className="text-lg font-semibold">{title}</h2>
        <textarea
          className="min-h-[80px] w-full resize-y rounded-lg border border-wt-border bg-wt-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-wt-brand"
          placeholder="Optional remark..."
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={actionVariant}
            size="sm"
            type="button"
            disabled={loading}
            onClick={() => onConfirm(remark.trim())}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
