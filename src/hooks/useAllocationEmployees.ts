"use client";

import { useQuery } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import {
  ALLOCATION_EMPLOYEES_PAGE,
  ALLOCATION_EMPLOYEES_SIZE,
} from "@/constants/allocationApi";
import { toPagedRows } from "@/utils/apiRows";
import { isEligibleForProjectAllocation } from "@/utils/userStatus";
import {
  parseActiveOnboardEmployees,
  type AllocationEmployeeOption,
} from "@/utils/allocationEmployees";

async function fetchActiveOnboardEmployees(): Promise<AllocationEmployeeOption[]> {
  // No onboardingStatus filter here: the backend turns that into a literal
  // `User.status == "ACTIVE"` match, which would drop Serving Notice employees
  // before isEligibleForProjectAllocation below (which already allows both
  // ACTIVE and SERVING_NOTICE) ever gets to see them.
  const onboardRes = await hrmsService.getOnboardList({
    page: ALLOCATION_EMPLOYEES_PAGE,
    size: ALLOCATION_EMPLOYEES_SIZE,
  });
  const rows = toPagedRows((onboardRes as { data?: unknown }).data ?? onboardRes).filter((row) =>
    isEligibleForProjectAllocation(row.status)
  );
  return parseActiveOnboardEmployees(rows);
}

/** Active + Serving Notice employees from GET /api/v1/user/onboard — allocate-form employee directory */
export function useAllocationEmployees(enabled = true) {
  return useQuery({
    queryKey: [
      "allocation",
      "employees",
      "active",
      ALLOCATION_EMPLOYEES_PAGE,
      ALLOCATION_EMPLOYEES_SIZE,
    ],
    enabled,
    queryFn: fetchActiveOnboardEmployees,
    staleTime: 60_000,
  });
}
