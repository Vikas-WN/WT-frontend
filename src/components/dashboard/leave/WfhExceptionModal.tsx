"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { TextAreaField } from "@/components/dashboard/ui/forms";
import { useState } from "react";
import { showErrorToast } from "@/lib/toast";

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

  if (!open) return null;

  const handleSubmit = async () => {
    if (!fromDate || !toDate) return;
    if (!reason.trim()) return;
    if (new Date(fromDate) > new Date(toDate)) {
      showErrorToast("End Date cannot be earlier than Start Date.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ request_from_date: fromDate, request_to_date: toDate, comments: reason });
      setFromDate("");
      setToDate("");
      setReason("");
      onClose();
    } catch { } finally {
      setSaving(false);
    }
  };

  const canSubmit = fromDate && toDate && reason.trim() && !saving;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
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
          <DatePicker label="Start Date" required value={fromDate} onChange={setFromDate} disabled={saving} />
          <DatePicker label="End Date" required value={toDate} onChange={setToDate} disabled={saving} />
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
          <Button type="button" variant="brand" onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
