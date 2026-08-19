"use client";

import { useQuery } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";

export type RoleEmployeeOption = {
  employeeId: string | null;
  name: string;
  email: string;
  status: string | null;
};

type RoleEmployeeRow = Record<string, unknown>;

function parseRoleEmployeeOptions(payload: unknown): RoleEmployeeOption[] {
  const root = payload as { data?: unknown; items?: unknown; managers?: unknown } | null;
  const nested = root && typeof root === "object" ? root.data : null;
  const nestedObj =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as { items?: unknown; managers?: unknown; data?: unknown })
      : null;
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(nested)
      ? nested
      : Array.isArray(nestedObj?.items)
        ? nestedObj.items
        : Array.isArray(nestedObj?.managers)
          ? nestedObj.managers
          : Array.isArray(nestedObj?.data)
            ? nestedObj.data
            : Array.isArray(root?.items)
              ? root.items
              : Array.isArray(root?.managers)
                ? root.managers
                : [];
  const out: RoleEmployeeOption[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as RoleEmployeeRow;
    const email = String(r.email ?? "").trim().toLowerCase();
    if (!email) continue;
    const name = String(r.name ?? r.email ?? "").trim();
    out.push({
      employeeId: r.employee_id != null ? String(r.employee_id) : null,
      name,
      email,
      status: r.status != null ? String(r.status).toUpperCase() : null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function useRoleEmployeeOptions(role: "AM" | "DM", enabled = true) {
  const queryFn =
    role === "AM"
      ? () => hrmsService.listAccountManagers()
      : () => hrmsService.listDeliveryManagers();
  return useQuery({
    queryKey: ["employees", "role-options", role],
    enabled,
    queryFn: async (): Promise<RoleEmployeeOption[]> => {
      const res = await queryFn();
      return parseRoleEmployeeOptions(res);
    },
    staleTime: 300_000,
    gcTime: 600_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
