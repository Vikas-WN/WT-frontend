"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { apiClient } from "@/api/httpClient";
import { REFERRAL_QUERY_KEYS } from "@/components/dashboard/referral/referral-page-client.constants";

type SubmitReferralPayload = {
  job_id: string;
  job_title: string;
  candidate_name: string;
  candidate_email: string;
  referrer_name: string;
  referrer_email: string;
  resume: File | null;
};

export function useReferralSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitReferralPayload) => {
      const formData = new FormData();
      formData.append("job_id", payload.job_id);
      formData.append("job_title", payload.job_title);
      formData.append("candidate_name", payload.candidate_name);
      formData.append("candidate_email", payload.candidate_email);
      formData.append("referrer_name", payload.referrer_name);
      formData.append("referrer_email", payload.referrer_email);
      if (payload.resume) {
        formData.append("resume", payload.resume);
      }

      await apiClient.post(endpoints.referral.root, {
        body: formData as unknown as BodyInit,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERRAL_QUERY_KEYS.all });
    },
  });
}
