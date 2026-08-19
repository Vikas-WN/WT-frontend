"use client";

import { RoleEmployeeSelect } from "@/components/allocation/RoleEmployeeSelect";

/** Account manager picker — employees with ROLE_AM from GET /employees/account-managers. */
export function AccountManagerSelect({
  value,
  onChange,
  required = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <RoleEmployeeSelect
      label="Account manager"
      role="AM"
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      extraEmails={value ? [value] : []}
    />
  );
}
