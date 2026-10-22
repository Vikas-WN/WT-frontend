"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Accessible focus trapping, Escape handling and focus restoration come from Base UI. */
export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "default", loading = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const danger = tone === "danger";
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => { if (!next && !loading) onCancel(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="wt-modal-overlay fixed inset-0 z-[200] bg-slate-950/45 backdrop-blur-sm" />
        <AlertDialog.Popup className="wt-confirm-panel fixed left-1/2 top-1/2 z-[201] max-h-[calc(100dvh-32px)] w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-wt-border bg-wt-surface-1 text-wt-text shadow-[var(--wt-shadow-lg)] outline-none">
          <div className="p-6 sm:p-7">
            <span className={cn("mb-5 grid size-11 place-items-center rounded-xl", danger ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-wt-brand-soft text-wt-brand")}>
              {danger ? <AlertTriangle className="size-5" aria-hidden /> : <ArrowRight className="size-5" aria-hidden />}
            </span>
            <AlertDialog.Title className="font-[family-name:var(--font-brand)] text-xl font-semibold tracking-tight">{title}</AlertDialog.Title>
            {description ? <AlertDialog.Description className="mt-3 text-sm leading-relaxed text-wt-text-muted [overflow-wrap:anywhere]">{description}</AlertDialog.Description> : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-wt-border bg-wt-surface-2 px-6 py-4 sm:px-7">
            <Button variant="outline" disabled={loading} onClick={onCancel}>{cancelLabel}</Button>
            <Button variant={danger ? "destructive" : "brand"} disabled={loading} onClick={onConfirm}>{loading ? "Please wait…" : confirmLabel}</Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
