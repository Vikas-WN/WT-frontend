"use client";

import { useState, useCallback, useRef } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useReferralJobs } from "@/components/dashboard/referral/hooks/use-referral-jobs";
import { useReferralSubmit } from "@/components/dashboard/referral/hooks/use-referral-submit";
import { JobList } from "@/components/dashboard/referral/job-list/job-list";
import { ReferralForm } from "@/components/dashboard/referral/referral-form/referral-form";
import { ReferralFormSkeleton } from "@/components/dashboard/referral/referral-form/referral-form-skeleton";
import { MobileDrawer } from "@/components/dashboard/referral/mobile-drawer/mobile-drawer";
import { REFERRAL_PAGE_SIZE } from "@/components/dashboard/referral/referral-page-client.constants";
import type { Job } from "@/components/dashboard/referral/referral-page-client.types";

export function ReferralPageClient() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedQ = useDebouncedValue(searchQuery, 300);

  const prevQ = useRef(debouncedQ);
  if (prevQ.current !== debouncedQ) {
    prevQ.current = debouncedQ;
    setPage(1);
  }

  const { jobs, total, isLoading, error } = useReferralJobs(debouncedQ, page);

  const submitMutation = useReferralSubmit();

  const handleSelectJob = useCallback((job: Job) => {
    setSelectedJob(job);
    setDrawerOpen(true);
  }, []);

  const handleSend = useCallback(async () => {
    if (!selectedJob || !resume || !user) return;
    try {
      await submitMutation.mutateAsync({
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        candidate_name: "Candidate",
        candidate_email: "candidate@example.com",
        referrer_name: user.name ?? user.email ?? "",
        referrer_email: user.email ?? "",
        resume,
      });
      showSuccessToast("Referral submitted successfully");
      setResume(null);
      setSelectedJob(null);
      setDrawerOpen(false);
    } catch {
      showErrorToast("Failed to submit referral");
    }
  }, [selectedJob, resume, user, submitMutation]);

  const canSend = Boolean(selectedJob && resume);
  const sending = submitMutation.isPending;

  return (
    <DashboardPageShell>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <JobList
            jobs={jobs}
            total={total}
            isLoading={isLoading}
            error={error}
            selectedJob={selectedJob}
            page={page}
            pageSize={REFERRAL_PAGE_SIZE}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectJob={handleSelectJob}
            onPageChange={setPage}
            onMobileDrawerOpen={() => setDrawerOpen(true)}
          />
        </div>

        <div className="hidden lg:block lg:col-span-2">
          {isLoading ? (
            <div className="sticky top-8">
              <ReferralFormSkeleton />
            </div>
          ) : (
            <Card className="sticky top-8 overflow-hidden">
              <CardHeader>
                <CardTitle>Refer a Candidate</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ReferralForm
                  jobs={jobs}
                  selectedJob={selectedJob}
                  resume={resume}
                  onSelectJob={setSelectedJob}
                  onPickResume={setResume}
                  canSend={canSend}
                  sending={sending}
                  onSend={handleSend}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <ReferralForm
          jobs={jobs}
          selectedJob={selectedJob}
          resume={resume}
          onSelectJob={setSelectedJob}
          onPickResume={setResume}
          canSend={canSend}
          sending={sending}
          onSend={handleSend}
        />
      </MobileDrawer>
    </DashboardPageShell>
  );
}
