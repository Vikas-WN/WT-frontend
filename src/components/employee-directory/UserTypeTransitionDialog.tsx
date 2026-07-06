"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { formatApiDate, parseApiDate } from "@/utils/apiDate";
import { formatUserTypeLabel } from "@/utils/offboardingFormState";
import { useEffect, useMemo, useState } from "react";

type UserTypeTransitionDialogProps = {
  open: boolean;
  fromType: string;
  toType: string;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (transitionDate: string) => void | Promise<void>;
};

export function UserTypeTransitionDialog({
  open,
  fromType,
  toType,
  saving = false,
  onClose,
  onConfirm,
}: UserTypeTransitionDialogProps) {
  const [transitionDate, setTransitionDate] = useState(() => formatApiDate(new Date()));

  useEffect(() => {
    if (!open) return;
    setTransitionDate(formatApiDate(new Date()));
  }, [open, fromType, toType]);

  const selectedDate = useMemo(() => parseApiDate(transitionDate) ?? undefined, [transitionDate]);

  if (!open) return null;

  const canConfirm = Boolean(transitionDate.trim()) && !saving;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-type-transition-title"
        className="w-full max-w-lg rounded-2xl border border-wt-border bg-wt-surface-1 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pb-4 pt-6">
          <h2 id="user-type-transition-title" className="text-base font-semibold text-wt-text">
            Confirm User Type Transition
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-wt-text-muted break-words">
            Changing from {formatUserTypeLabel(fromType)} to {formatUserTypeLabel(toType)}.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-wt-text-muted break-words">
            Set the transition date for this employee&apos;s full-time start.
          </p>
        </div>

        <div className="border-y border-wt-border bg-wt-surface-2/40 px-6 py-4">
          <p className="mb-3 text-center text-sm font-medium text-wt-text">
            Transition Date
            <span className="text-destructive" aria-hidden>
              {" "}
              *
            </span>
          </p>
          <div className="flex w-full justify-center">
            <div className="inline-flex rounded-xl border border-wt-border bg-wt-surface-1 p-1 shadow-sm">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) setTransitionDate(formatApiDate(date));
                }}
                disabled={saving}
                classNames={{ root: "w-fit bg-transparent p-2" }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand"
            disabled={!canConfirm}
            onClick={() => void onConfirm(transitionDate)}
          >
            {saving ? "Saving…" : "Confirm Transition"}
          </Button>
        </div>
      </div>
    </div>
  );
}
