"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { EmployeeStatusBadge } from "@/components/employee-directory/EmployeeStatusBadge";
import { hrmsService } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import {
  formatEmployeeStatusLabel,
  normalizeEmployeeStatusKey,
} from "@/utils/userStatus";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["ACTIVE", "INVITED", "SERVING_NOTICE", "INACTIVE"] as const;

/**
 * Inline, colour-coded status editor for the directory table — the trigger is the
 * usual status badge, opening a menu of the canonical statuses. Exit statuses
 * (Serving Notice / Inactive) may still be rejected by the API when resignation /
 * last-working-day dates are missing; that surfaces as an error toast and the
 * user completes it from the full profile.
 */
export function DirectoryStatusSelect({
  empId,
  status,
  canEdit,
}: {
  empId: string;
  status: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const current = normalizeEmployeeStatusKey(status) || "ACTIVE";

  async function handleChange(next: string) {
    const nextKey = normalizeEmployeeStatusKey(next);
    if (!nextKey || nextKey === current) return;
    setSaving(true);
    try {
      await hrmsService.updateEmployeeProfile(empId, { user_status: nextKey });
      await queryClient.invalidateQueries({ queryKey: ["employee-directory", "onboard"] });
      await queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["offboarding"] });
      showSuccessToast(`Status changed to ${formatEmployeeStatusLabel(nextKey)}.`);
    } catch (err) {
      showErrorToast(
        toUserFriendlyApiErrorMessage(
          err,
          "Could not change the status. Serving Notice / Inactive need resignation and last working day set from the full profile."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit || !empId || empId === "—") {
    return <EmployeeStatusBadge status={status} />;
  }

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Select
        value={current}
        onValueChange={(value) => void handleChange(String(value))}
        disabled={saving}
      >
        <SelectPrimitive.Trigger
          aria-label="Employee status"
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-1 rounded-full outline-none",
            "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--wt-brand)_35%,transparent)]",
            saving ? "cursor-progress opacity-60" : "cursor-pointer"
          )}
        >
          <EmployeeStatusBadge status={current} />
          <ChevronDown className="size-3.5 shrink-0 text-wt-text-muted" aria-hidden />
        </SelectPrimitive.Trigger>
        <SelectContent align="end" className="min-w-[11rem]">
          {STATUS_OPTIONS.map((value) => (
            <SelectItem key={value} value={value}>
              <span className="flex items-center gap-2">
                <EmployeeStatusBadge status={value} />
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
