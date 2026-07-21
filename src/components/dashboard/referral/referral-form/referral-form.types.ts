import type { Job } from "@/components/dashboard/referral/referral-page-client.types";

export interface ReferralFormProps {
  jobs: Job[];
  selectedJob: Job | null;
  resume: File | null;
  onSelectJob: (job: Job | null) => void;
  onPickResume: (file: File | null) => void;
  canSend: boolean;
  sending: boolean;
  onSend: () => void;
}
