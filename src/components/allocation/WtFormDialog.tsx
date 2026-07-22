"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { UI_COPY } from "@/constants/uiCopy";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
  SECTION_DESCRIPTION_CLASS,
  SECTION_TITLE_CLASS,
} from "@/components/dashboard/ui/uiLayout";
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
  secondaryAction,
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
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={MODAL_OVERLAY_CLASS} role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wt-form-dialog-title"
        className={cn(MODAL_PANEL_CLASS, "wt-soft-in", maxWidthClass)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={MODAL_HEADER_CLASS}>
          <h2 id="wt-form-dialog-title" className={SECTION_TITLE_CLASS}>
            {title}
          </h2>
          {description ? <p className={SECTION_DESCRIPTION_CLASS}>{description}</p> : null}
        </div>

        <div className={MODAL_BODY_CLASS}>{children}</div>

        <div className={MODAL_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {UI_COPY.cancel}
          </Button>
          {secondaryAction ? (
            <Button
              type="button"
              variant="outline"
              onClick={secondaryAction.onClick}
              disabled={loading || secondaryAction.disabled}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
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
    </div>,
    document.body
  );
}
