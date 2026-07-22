import type { Job } from "@/components/dashboard/referral/referral-page-client.types";

export interface ReferralFormProps {
  jobs: Job[];
  selectedJob: Job | null;
  resume: File | null;
  candidateName: string;
  candidateEmail: string;
  step: 1 | 2;
  onSelectJob: (job: Job | null) => void;
  onPickResume: (file: File | null) => void;
  onCandidateNameChange: (value: string) => void;
  onCandidateEmailChange: (value: string) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  canSend: boolean;
  sending: boolean;
  onSend: () => void;
}
