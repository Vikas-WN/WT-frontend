"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { UI_COPY } from "@/constants/uiCopy";
import { cn } from "@/lib/utils";

export function WtFormDialog({
  open,
  title,
  description,
  children,
  onClose,
  onSubmit,
  submitLabel,
  submittingLabel = UI_COPY.saving,
  submitDisabled = false,
  loading = false,
  maxWidthClass = "max-w-2xl",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submittingLabel?: string;
  submitDisabled?: boolean;
  loading?: boolean;
  maxWidthClass?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wt-form-dialog-title"
        className={cn(
          "flex max-h-[min(92vh,880px)] w-full flex-col rounded-2xl border border-wt-border bg-wt-surface-1 shadow-xl",
          maxWidthClass
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-wt-border px-5 py-4 md:px-6">
          <h2 id="wt-form-dialog-title" className="text-base font-semibold text-wt-text">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-wt-text-muted">{description}</p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">{children}</div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-wt-border px-5 py-4 md:px-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {UI_COPY.cancel}
          </Button>
          {onSubmit && submitLabel ? (
            <Button
              type="button"
              variant="brand"
              onClick={onSubmit}
              disabled={loading || submitDisabled}
            >
              {loading ? submittingLabel : submitLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
