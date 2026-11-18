"use client";

import { InputField } from "@/components/dashboard/ui/forms";
import { ModalPortal } from "@/components/dashboard/ui/ModalPortal";
import { Button } from "@/components/ui/button";

type UserRequestRejectDialogProps = {
  open: boolean;
  title: string;
  description: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmLabel: string;
  confirmingLabel: string;
  reason: string;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  loading?: boolean;
};

export function UserRequestRejectDialog({
  open,
  title,
  description,
  reasonLabel = "Reason",
  reasonPlaceholder = "Enter reason",
  confirmLabel,
  confirmingLabel,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
  confirmDisabled,
  loading,
}: UserRequestRejectDialogProps) {
  if (!open) return null;

  // Portalled to <body>: opened from a table's actions cell it used to inherit that cell's `whitespace-nowrap` and
  // right alignment (the description ran off the dialog), and a `fixed` overlay inside a transformed row is boxed
  // into the row instead of covering the screen.
  return (
    <ModalPortal onEscape={loading ? undefined : onCancel}>
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 dark:bg-black/60"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-request-reject-title"
        className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-xl space-y-4 text-left whitespace-normal break-words"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="user-request-reject-title" className="text-base font-semibold text-wt-text">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-wt-text-muted">{description}</p>
        <InputField
          label={reasonLabel}
          value={reason}
          onChange={onReasonChange}
          placeholder={reasonPlaceholder}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onConfirm}
            disabled={confirmDisabled || loading || !reason.trim()}
          >
            {loading ? confirmingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
