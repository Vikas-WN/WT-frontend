"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import { AdaptiveSelectField } from "@/components/dashboard/ui/forms";
import { hrmsService } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import type { OnboardListItem } from "@/types/onboard";
import { useAuth } from "@/context/AuthContext";
import {
  PORTAL_ROLE_SELECT_OPTIONS,
  formatPrimaryPortalRoleLabel,
  normalizePortalRoles,
  pickPrimaryPortalRole,
  portalRoleOptionsForActor,
} from "@/utils/roles";
import { isPreActiveEmployeeStatus } from "@/utils/userStatus";
import { cn } from "@/lib/utils";

type Props = {
  email: string;
  portalRoles: unknown;
  canEdit: boolean;
  /** Employee lifecycle status — Invited users cannot change portal role. */
  employeeStatus?: unknown;
  compact?: boolean;
};

function rolesForPortalSelection(nextRole: string): string[] {
  return nextRole === "ROLE_EMPLOYEE" ? ["ROLE_EMPLOYEE"] : [nextRole];
}

function isInvitedEmployeeStatus(status: unknown): boolean {
  return isPreActiveEmployeeStatus(status);
}

function LockedPortalRoleChip({
  label,
  invited,
  compact,
}: {
  label: string;
  invited: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        // Match table-inline / form select chrome so locked rows don't look like a different control.
        "inline-flex w-full max-w-full items-center gap-1.5 rounded-xl border border-wt-border bg-wt-surface-1 font-medium text-wt-text",
        "shadow-none dark:border-wt-border-md dark:bg-wt-surface-2",
        compact ? "h-9 min-h-9 px-2.5 text-xs" : "h-11 min-h-11 px-3.5 text-sm"
      )}
      title={
        invited
          ? "Portal role is locked until onboarding is complete"
          : "Portal role cannot be changed"
      }
      aria-disabled="true"
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Lock className="size-3.5 shrink-0 text-wt-text-muted" aria-hidden />
    </span>
  );
}

