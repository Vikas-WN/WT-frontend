"use client";

import { useMemo } from "react";
import { SelectField } from "@/components/dashboard/ui/forms";
import type { AllocationPercentRow } from "@/types/allocationPercent";
import {
  allocationPercentOptionsForDesignation,
  allocationPercentSelectOptions,
} from "@/utils/allocationPercent";

export function AllocatedPercentSelect({
  designation = "",
  value,
  onChange,
  required = false,
  enabled = true,
  disabled = false,
  allocationPercentOptions = [],
}: {
  designation?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  enabled?: boolean;
  disabled?: boolean;
  allocationPercentOptions?: AllocationPercentRow[];
}) {
  const options = useMemo(
    () =>
      allocationPercentSelectOptions(
        allocationPercentOptionsForDesignation(designation, allocationPercentOptions)
      ),
    [designation, allocationPercentOptions]
  );

  const isDisabled = disabled || !enabled || !designation.trim();

  return (
    <SelectField
      label="Allocated %"
      required={required}
      value={value}
      disabled={isDisabled}
      placeholder={
        !designation.trim()
          ? "Select role first"
          : options.length
            ? "Select allocation %"
            : "No options"
      }
      options={options}
      onChange={onChange}
    />
  );
}
