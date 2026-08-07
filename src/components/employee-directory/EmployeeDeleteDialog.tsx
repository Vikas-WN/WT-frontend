"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UI_COPY } from "@/constants/uiCopy";

export function EmployeeDeleteDialog({
  open,
  employeeName,
  employeeEmail,
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  employeeName: string;
  employeeEmail: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[195] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={loading ? undefined : onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="employee-delete-title"
        aria-describedby="employee-delete-description"
        className="w-full max-w-md rounded-2xl border border-wt-border bg-wt-surface-1 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TrashIcon />
        </div>
        <h2
          id="employee-delete-title"
          className="mt-4 text-center text-lg font-semibold text-wt-text"
        >
          Delete Employee?
        </h2>
        <p
          id="employee-delete-description"
          className="mt-2 text-center text-sm leading-relaxed text-wt-text-muted"
        >
          {employeeName.trim() ? (
            <>
              <span className="font-medium text-wt-text">{employeeName}</span>{" "}
              {employeeEmail.trim() ? (
                <>
                  (<span className="font-medium text-wt-text">{employeeEmail}</span>)
                </>
              ) : null}
              <br />
            </>
          ) : null}
          This action will permanently remove the employee from the directory. Their account will
          be deactivated and they will no longer be able to sign in.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="min-w-[8rem]"
            onClick={onCancel}
            disabled={loading}
          >
            {UI_COPY.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-w-[8rem]"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
