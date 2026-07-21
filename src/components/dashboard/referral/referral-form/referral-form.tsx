"use client";

import { Briefcase, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResumeDropZone } from "@/components/dashboard/referral/resume-drop-zone/resume-drop-zone";
import { REFERRAL_FORM_COPY } from "@/components/dashboard/referral/referral-form/referral-form.constants";
import type { ReferralFormProps } from "@/components/dashboard/referral/referral-form/referral-form.types";
import "./referral-form.css";

function Hint({ selectedJob, resume }: { selectedJob: boolean; resume: boolean }) {
  if (!selectedJob && !resume) return <p className="form-hint">{REFERRAL_FORM_COPY.hintBoth}</p>;
  if (!selectedJob) return <p className="form-hint">{REFERRAL_FORM_COPY.hintPosition}</p>;
  if (!resume) return <p className="form-hint">{REFERRAL_FORM_COPY.hintResume}</p>;
  return null;
}

export function ReferralForm({
  jobs,
  selectedJob,
  resume,
  onSelectJob,
  onPickResume,
  canSend,
  sending,
  onSend,
}: ReferralFormProps) {
  return (
    <div className="space-y-6">
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
          {REFERRAL_FORM_COPY.resume} <span className="text-destructive">*</span>
        </label>
        <ResumeDropZone file={resume} onPick={onPickResume} />
      </div>

      <Button
        className="w-full gap-2"
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

      {!canSend && <Hint selectedJob={Boolean(selectedJob)} resume={Boolean(resume)} />}
    </div>
  );
}
