"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import {
  Briefcase,
  Send,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Check,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { ResumeDropZone } from "@/components/dashboard/referral/resume-drop-zone/resume-drop-zone";
import { useReferralJobsInfinite } from "@/components/dashboard/referral/hooks/use-referral-jobs-infinite";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Timeline } from "@/components/dashboard/referral/referral-form/timeline";
import {
  REFERRAL_FORM_COPY,
} from "@/components/dashboard/referral/referral-form/referral-form.constants";
import type { ReferralFormProps } from "@/components/dashboard/referral/referral-form/referral-form.types";
import type { Job } from "@/components/dashboard/referral/referral-page-client.types";
import "./referral-form.css";

export function ReferralForm({
  selectedJob,
  resume,
  candidateName,
  candidateEmail,
  candidatePhone,
  step,
  onSelectJob,
  onPickResume,
  onCandidateNameChange,
  onCandidateEmailChange,
  onCandidatePhoneChange,
  onNextStep,
  onPrevStep,
  canSend,
  sending,
  onSend,
}: ReferralFormProps) {
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterText, setFilterText] = useState("");
  const debouncedFilter = useDebouncedValue(filterText, 300);
  const { jobs, isLoading, isFetchingNextPage, hasMore, error, loadMore } = useReferralJobsInfinite(debouncedFilter);

  const hasNumericName = /\d/.test(candidateName);
  const isInvalidEmail = candidateEmail.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail.trim());
  const step1Valid = Boolean(selectedJob && candidateName.trim() && !hasNumericName && candidateEmail.trim() && !isInvalidEmail && candidatePhone.trim());

  const handleIntersect = useCallback(() => {
    if (hasMore && !isFetchingNextPage) {
      loadMore();
    }
  }, [hasMore, isFetchingNextPage, loadMore]);

  const handleSelect = useCallback(
    (title: string | null, _eventDetails?: object) => {
      const job = title ? jobs.find((j: Job) => j.title === title) ?? null : null;
      onSelectJob(job);
      setIsFiltering(false);
      setFilterText("");
    },
    [jobs, onSelectJob]
  );

  useEffect(() => {
    setIsFiltering(false);
    setFilterText("");
  }, [selectedJob?.id]);

  const handleInputValueChange = useCallback(
    (next: string | null, _details?: object) => {
      const value = next ?? "";
      if (value === "") {
        setIsFiltering(false);
        setFilterText("");
        return;
      }
      setIsFiltering(true);
      setFilterText(value);
    },
    []
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setIsFiltering(false);
      setFilterText("");
    }
  }, []);

  const inputValue = isFiltering ? filterText : (selectedJob?.title ?? "");

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore || isFetchingNextPage) return;
      const el = e.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
        loadMore();
      }
    },
    [hasMore, isFetchingNextPage, loadMore]
  );

  const showLoading = isLoading && jobs.length === 0;

  return (
    <div className="space-y-4">
      <Timeline step={step} />

      {step === 1 && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-wt-text">
              {REFERRAL_FORM_COPY.selectPosition} <span className="text-destructive">*</span>
            </label>
            <Combobox
              value={selectedJob?.title ?? ""}
              onValueChange={handleSelect}
              inputValue={inputValue}
              onInputValueChange={handleInputValueChange}
              onOpenChange={handleOpenChange}
              itemToStringValue={(v) => v}
              
            >
              <ComboboxInput
                placeholder={REFERRAL_FORM_COPY.choosePosition}
                className="h-10 mt-[5px]"
              />
              <ComboboxContent className="min-w-[calc(var(--anchor-width)+1.5rem)]">
                <ComboboxList onScroll={handleScroll}>
                  {showLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="size-5 animate-spin text-slate-400" />
                    </div>
                  ) : error ? (
                    <p className="px-3 py-4 text-center text-sm text-rose-500">{error}</p>
                  ) : jobs.length === 0 ? (
                    <ComboboxEmpty>{REFERRAL_FORM_COPY.noMatch}</ComboboxEmpty>
                  ) : (
                    jobs.map((job: Job) => (
                      <ComboboxItem key={job.id} value={job.title}>
                        <Briefcase className="size-3.5 shrink-0 text-wt-text-muted" />
                        <span className="flex-1 truncate">{job.title}</span>
                        {selectedJob?.id === job.id && (
                          <Check className="size-3.5 text-wt-text-muted" />
                        )}
                      </ComboboxItem>
                    ))
                  )}
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="size-4 animate-spin text-slate-400" />
                    </div>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-wt-text">
              {REFERRAL_FORM_COPY.candidateName} <span className="text-destructive">*</span>
            </label>
            <div className="relative mt-[5px]">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-muted" />
              <Input
                className="pl-10"
                placeholder="John Doe"
                value={candidateName}
                onChange={(e) => onCandidateNameChange(e.target.value)}
              />
            </div>
            {hasNumericName && (
              <p className="text-xs text-destructive mt-1">Should not contain numbers</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-wt-text">
              {REFERRAL_FORM_COPY.candidateEmail} <span className="text-destructive">*</span>
            </label>
            <div className="relative mt-[5px]">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-muted" />
              <Input
                className="pl-10"
                type="email"
                placeholder="john@example.com"
                value={candidateEmail}
                onChange={(e) => onCandidateEmailChange(e.target.value)}
              />
            </div>
            {isInvalidEmail && (
              <p className="text-xs text-destructive mt-1">Enter a valid email address</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-wt-text">
              {REFERRAL_FORM_COPY.candidatePhone} <span className="text-destructive">*</span>
            </label>
            <div className="relative mt-[5px]">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-muted" />
              <Input
                className="pl-10"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={candidatePhone}
                onChange={(e) => onCandidatePhoneChange(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="w-full gap-2"
            size="lg"
            disabled={!step1Valid}
            onClick={onNextStep}
          >
            {REFERRAL_FORM_COPY.next}
          </Button>

          {!step1Valid && (
            <p className="form-hint">{REFERRAL_FORM_COPY.hintFillAll}</p>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-wt-text">
              {REFERRAL_FORM_COPY.resume} <span className="text-destructive">*</span>
            </label>
            <ResumeDropZone file={resume} onPick={onPickResume} />
          </div>

          <div className="flex gap-3">
            <Button
              className="gap-2"
              variant="outline"
              size="lg"
              onClick={onPrevStep}
            >
              <ArrowLeft className="size-4" />
              {REFERRAL_FORM_COPY.back}
            </Button>
            <Button
              className="flex-1 gap-2"
              size="lg"
              disabled={!resume}
              onClick={onNextStep}
            >
              {REFERRAL_FORM_COPY.next}
            </Button>
          </div>

          {!resume && <p className="form-hint">{REFERRAL_FORM_COPY.hintUploadResume}</p>}
        </>
      )}

      {step === 3 && (
        <>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-wt-border dark:bg-wt-surface-2">
            <span className="text-wt-text-muted">Position</span>
            <span className="font-medium text-wt-text">{selectedJob?.title}</span>

            <span className="text-wt-text-muted">Candidate</span>
            <span className="font-medium text-wt-text">{candidateName}</span>

            <span className="text-wt-text-muted">Email</span>
            <span className="font-medium text-wt-text">{candidateEmail}</span>

            <span className="text-wt-text-muted">Phone</span>
            <span className="font-medium text-wt-text">{candidatePhone || "—"}</span>

            <span className="text-wt-text-muted">Resume</span>
            <span className="font-medium text-wt-text min-w-0">
              {resume ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 max-w-full dark:border-wt-border dark:bg-wt-surface-1">
                  <FileText className="size-3.5 shrink-0 text-indigo-500" />
                  <span className="truncate">{resume.name}</span>
                </span>
              ) : (
                "—"
              )}
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              className="gap-2"
              variant="outline"
              size="lg"
              onClick={onPrevStep}
            >
              <ArrowLeft className="size-4" />
              {REFERRAL_FORM_COPY.back}
            </Button>
            <Button
              className="flex-1 gap-2"
              size="lg"
              disabled={!canSend || sending}
              onClick={onSend}
            >
              {sending ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {REFERRAL_FORM_COPY.sending}
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {REFERRAL_FORM_COPY.sendReferral}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
