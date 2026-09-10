"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" paints the confirm button red — use it for destructive actions. */
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Shared confirmation dialog for destructive / irreversible actions
 *  (delete, revoke, discard, …). Keyboard: Esc cancels. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const danger = tone === "danger";

  return (
    <div
      className="wt-modal-overlay fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={loading ? undefined : onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="wt-confirm-title"
        aria-describedby={description ? "wt-confirm-description" : undefined}
        className="my-auto w-full max-w-md rounded-2xl border border-wt-border bg-wt-surface-1 p-6 shadow-2xl dark:border-wt-border-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={cn(
            "mx-auto flex size-12 items-center justify-center rounded-full",
            danger
              ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
              : "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
          )}
        >
          <AlertTriangle className="size-6" aria-hidden />
        </div>
        <h2
          id="wt-confirm-title"
          className="mt-4 text-center text-lg font-semibold text-wt-text"
        >
          {title}
        </h2>
        {description ? (
          <p
            id="wt-confirm-description"
            className="mt-2 text-center text-sm leading-relaxed text-wt-text-muted [overflow-wrap:anywhere]"
          >
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="sm:min-w-[7.5rem]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? "outline" : "brand"}
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "sm:min-w-[7.5rem]",
              danger &&
                "border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:text-white dark:border-rose-500 dark:bg-rose-600 dark:hover:bg-rose-500"
            )}
          >
            {loading ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
