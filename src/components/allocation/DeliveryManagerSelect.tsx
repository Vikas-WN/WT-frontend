"use client";

import { RoleEmployeeSelect } from "@/components/allocation/RoleEmployeeSelect";

/** Delivery manager picker — employees with ROLE_DM from GET /employees/delivery-managers. */
export function DeliveryManagerSelect({
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
      label="Delivery Manager"
      role="DM"
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      extraEmails={value ? [value] : []}
    />
  );
}
