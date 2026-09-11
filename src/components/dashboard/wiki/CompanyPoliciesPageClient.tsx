"use client";

import { WikiSpacePageClient } from "@/components/dashboard/wiki/WikiSpacePageClient";

export function CompanyPoliciesPageClient() {
  return (
    <WikiSpacePageClient
      space="POLICY"
      title="Company Policies"
      description="The Employee Handbook and other company policies. HR/Admin keep these up to date."
    />
  );
}
