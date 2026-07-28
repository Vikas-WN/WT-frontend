"use client";

import { InputField, SelectField } from "@/components/dashboard/ui/forms";
import { AllocatedPercentSelect } from "@/components/allocation/AllocatedPercentSelect";
import { CurrentAllocationHint } from "@/components/allocation/CurrentAllocationHint";
import { InternalEmployeeSelect } from "@/components/allocation/InternalEmployeeSelect";
import {
  ALLOCATION_STATUS_SELECT_OPTIONS,
  ALLOCATION_TYPE_SELECT_OPTIONS,
  allocationTypeForBillingStatus,
} from "@/utils/allocationDefaults";
import type { AllocationBillingStatus } from "@/constants/allocationOptions";
import { FormSubsection } from "@/components/dashboard/ui/FormSection";
import type { AllocationPercentRow } from "@/types/allocationPercent";

export type ManagerAllocationFieldsState = {
  email: string;
  allocated_percent: string;
  start_date: string;
  end_date: string;
  allocation_type: string;
  billing_status: AllocationBillingStatus | "";
  locked_in_date: string;
  role: string;
};

export function createEmptyManagerAllocationFields(role: string): ManagerAllocationFieldsState {
  return {
    email: "",
    allocated_percent: "100",
    start_date: "",
    end_date: "",
    allocation_type: "DEPLOYABLE",
    billing_status: "BILLED",
    locked_in_date: "",
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
  hideAllocatedPercent = false,
  managerContactOnly = false,
}: {
  title: string;
  state: ManagerAllocationFieldsState;
  onChange: (next: ManagerAllocationFieldsState) => void;
  allocationPercentOptions: AllocationPercentRow[];
  enabled: boolean;
  percentDesignation: string;
  hideAllocatedPercent?: boolean;
  managerContactOnly?: boolean;
}) {
  const showLockedInDate = state.allocation_type === "LOCKED";

  if (managerContactOnly) {
    return (
      <FormSubsection title={title}>
        <div className="grid gap-4 sm:grid-cols-2">
          <InternalEmployeeSelect
            label="Name"
            value={state.email}
            onChange={(email) => onChange({ ...state, email })}
          />
        </div>
      </FormSubsection>
    );
  }

  return (
    <FormSubsection title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InternalEmployeeSelect
          label="Name"
          required
          value={state.email}
          onChange={(email) => onChange({ ...state, email })}
        />
        {hideAllocatedPercent ? null : (
          <AllocatedPercentSelect
            required
            designation={percentDesignation}
            enabled={enabled}
            allocationPercentOptions={allocationPercentOptions}
            value={state.allocated_percent}
            onChange={(allocated_percent) => onChange({ ...state, allocated_percent })}
          />
        )}
        {hideAllocatedPercent ? null : (
          <div className="sm:col-span-2">
            <CurrentAllocationHint email={state.email} />
            <p className="mt-1 text-xs text-wt-text-muted">
              Combined allocation for this manager must not exceed 100%.
            </p>
          </div>
        )}
        <SelectField
          label="Allocation Type"
          required
          value={state.allocation_type}
          options={ALLOCATION_TYPE_SELECT_OPTIONS}
          onChange={(allocation_type) =>
            onChange({
              ...state,
              allocation_type,
              locked_in_date:
                allocation_type === "LOCKED" ? state.locked_in_date || state.start_date : "",
            })
          }
        />
        <SelectField
          label="Status"
          required
          value={state.billing_status}
          options={ALLOCATION_STATUS_SELECT_OPTIONS}
          onChange={(billing_status) =>
            onChange({
              ...state,
              billing_status: ALLOCATION_STATUS_SELECT_OPTIONS.some((o) => o.value === billing_status)
                ? (billing_status as AllocationBillingStatus)
                : "",
              allocation_type: allocationTypeForBillingStatus(
                billing_status as AllocationBillingStatus,
                state.allocation_type
              ),
            })
          }
        />
        {showLockedInDate ? (
          <InputField
            label="Locked-In Date"
            required
            type="date"
            value={state.locked_in_date}
            onChange={(locked_in_date) => onChange({ ...state, locked_in_date })}
          />
        ) : null}
        <InputField
          label="Start Date"
          required
          type="date"
          value={state.start_date}
          onChange={(start_date) =>
            onChange({
              ...state,
              start_date,
              locked_in_date:
                state.allocation_type === "LOCKED" && !state.locked_in_date
                  ? start_date
                  : state.locked_in_date,
            })
          }
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
