"use client";

import { useMemo } from "react";
import { useRoleEmployeeOptions } from "@/hooks/useRoleEmployeeOptions";
import { FieldLabel, SearchableSelectCombobox } from "@/components/dashboard/ui/forms";

function formatRoleEmployeeLabel(employee: { name: string; email: string }): string {
  const name = employee.name.trim() || employee.email;
  const email = employee.email.trim();
  if (email && name !== email) return `${name} (${email})`;
  return name || email || "—";
}

export function RoleEmployeeSelect({
  label,
  role,
  value,
  onChange,
  required = false,
  disabled = false,
  extraEmails = [],
}: {
  label: string;
  role: "AM" | "DM";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  /** Emails to force into the option list (e.g. the client's assigned manager). */
  extraEmails?: string[];
}) {
  const { data: options = [], isLoading, isError } = useRoleEmployeeOptions(role);

  const selectOptions = useMemo(() => {
    const placeholder = isLoading
      ? "Loading…"
      : isError
        ? "Could not load"
        : options.length
          ? `Select ${label.toLowerCase()}`
          : "No options found";
    const rows = options.map((employee) => ({
      value: employee.email,
      label: formatRoleEmployeeLabel(employee),
    }));
    for (const raw of extraEmails) {
      const email = raw.trim().toLowerCase();
      if (email && !rows.some((row) => row.value === email)) {
        rows.push({ value: email, label: email });
      }
    }
    return [{ value: "", label: placeholder }, ...rows];
  }, [options, isError, isLoading, label, extraEmails]);

  return (
    <label className="text-xs text-wt-text-muted flex flex-col gap-1">
      <FieldLabel label={label} required={required} />
      <SearchableSelectCombobox
        value={value}
        onChange={onChange}
        options={selectOptions}
        placeholder={`Search ${label.toLowerCase()}…`}
        required={required}
        disabled={disabled || isLoading}
        aria-label={label}
      />
    </label>
  );
}
