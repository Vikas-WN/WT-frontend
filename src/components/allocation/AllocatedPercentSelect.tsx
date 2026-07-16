"use client";

import { InputField } from "@/components/dashboard/ui/forms";

export function AllocatedPercentSelect({
  value,
  onChange,
  required = false,
  disabled = false,
}: {
  designation?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  enabled?: boolean;
  disabled?: boolean;
}) {
  return (
    <InputField
      label="Allocated %"
      type="number"
      placeholder="e.g. 50"
      required={required}
      value={value}
      disabled={disabled}
      onChange={(v) => {
        if (v === "") {
          onChange(v);
          return;
        }
        const num = Number(v);
        if (Number.isFinite(num) && num >= 1 && num <= 100) {
          onChange(String(Math.trunc(num)));
        }
      }}
    />
  );
}
