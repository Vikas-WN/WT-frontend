"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { useReferralJobs } from "@/components/dashboard/referral/hooks/use-referral-jobs";
import { useReferralList } from "@/components/dashboard/referral/hooks/use-referral-list";
import { useReferralSubmit } from "@/components/dashboard/referral/hooks/use-referral-submit";
import { JobList } from "@/components/dashboard/referral/job-list/job-list";
import { ReferralForm } from "@/components/dashboard/referral/referral-form/referral-form";
import { MyReferralsTable } from "@/components/dashboard/referral/my-referrals-table";
import { MobileDrawer } from "@/components/dashboard/referral/mobile-drawer/mobile-drawer";
import { REFERRAL_PAGE_SIZE, REFERRAL_QUERY_KEYS } from "@/components/dashboard/referral/referral-page-client.constants";
import type { Job } from "@/components/dashboard/referral/referral-page-client.types";

export function ReferralPageClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("refer");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedQ = useDebouncedValue(searchQuery, 300);

  const prevQ = useRef(debouncedQ);
  if (prevQ.current !== debouncedQ) {
    prevQ.current = debouncedQ;
    setPage(1);
  }

  const { jobs, total, isLoading, error } = useReferralJobs(debouncedQ, page);

  const userEmail = user?.email ?? "";
  const {
    items: myReferrals,
    total: myTotal,
    isLoading: listLoading,
    isRefetching: listRefetching,
    error: listError,
  } = useReferralList(userEmail);

  const submitMutation = useReferralSubmit();

  const handleSelectJob = useCallback((job: Job) => {
    setSelectedJob(job);
    setStep(1);
    setDrawerOpen(true);
  }, []);

  const handleSend = useCallback(async () => {
    if (!selectedJob || !resume || !user) return;
    try {
      await submitMutation.mutateAsync({
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        candidate_phone: candidatePhone,
        referrer_name: user.name ?? user.email ?? "",
        referrer_email: user.email ?? "",
        resume,
      });
      showSuccessToast("Referral submitted — ATS scoring runs in the background");
      setResume(null);
      setSelectedJob(null);
      setCandidateName("");
      setCandidateEmail("");
      setCandidatePhone("");
      setStep(1);
      setDrawerOpen(false);
      setTab("my");
    } catch (err) {
      showErrorToast(
        toUserFriendlyApiErrorMessage(
          err,
          "Failed to submit referral. Please check the candidate details and try again."
        )
      );
    }
  }, [selectedJob, candidateName, candidateEmail, candidatePhone, resume, user, submitMutation]);

  const handleRefreshList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: REFERRAL_QUERY_KEYS.list(userEmail) });
  }, [queryClient, userEmail]);

  const handleNextStep = useCallback(() => {
    setStep(prev => Math.min(3, prev + 1) as 1 | 2 | 3);
  }, []);

  const handlePrevStep = useCallback(() => {
    setStep(prev => Math.max(1, prev - 1) as 1 | 2 | 3);
  }, []);

  const canSend = Boolean(resume);
  const sending = submitMutation.isPending;

  return (
    <DashboardPageShell>
      <Tabs value={tab} onValueChange={setTab} className="min-w-0">
        <TabsList
          aria-label="Referral views"
          variant="default"
          className="mb-5 grid h-auto w-full grid-cols-2 gap-1 bg-slate-100 p-1 dark:bg-slate-800/70 ring-0 shadow-none sm:inline-flex sm:w-auto sm:grid-cols-none"
        >
          <TabsTrigger
            value="refer"
            className="data-active:bg-white data-active:text-slate-900 data-active:shadow-sm data-active:ring-0 dark:data-active:bg-slate-700 dark:data-active:text-slate-100 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3"
          >
            Refer a Candidate
          </TabsTrigger>
          <TabsTrigger
            value="my"
            className="data-active:bg-white data-active:text-slate-900 data-active:shadow-sm data-active:ring-0 dark:data-active:bg-slate-700 dark:data-active:text-slate-100 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3"
          >
            My Referrals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="refer">
          <div className="grid gap-6">
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

          <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <ReferralForm
              selectedJob={selectedJob}
              resume={resume}
              candidateName={candidateName}
              candidateEmail={candidateEmail}
              candidatePhone={candidatePhone}
              step={step}
              onSelectJob={setSelectedJob}
              onPickResume={setResume}
              onCandidateNameChange={setCandidateName}
              onCandidateEmailChange={setCandidateEmail}
              onCandidatePhoneChange={setCandidatePhone}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
              canSend={canSend}
              sending={sending}
              onSend={handleSend}
            />
          </MobileDrawer>
        </TabsContent>

        <TabsContent value="my">
          <MyReferralsTable
            items={myReferrals}
            total={myTotal}
            isLoading={listLoading}
            isRefetching={listRefetching}
            error={listError}
            onRefresh={handleRefreshList}
          />
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  );
}
