"use client";

import { useMemo } from "react";
import { useAllocationEmployees } from "@/hooks/useAllocationEmployees";
import { FieldLabel, SearchableSelectCombobox } from "@/components/dashboard/ui/forms";

export function InternalEmployeeSelect({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const { data: employees = [], isLoading, isError } = useAllocationEmployees();

  const selectOptions = useMemo(() => {
    const placeholder = isLoading
      ? "Loading employees…"
      : isError
        ? "Could not load employees"
        : employees.length
          ? `Select ${label.toLowerCase()}`
          : "No employees found";
    const rows = employees.map((employee) => ({
      value: employee.employeeEmail,
      label: employee.employeeName,
    }));
    return [{ value: "", label: placeholder }, ...rows];
  }, [employees, isError, isLoading, label]);

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
