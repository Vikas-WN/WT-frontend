"use client";

import {
  Briefcase,
  Send,
  User,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResumeDropZone } from "@/components/dashboard/referral/resume-drop-zone/resume-drop-zone";
import {
  STEP_LABELS,
  REFERRAL_FORM_COPY,
} from "@/components/dashboard/referral/referral-form/referral-form.constants";
import type { ReferralFormProps } from "@/components/dashboard/referral/referral-form/referral-form.types";
import "./referral-form.css";

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="step-indicator">
      {(STEP_LABELS as readonly string[]).map((label, idx) => {
        const n = (idx + 1) as 1 | 2;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-2 flex-1">
            <span className={`step-dot ${active ? "step-dot--active" : "step-dot--inactive"}`}>
              {n}
            </span>
            <span className={`step-label ${active ? "step-label--active" : "step-label--inactive"}`}>
              {label}
            </span>
            {n === 1 && <div className="step-separator" />}
          </div>
        );
      })}
    </div>
  );
}

export function ReferralForm({
  jobs,
  selectedJob,
  resume,
  candidateName,
  candidateEmail,
  step,
  onSelectJob,
  onPickResume,
  onCandidateNameChange,
  onCandidateEmailChange,
  onNextStep,
  onPrevStep,
  canSend,
  sending,
  onSend,
}: ReferralFormProps) {
  const step1Valid = Boolean(selectedJob && candidateName.trim() && candidateEmail.trim());

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {step === 1 && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-wt-text">
              {REFERRAL_FORM_COPY.selectPosition} <span className="text-destructive">*</span>
            </label>
            <Select
              value={selectedJob?.title ?? ""}
              onValueChange={(title) =>
                onSelectJob(jobs.find((j) => j.title === title) ?? null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={REFERRAL_FORM_COPY.choosePosition} />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.title}>
                    <span className="flex items-center gap-2">
                      <Briefcase className="size-3.5 shrink-0 text-wt-text-muted" />
                      {job.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-wt-text">
              {REFERRAL_FORM_COPY.candidateName} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-muted" />
              <Input
                className="pl-10"
                placeholder="John Doe"
                value={candidateName}
                onChange={(e) => onCandidateNameChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-wt-text">
              {REFERRAL_FORM_COPY.candidateEmail} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-muted" />
              <Input
                className="pl-10"
                type="email"
                placeholder="john@example.com"
                value={candidateEmail}
                onChange={(e) => onCandidateEmailChange(e.target.value)}
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

          {!resume && <p className="form-hint">{REFERRAL_FORM_COPY.hintUploadResume}</p>}
        </>
      )}
    </div>
  );
}
