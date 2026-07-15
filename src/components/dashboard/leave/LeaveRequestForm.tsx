"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { SearchableSelectCombobox } from "@/components/dashboard/ui/SearchableSelectCombobox";
import { Textarea } from "@/components/ui/textarea";
import { LeaveManagerSelector } from "./LeaveManagerSelector";
import { LeaveAdditionalRecipientsSelector } from "./LeaveAdditionalRecipientsSelector";
import { DatePicker } from "@/components/ui/date-picker";
import { normalizeUserRequestType } from "@/utils/actionToast";
import { useMemo } from "react";
import { Eye, Info } from "lucide-react";

interface LeaveRequestFormValues {
  request_from_date: string;
  request_to_date: string;
  request_type: string;
  comments: string;
  is_half_day: boolean;
  client_approval: boolean;
}

export function LeaveRequestForm({
  values,
  onChange,
  selectedManagerEmails,
  onManagerEmailsChange,
  selectedAdditionalEmails,
  onAdditionalEmailsChange,
  editingLeaveRequestId,
  requiresClientApproval,
  actionLoading,
  leaveRequestTypeOptions,
  onSubmit,
  onCancelEdit,
  onViewCompOffCredits,
}: {
  values: LeaveRequestFormValues;
  onChange: (values: LeaveRequestFormValues) => void;
  selectedManagerEmails: string[];
  onManagerEmailsChange: (emails: string[]) => void;
  selectedAdditionalEmails: string[];
  onAdditionalEmailsChange: (emails: string[]) => void;
  editingLeaveRequestId: string;
  requiresClientApproval: boolean;
  actionLoading: boolean;
  leaveRequestTypeOptions: (string | { value: string; label: string })[];
  onSubmit: () => void;
  onCancelEdit: () => void;
  onViewCompOffCredits?: () => void;
}) {
  const normalizedType = normalizeUserRequestType(values.request_type);
  const isLeaveType = normalizedType === "LEAVE";
  const isLeaveOrOptional = normalizedType === "LEAVE" || normalizedType === "OPTIONAL";
  const isCompOff = normalizedType === "COMP_OFF";
  // Primary + secondary manager pickers are required for leave/optional routing.
  const showManagerSelectors = isLeaveOrOptional;

  const selectItems = useMemo(() => {
    return leaveRequestTypeOptions.map((opt) =>
      typeof opt === "string"
        ? { value: opt, label: opt }
        : { value: opt.value, label: opt.label }
    );
  }, [leaveRequestTypeOptions]);

  const requestTypeValue = useMemo(() => {
    const match = selectItems.find((item) => item.value === values.request_type);
    return match?.value ?? (isLeaveOrOptional || isCompOff ? values.request_type : "LEAVE");
  }, [selectItems, values.request_type, isLeaveOrOptional, isCompOff]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-muted/40 p-6 shadow-sm border border-border/40">
        <h3 className="text-sm font-semibold tracking-tight text-foreground mb-5">
          {editingLeaveRequestId ? "Edit Leave Request" : "Request Leave"}
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Field>
            <FieldLabel>
              Request Type
              <span className="text-destructive" aria-hidden>
                *
              </span>
              <span
                title="Leave — Deducts from your primary/secondary leave balance.&#10;Optional Leave — Deducts from your primary/secondary leave balance (mutually exclusive with paired holiday).&#10;Comp Off — Deducts from your approved Comp Off credit balance."
                className="inline-flex align-middle ml-1 cursor-help"
              >
                <Info className="size-3.5 text-muted-foreground/60" />
              </span>
            </FieldLabel>
            <SearchableSelectCombobox
              value={requestTypeValue}
              onChange={(next) => {
                const value = String(next ?? "LEAVE");
                onChange({ ...values, request_type: value || "LEAVE" });
              }}
              options={selectItems}
              placeholder="Search request type…"
              disabled={actionLoading}
              aria-label="Request type"
              showChevron
            />
          </Field>

          <DatePicker
            label="From Date"
            required
            value={values.request_from_date}
            disabled={actionLoading}
            onChange={(v) =>
              onChange({
                ...values,
                request_from_date: v,
                request_to_date: values.is_half_day ? v : values.request_to_date,
              })
            }
          />

          <DatePicker
            label="To Date"
            required
            value={values.is_half_day ? values.request_from_date : values.request_to_date}
            disabled={actionLoading || values.is_half_day}
            onChange={(v) => {
              if (values.is_half_day) return;
              onChange({ ...values, request_to_date: v });
            }}
          />
        </div>

        {isLeaveType ? (
          <div className="flex items-center gap-2 mt-5">
            <Checkbox
              id="half-day"
              className="cursor-pointer"
              checked={values.is_half_day}
              onCheckedChange={(checked) =>
                onChange({
                  ...values,
                  is_half_day: !!checked,
                  request_to_date: checked ? values.request_from_date : values.request_to_date,
                })
              }
            />
            <label
              htmlFor="half-day"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Half-day leave (single day only)
            </label>
          </div>
        ) : null}
        {isCompOff ? (
          <div className="mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 cursor-pointer"
              onClick={onViewCompOffCredits}
            >
              <Eye className="size-4" />
              View my Comp Off credits
            </Button>
          </div>
        ) : null}

        {requiresClientApproval && isLeaveType ? (
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 px-4 py-3 mt-5">
            <Checkbox
              id="client-approval"
              className="mt-0.5 cursor-pointer"
              checked={values.client_approval}
              onCheckedChange={(checked) =>
                onChange({ ...values, client_approval: !!checked })
              }
            />
            <label
              htmlFor="client-approval"
              className="text-sm text-amber-800 dark:text-amber-200 cursor-pointer select-none leading-relaxed"
            >
              I confirm client approval for this request (required on active client/staffing
              projects).
            </label>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl bg-muted/40 p-5 space-y-5 shadow-sm border border-border/40">
        {showManagerSelectors ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5 min-w-0">
              <LeaveManagerSelector
                label="Primary managers"
                required
                selectedEmails={selectedManagerEmails}
                onChange={(emails) => {
                  onManagerEmailsChange(emails);
                  const primarySet = new Set(emails.map((email) => email.trim().toLowerCase()));
                  onAdditionalEmailsChange(
                    selectedAdditionalEmails.filter(
                      (email) => !primarySet.has(email.trim().toLowerCase())
                    )
                  );
                }}
                disabled={actionLoading}
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <LeaveAdditionalRecipientsSelector
                selectedEmails={selectedAdditionalEmails}
                onChange={onAdditionalEmailsChange}
                excludedEmails={selectedManagerEmails}
                disabled={actionLoading}
              />
            </div>
          </div>
        ) : null}

        <Field>
          <FieldLabel>
            Comments
            <span className="text-destructive" aria-hidden>
              *
            </span>
          </FieldLabel>
          <Textarea
            placeholder="Enter your comments..."
            value={values.comments}
            onChange={(e) => onChange({ ...values, comments: e.target.value })}
            className="min-h-[100px] resize-y bg-background"
          />
        </Field>

        <div className="flex justify-end pt-4 border-t border-border/40 mt-6">
          <div className="flex items-center gap-3">
            <Button
              variant="brand"
              type="button"
              className="w-full sm:w-auto px-6 h-10 font-medium"
              onClick={onSubmit}
              disabled={actionLoading}
            >
              {editingLeaveRequestId ? "Save Changes" : "Submit Request"}
            </Button>
            {editingLeaveRequestId ? (
              <Button
                variant="ghost"
                type="button"
                className="w-full sm:w-auto px-6 h-10 font-medium"
                onClick={onCancelEdit}
                disabled={actionLoading}
              >
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
