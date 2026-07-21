import type { QueryClient } from "@tanstack/react-query";
import { HR_PROJECTS_QUERY_KEY } from "@/hooks/allocation/useHrProjects";
import { TALENT_POOL_QUERY_KEY } from "@/hooks/allocation/useTalentPool";

export const MY_ALLOCATIONS_DETAIL_QUERY_KEY = ["my-allocations-detail"] as const;

/** Refresh allocation-dependent views after HR/manager mutations. */
export function invalidateAllocationDependentQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: MY_ALLOCATIONS_DETAIL_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ["allocation"] });
  void queryClient.invalidateQueries({ queryKey: ["clients"] });
  void queryClient.invalidateQueries({ queryKey: HR_PROJECTS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: TALENT_POOL_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ["project-timelogs-projects"] });
  void queryClient.invalidateQueries({ queryKey: ["leave", "my-allocations"] });
}
