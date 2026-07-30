"use client";

import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";

/** Account manager picker — all employees (same directory as other internal assignees). */
export function AccountManagerSelect({
  value,
  onChange,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <InternalEmployeeSelect
      label="Account manager"
      value={value}
      onChange={onChange}
      required={required}
    />
  );
}
