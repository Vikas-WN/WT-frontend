"use client";

import { useId } from "react";
import { LimitedTextarea } from "@/components/dashboard/ui/LimitedTextarea";
import { REQUEST_REASON_MAX_LENGTH } from "@/constants/requestReason";
import { Field, FieldLabel as ShadcnFieldLabel } from "@/components/ui/field";
import { FORM_FIELD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { formatUILabel } from "@/utils/titleCase";

export function LeaveReasonField({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const fieldId = useId();

  return (
    <Field className={FORM_FIELD_CLASS}>
      <ShadcnFieldLabel htmlFor={fieldId}>
        {formatUILabel("Reason for Leave")}
        <span className="text-destructive" aria-hidden>
          *
        </span>
      </ShadcnFieldLabel>
      <LimitedTextarea id={fieldId} value={value} onChange={onChange} max={REQUEST_REASON_MAX_LENGTH} disabled={disabled} placeholder="Enter reason for your leave..." />
    </Field>
  );
}

export function WfhReasonField({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const fieldId = useId();

  return (
    <Field className={FORM_FIELD_CLASS}>
      <ShadcnFieldLabel htmlFor={fieldId}>
        {formatUILabel("Reason")}
        <span className="text-destructive" aria-hidden>
          *
        </span>
      </ShadcnFieldLabel>
      <LimitedTextarea id={fieldId} value={value} onChange={onChange} max={REQUEST_REASON_MAX_LENGTH} disabled={disabled} placeholder="Enter reason for your request..." />
    </Field>
  );
}