export function EmployeePortalRoleSelect({
  email,
  portalRoles,
  canEdit,
  employeeStatus,
  compact = false,
}: Props) {
  const queryClient = useQueryClient();
  const { user, refresh, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [optimisticRole, setOptimisticRole] = useState<string | null>(null);
  const roles = useMemo(() => normalizePortalRoles(portalRoles), [portalRoles]);
  const propRole = pickPrimaryPortalRole(roles);
  const currentRole = optimisticRole ?? propRole;
  const displayLabel = formatPrimaryPortalRoleLabel(
    optimisticRole ? [optimisticRole] : roles
  );
  // Admin is hidden from assignable options unless the viewer is already an Admin —
  // except the row's own current role, so an existing Admin's row still renders correctly.
  const assignableOptions = useMemo(() => {
    const base = portalRoleOptionsForActor(user?.roles ?? []);
    if (base.some((option) => option.value === currentRole)) return base;
    const currentOption = PORTAL_ROLE_SELECT_OPTIONS.find((option) => option.value === currentRole);
    return currentOption ? [...base, currentOption] : base;
  }, [user?.roles, currentRole]);
  const options = useMemo(
    () => assignableOptions.map((option) => ({ value: option.value, label: option.label })),
    [assignableOptions]
  );
  const invited = isInvitedEmployeeStatus(employeeStatus);
  const editable = canEdit && !invited;

  useEffect(() => {
    if (optimisticRole && propRole === optimisticRole) {
      setOptimisticRole(null);
    }
  }, [propRole, optimisticRole]);

  const patchCachedPortalRole = (
    targetEmail: string,
    nextRole: string,
    employeeStatus?: string | null
  ) => {
    const nextRoles = rolesForPortalSelection(nextRole);
    const emailKey = targetEmail.trim().toLowerCase();
    const nextStatus = employeeStatus?.trim() || null;

    queryClient.setQueriesData<OnboardListItem[]>(
      { queryKey: ["employee-directory", "onboard"] },
      (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((row) => {
          const rowEmail = String(row.email ?? "")
            .trim()
            .toLowerCase();
          if (!rowEmail || rowEmail !== emailKey) return row;
          return {
            ...row,
            portal_roles: nextRoles,
            portalRoles: nextRoles,
            ...(nextStatus
              ? {
                  status: nextStatus,
                }
              : {}),
          };
        });
      }
    );

    queryClient.setQueriesData<Record<string, unknown>>(
      { queryKey: ["employee-profile"] },
      (old) => {
        if (!old || typeof old !== "object" || Array.isArray(old)) return old;
        const profileEmail = String(old.email ?? "")
          .trim()
          .toLowerCase();
        if (profileEmail && profileEmail !== emailKey) return old;
        return {
          ...old,
          portal_roles: nextRoles,
          portalRoles: nextRoles,
          ...(nextStatus
            ? {
                status: nextStatus,
              }
            : {}),
        };
      }
    );
  };

  const persistRole = async (nextRole: string) => {
    const targetEmail = email.trim();
    if (!targetEmail || !nextRole || nextRole === currentRole) return;
    if (invited) {
      showErrorToast(
        "Portal role cannot be changed while the employee is Invited. Wait until onboarding is complete."
      );
      return;
    }
    setSaving(true);
    try {
      const res = await hrmsService.setPortalRole({ target_email: targetEmail, role: nextRole });
      const envelope = res as unknown as Record<string, unknown>;
      const data =
        envelope.data && typeof envelope.data === "object" && !Array.isArray(envelope.data)
          ? (envelope.data as Record<string, unknown>)
          : envelope;
      const onboardingReopened = Boolean(data.onboarding_reopened ?? data.onboardingReopened);
      const nextStatus = String(
        data.employee_status ?? data.employeeStatus ?? (onboardingReopened ? "INVITED" : "")
      ).trim();
      setOptimisticRole(nextRole);
      patchCachedPortalRole(targetEmail, nextRole, nextStatus || null);
      // Avoid refetching the directory list — onboard list often omits/lags portal_roles
      // and would overwrite the optimistic cache update.
      await queryClient.invalidateQueries({
        queryKey: ["employee-directory", "onboard"],
        refetchType: "none",
      });
      await queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
      // If HR demotes themselves (or changes their own portal role), refresh the session
      // so nav/permissions drop HR modules. Tokens are revoked server-side on role change,
      // so a failed refresh means they must sign in again with the new permissions.
      if (user?.email?.trim().toLowerCase() === targetEmail.trim().toLowerCase()) {
        try {
          const refreshed = await refresh();
          if (!refreshed) {
            await logout();
          }
        } catch {
          await logout();
        }
      }
      const successMessage =
        typeof data.message === "string" && data.message.trim()
          ? data.message.trim()
          : onboardingReopened
            ? "Portal role set to Employee. Onboarding was reopened — ask them to sign in and complete the form."
            : nextRole === "ROLE_EMPLOYEE"
              ? "Portal role set to Employee. Ask them to sign in again so Manager menus and permissions are cleared."
              : "Portal role changed successfully.";
      showSuccessToast(successMessage);
    } catch (err) {
      setOptimisticRole(null);
      showErrorToast(err instanceof Error ? err.message : "Could not update portal role.");
    } finally {
      setSaving(false);
    }
  };

  if (!editable) {
    return <LockedPortalRoleChip label={displayLabel} invited={invited} compact={compact} />;
  }

  if (compact) {
    return (
      <div
        className="w-full max-w-full min-w-0"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownSelect
          key={`${email}-${currentRole}`}
          value={currentRole}
          onChange={(next) => void persistRole(next)}
          options={options}
          disabled={saving}
          aria-label="Role"
          variant="table-inline"
          className="w-full min-w-0"
          contentClassName="min-w-[14rem] w-max"
          // Role is required — clearing via Backspace/Delete must not fire onChange("").
          clearSelectionOnEmptyInput={false}
        />
      </div>
    );
  }

  return (
    <div
      className="max-w-sm"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <AdaptiveSelectField
        label="Role"
        value={currentRole}
        placeholder="Select Role"
        options={assignableOptions}
        disabled={saving}
        onChange={(next) => void persistRole(next)}
        clearSelectionOnEmptyInput={false}
        inputClassName="[&>input]:pl-2.5"
      />
    </div>
  );
}
