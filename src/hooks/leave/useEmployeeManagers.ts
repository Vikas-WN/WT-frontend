"use client";

import { useQuery } from "@tanstack/react-query";
import { hrmsService, type LeaveManagerOption } from "@/services/hrms.service";
import { unwrapLeaveOptionItems } from "@/utils/leaveApiOptions";

export const EMPLOYEE_MANAGERS_QUERY_KEY = ["leave", "employee-managers"] as const;

export function employeeManagersQueryKey(search?: string) {
  const normalized = search?.trim() || "";
  return [...EMPLOYEE_MANAGERS_QUERY_KEY, normalized] as const;
}

export function useEmployeeManagers(search?: string, enabled = true) {
  const normalizedSearch = search?.trim() || "";

  return useQuery({
    queryKey: employeeManagersQueryKey(normalizedSearch),
    enabled,
    staleTime: 300_000,
    gcTime: 600_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<LeaveManagerOption[]> => {
      const res = await hrmsService.getLeaveManagerOptions(
        normalizedSearch ? { search: normalizedSearch } : undefined
      );
      const items = unwrapLeaveOptionItems<{
        email: string;
        name: string;
        employee_id?: string | null;
        employeeId?: string | null;
        emp_id?: string | null;
        empId?: string | null;
        project_code?: string | null;
        project_name?: string | null;
      }>(res);
      return items.map((item) => ({
        email: item.email,
        name: item.name,
        employee_id: item.employee_id ?? item.employeeId ?? item.emp_id ?? item.empId ?? null,
        project_code: item.project_code ?? null,
        project_name: item.project_name ?? null,
      }));
    },
  });
}
