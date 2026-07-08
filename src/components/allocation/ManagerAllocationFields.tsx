"use client";

import { InputField, SelectField } from "@/components/dashboard/ui/forms";
import { AllocatedPercentSelect } from "@/components/allocation/AllocatedPercentSelect";
import { CurrentAllocationHint } from "@/components/allocation/CurrentAllocationHint";
import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";
import { ALLOCATION_TYPE_OPTIONS } from "@/constants/allocationOptions";
import { FormSubsection } from "@/components/dashboard/ui/FormSection";
import type { AllocationPercentRow } from "@/types/allocationPercent";

export type ManagerAllocationFieldsState = {
  email: string;
  allocated_percent: string;
  start_date: string;
  end_date: string;
  allocation_type: string;
  role: string;
};

export function createEmptyManagerAllocationFields(role: string): ManagerAllocationFieldsState {
  return {
    email: "",
    allocated_percent: "100",
    start_date: "",
    end_date: "",
    allocation_type: "DEPLOYABLE",
    role,
  };
}

export function ManagerAllocationFields({
  title,
  state,
  onChange,
  allocationPercentOptions,
  enabled,
  percentDesignation,
}: {
  title: string;
  state: ManagerAllocationFieldsState;
  onChange: (next: ManagerAllocationFieldsState) => void;
  allocationPercentOptions: AllocationPercentRow[];
  enabled: boolean;
  percentDesignation: string;
}) {
  return (
    <FormSubsection title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InternalEmployeeSelect
          label="Name"
          required
          value={state.email}
          onChange={(email) => onChange({ ...state, email })}
        />
        <AllocatedPercentSelect
          required
          designation={percentDesignation}
          enabled={enabled}
          value={state.allocated_percent}
          onChange={(allocated_percent) => onChange({ ...state, allocated_percent })}
        />
        <div className="sm:col-span-2">
          <CurrentAllocationHint email={state.email} />
          <p className="mt-1 text-xs text-wt-text-muted">
            Combined allocation for this manager must not exceed 100%.
          </p>
        </div>
        <SelectField
          label="Allocation Type"
          required
          value={state.allocation_type}
          options={ALLOCATION_TYPE_OPTIONS.map((o) => o.value)}
          onChange={(allocation_type) => onChange({ ...state, allocation_type })}
        />
        <InputField
          label="Start Date"
          required
          type="date"
          value={state.start_date}
          onChange={(start_date) => onChange({ ...state, start_date })}
        />
        <InputField
          label="End Date"
          type="date"
          value={state.end_date}
          onChange={(end_date) => onChange({ ...state, end_date })}
        />
      </div>
    </FormSubsection>
  );
}
