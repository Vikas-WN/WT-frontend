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
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown } | null)?.data)
      ? ((payload as { data: unknown }).data as unknown[])
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
