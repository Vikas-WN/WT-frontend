"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownSelectField } from "@/components/dashboard/ui/forms";
import { formatApiDate, parseApiDate } from "@/utils/apiDate";
import { formatUserTypeLabel } from "@/utils/offboardingFormState";
import { useEffect, useMemo, useState } from "react";

export type UserTypeTransitionConfirmPayload = {
  transitionDate: string;
  bandId?: number;
};

type UserTypeTransitionDialogProps = {
  open: boolean;
  fromType: string;
  toType: string;
  saving?: boolean;
  /** When true, user must pick a band before confirming. */
  requireBand?: boolean;
  bandOptions?: Array<{ value: string; label: string }>;
  bandsLoading?: boolean;
  bandFieldLabel?: string;
  bandHelperText?: string;
  dateHelperText?: string;
  onClose: () => void;
  onConfirm: (payload: UserTypeTransitionConfirmPayload) => void | Promise<void>;
};

export function UserTypeTransitionDialog({
  open,
  fromType,
  toType,
  saving = false,
  requireBand = false,
  bandOptions = [],
  bandsLoading = false,
  bandFieldLabel = "Band",
  bandHelperText,
  dateHelperText,
  onClose,
  onConfirm,
}: UserTypeTransitionDialogProps) {
  const [transitionDate, setTransitionDate] = useState(() => formatApiDate(new Date()));
  const [bandId, setBandId] = useState("");

  useEffect(() => {
    if (!open) return;
    setTransitionDate(formatApiDate(new Date()));
    setBandId("");
  }, [open, fromType, toType]);

  useEffect(() => {
    if (!open || !requireBand || bandsLoading) return;
    if (bandOptions.length === 1 && !bandId) {
      setBandId(bandOptions[0]?.value ?? "");
    }
  }, [open, requireBand, bandsLoading, bandOptions, bandId]);

  const selectedDate = useMemo(() => parseApiDate(transitionDate) ?? undefined, [transitionDate]);

  if (!open) return null;

  const bandReady = !requireBand || Boolean(bandId.trim());
  const canConfirm = Boolean(transitionDate.trim()) && bandReady && !saving && !bandsLoading;
  const defaultDateHelper =
    dateHelperText ??
    (String(toType).toUpperCase().replace(/[\s_-]+/g, "") === "FULLTIME"
      ? "Set the transition date for this employee's full-time start."
      : "Set the transition date for this user-type change.");

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
            {defaultDateHelper}
          </p>
          {requireBand && bandHelperText ? (
            <p className="mt-2 text-sm leading-relaxed text-wt-text-muted break-words">
              {bandHelperText}
            </p>
          ) : null}
        </div>

        <div className="border-y border-wt-border bg-wt-surface-2/40 px-6 py-4 space-y-4">
          {requireBand ? (
            <DropdownSelectField
              label={bandFieldLabel}
              value={bandId}
              onChange={setBandId}
              options={bandOptions}
              required
              placeholder={bandsLoading ? "Loading bands…" : "Select band"}
              disabled={saving || bandsLoading}
              loading={bandsLoading}
            />
          ) : null}
          <div>
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
        </div>

        <div className="flex justify-end gap-3 p-6 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand"
            disabled={!canConfirm}
            onClick={() => {
              const payload: UserTypeTransitionConfirmPayload = {
                transitionDate,
              };
              if (requireBand && bandId.trim()) {
                payload.bandId = Number(bandId);
              }
              void onConfirm(payload);
            }}
          >
            {saving ? "Saving…" : "Confirm Transition"}
          </Button>
        </div>
      </div>
    </div>
  );
}
