"use client";

import { ApiError } from "@/api/error";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { TextAreaField } from "@/components/dashboard/ui/forms";
import { showErrorToast } from "@/lib/toast";
import { compareApiDates, normalizeToApiDate, parseApiDate } from "@/utils/apiDate";
import { useEffect, useState } from "react";

type WfhExceptionModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { request_from_date: string; request_to_date: string; comments: string }) => Promise<void>;
};

export function WfhExceptionModal({ open, onClose, onSubmit }: WfhExceptionModalProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      return;
    }
    setFromDate("");
    setToDate("");
    setReason("");
    setSaving(false);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    const startDate = normalizeToApiDate(fromDate.trim());
    const endDate = normalizeToApiDate(toDate.trim());

    if (!startDate || !parseApiDate(startDate)) {
      showErrorToast("Please provide a valid Start Date (dd/mm/yyyy).");
      return;
    }
    if (!endDate || !parseApiDate(endDate)) {
      showErrorToast("Please provide a valid End Date (dd/mm/yyyy).");
      return;
    }
    if (compareApiDates(startDate, endDate) > 0) {
      showErrorToast("Start Date cannot be after the End Date.");
      return;
    }
    if (!reason.trim()) {
      showErrorToast("Reason is required.");
      return;
    }
    if (reason.trim().length > 200) {
      showErrorToast("Reason must be 200 characters or less.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        request_from_date: startDate,
        request_to_date: endDate,
        comments: reason.trim(),
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to submit request.";
      showErrorToast(message || "Failed to submit Custom Work From Home request.");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = Boolean(fromDate.trim() && toDate.trim() && reason.trim()) && !saving;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wfh-exception-title"
        className="w-full max-w-lg rounded-2xl border border-wt-border bg-wt-surface-1 p-6 shadow-xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="wfh-exception-title" className="text-base font-semibold text-foreground">
          Request Additional Work From Home
        </h2>
        <p className="text-sm text-muted-foreground">
          Use this form to request more than the standard 1 WFH day per week. This request will be sent directly to HR for approval.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DatePicker
            label="Start Date"
            required
            value={fromDate}
            onChange={setFromDate}
            disabled={saving}
            positionerClassName="z-[300]"
          />
          <DatePicker
            label="End Date"
            required
            value={toDate}
            onChange={setToDate}
            disabled={saving}
            positionerClassName="z-[300]"
          />
        </div>
        <TextAreaField
          label="Reason"
          value={reason}
          onChange={setReason}
          placeholder="Explain why you need additional WFH days..."
          required
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {saving ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
