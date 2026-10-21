"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TextAreaField } from "@/components/dashboard/ui/forms";
import { LeaveManagerSelector } from "@/components/dashboard/leave/LeaveManagerSelector";
import { WFH_COPY } from "@/constants/wfhRequest";
import type { LeaveRequestFormState } from "@/types/leaveRequestForm";

interface WfhApplyFormProps {
  form: LeaveRequestFormState;
  onFormChange: (updater: (prev: LeaveRequestFormState) => LeaveRequestFormState) => void;
  managerEmails: string[];
  onManagerEmailsChange: (emails: string[]) => void;
  editing: boolean;
  busy: boolean;
  projectsLoading: boolean;
  requiresClientApproval: boolean;
  routesToHr: boolean;
  onOpenException: () => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
}

function submitLabel(busy: boolean, editing: boolean): string {
  if (busy) return editing ? WFH_COPY.saving : WFH_COPY.submitting;
  return editing ? WFH_COPY.saveChanges : WFH_COPY.submit;
}

export function WfhApplyForm({
  form,
  onFormChange,
  managerEmails,
  onManagerEmailsChange,
  editing,
  busy,
  projectsLoading,
  requiresClientApproval,
  routesToHr,
  onOpenException,
  onSubmit,
  onCancelEdit,
}: WfhApplyFormProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-muted/40 p-6 shadow-sm border border-border/40">
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{WFH_COPY.applyHeading}</h3>
          <button
            type="button"
            onClick={onOpenException}
            className="text-xs text-[var(--wt-brand)] hover:text-[var(--wt-brand)] underline cursor-pointer"
          >
            {WFH_COPY.exceptionLink}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
          <DatePicker
            label={WFH_COPY.fromDate}
            required
            value={form.request_from_date}
            onChange={(v) => onFormChange((p) => ({ ...p, request_from_date: v, request_to_date: v }))}
            disabled={busy}
          />
          <DatePicker
            label={WFH_COPY.toDate}
            required
            value={form.request_from_date}
            onChange={() => undefined}
            disabled
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{WFH_COPY.weeklyLimitHint}</p>
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              className="cursor-pointer"
              checked={form.is_half_day}
              onCheckedChange={(checked) =>
                onFormChange((p) => ({ ...p, is_half_day: checked === true, request_to_date: p.request_from_date }))
              }
              disabled={busy}
            />
            <span className="text-muted-foreground">{WFH_COPY.halfDay}</span>
          </label>
        </div>
        {requiresClientApproval ? (
          <div className="mt-5">
            <Label className="text-sm flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-normal text-amber-900 cursor-pointer">
              <Checkbox
                className="mt-0.5 cursor-pointer"
                checked={form.client_approval}
                onCheckedChange={(checked) => onFormChange((p) => ({ ...p, client_approval: checked }))}
              />
              <span>{WFH_COPY.clientApproval}</span>
            </Label>
          </div>
        ) : null}
      </div>
      <div className="rounded-xl bg-muted/40 p-5 space-y-5 shadow-sm border border-border/40">
        {routesToHr ? (
          <p className="rounded-lg border border-wt-border/70 bg-wt-surface-2/40 px-3 py-2 text-xs leading-relaxed text-wt-text-muted">
            {WFH_COPY.talentPoolNotice}
          </p>
        ) : (
          <LeaveManagerSelector
            label={WFH_COPY.managersLabel}
            required
            selectedEmails={managerEmails}
            onChange={onManagerEmailsChange}
            disabled={busy || projectsLoading}
          />
        )}
        <TextAreaField
          label={WFH_COPY.commentsLabel}
          required
          value={form.comments}
          onChange={(v) => onFormChange((p) => ({ ...p, comments: v }))}
        />
        <div className="flex justify-end pt-4 border-t border-border/40 mt-6">
          <div className="flex items-center gap-3">
            <Button
              variant="brand"
              type="button"
              className="px-6 h-10 font-medium"
              disabled={busy || projectsLoading}
              onClick={onSubmit}
            >
              {submitLabel(busy, editing)}
            </Button>
            {editing ? (
              <Button variant="ghost" type="button" className="px-6 h-10 font-medium" onClick={onCancelEdit} disabled={busy}>
                {WFH_COPY.cancelEdit}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
