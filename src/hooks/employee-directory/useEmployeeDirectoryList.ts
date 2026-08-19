"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { hrmsService } from "@/services/hrms.service";
import type { OnboardListData, OnboardListItem } from "@/types/onboard";
import { toPagedRows } from "@/utils/apiRows";

type Options = { enabled?: boolean };

const DIRECTORY_PAGE_SIZE = 500;
/** Safety cap: 500 × 40 = 20k employees (directory must not silently truncate). */
const DIRECTORY_MAX_PAGES = 40;

function readOnboardListPage(res: { data?: unknown }): {
  items: OnboardListItem[];
  total: number | null;
} {
  const data = res.data;
  const items = toPagedRows(data) as unknown as OnboardListItem[];
  let total: number | null = null;
  if (data && typeof data === "object") {
    const reported = (data as OnboardListData).total;
    if (typeof reported === "number" && Number.isFinite(reported) && reported >= 0) {
      total = reported;
    }
  }
  return { items, total };
}

/**
 * Page through GET /user/onboard until every non-deleted user is loaded.
 * A single `size=500` call drops newer employees (API orders by id ASC).
 */
export async function fetchAllEmployeeDirectoryRows(params?: {
  search?: string;
  userType?: string;
  onboardingStatus?: string;
}): Promise<OnboardListItem[]> {
  const all: OnboardListItem[] = [];
  let page = 0;

  while (page < DIRECTORY_MAX_PAGES) {
    const query: Record<string, string> = {
      page: String(page),
      size: String(DIRECTORY_PAGE_SIZE),
    };
    if (params?.search?.trim()) query.search = params.search.trim();
    if (params?.userType?.trim()) query.type = params.userType.trim();
    if (params?.onboardingStatus?.trim()) {
      query.onboardingStatus = params.onboardingStatus.trim();
    }

    const { items, total } = readOnboardListPage(await hrmsService.getOnboardList(query));
    if (!items.length) break;
    all.push(...items);
    if (total != null && all.length >= total) break;
    if (items.length < DIRECTORY_PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

/**
 * GET /api/v1/user/onboard — full employee directory for HR + AM.
 * Loads every page so ACTIVE employees past the first 500 are still searchable.
 * @see endpoints.user.onboard
 */
export function useEmployeeDirectoryList(options?: Options) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ["employee-directory", "onboard", endpoints.user.onboard, "all-pages"],
    enabled,
    queryFn: () => fetchAllEmployeeDirectoryRows(),
    // Presence (Online Now) must not sit on a multi-minute cache after logout.
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
