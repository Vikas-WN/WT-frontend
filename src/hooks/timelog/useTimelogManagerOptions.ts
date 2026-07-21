"use client";

import { useQuery } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import { toRows } from "@/utils/apiRows";

export type TimelogManagerOption = {
  email: string;
  name: string;
  employeeId?: string;
};

/**
 * Project managers for the Add Time Log picker.
 * GET /timelog/manager-options?projectCode=… — ROLE_MANAGER users assigned to that project.
 */
export function useTimelogManagerOptions(projectCode?: string | null, enabled = true) {
  const code = String(projectCode ?? "").trim().toUpperCase();
  return useQuery({
    queryKey: ["timelog", "manager-options", code],
    enabled: enabled && Boolean(code),
    staleTime: 60_000,
    queryFn: async (): Promise<TimelogManagerOption[]> => {
      const res = await hrmsService.getTimelogManagerOptions({ projectCode: code });
      const rows = toRows((res as { data?: unknown }).data ?? res);
      const seen = new Set<string>();
      const out: TimelogManagerOption[] = [];
      for (const row of rows) {
        const email = String(row.email ?? "").trim().toLowerCase();
        if (!email || seen.has(email)) continue;
        seen.add(email);
        out.push({
          email,
          name: String(row.name ?? email).trim() || email,
          employeeId:
            String(row.employee_id ?? row.employeeId ?? "").trim() || undefined,
        });
      }
      return out.sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}
