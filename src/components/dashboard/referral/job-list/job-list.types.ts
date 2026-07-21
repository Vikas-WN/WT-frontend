import type { Job } from "@/components/dashboard/referral/referral-page-client.types";

export interface JobListProps {
  jobs: Job[];
  total: number;
  isLoading: boolean;
  error: string | null;
  selectedJob: Job | null;
  page: number;
  pageSize: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectJob: (job: Job) => void;
  onPageChange: (page: number) => void;
  onMobileDrawerOpen: () => void;
}
