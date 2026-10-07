"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { SKILLS_QUERY_KEYS } from "@/constants/skillsMatrix";
import { hrmsService } from "@/services/hrms.service";

/** Runs the plain-English staffing question; the previous answer stays on screen while the next one loads. */
export function useSkillsSearch(query: string) {
  return useQuery({
    queryKey: SKILLS_QUERY_KEYS.search(query),
    queryFn: () => hrmsService.searchSkillsMatrix(query),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
