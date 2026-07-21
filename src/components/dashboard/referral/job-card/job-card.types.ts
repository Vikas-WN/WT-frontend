import type { Job } from "@/components/dashboard/referral/referral-page-client.types";

export interface JobCardProps {
  job: Job;
  selected: boolean;
  onSelect: (job: Job) => void;
}
