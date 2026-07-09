"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useDashboardAction } from "@/components/dashboard/shared/useDashboardAction";
import { FormFieldsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { ExitInterviewFormFields } from "@/components/exit-interview/ExitInterviewFormFields";
import { useExitInterviewFormDefinition } from "@/hooks/exit-interview/useExitInterviewFormDefinition";
import { useExitInterviewProfile } from "@/hooks/exit-interview/useExitInterviewProfile";
import { exitInterviewService } from "@/services/exitInterview.service";
import {
  buildExitInterviewSubmitBody,
  canEmployeeAccessExitSurvey,
  initialFormAnswers,
  validateExitInterviewAnswers,
} from "@/utils/exitInterview";
import { isPreActiveEmployeeStatus, resolveEffectiveEmployeeStatus, resolveProfileStatus } from "@/utils/userStatus";

import { formatApiDateDisplay } from "@/utils/apiDate";
import { bannerClass } from "@/components/dashboard/ui/bannerTones";

function ExitSurveyDetailsSkeleton() {
  return (
    <div
      className="mt-4 grid gap-3 rounded-xl border border-wt-border bg-wt-surface-1 p-4 sm:grid-cols-2"
      aria-hidden
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-36" />
      </div>
    </div>
  );
}

/** Exit survey (employee self-serve, including offboarded users serving notice). */
export function ExitInterviewSurveyPanel({
  className = "",
}: {
  className?: string;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { actionLoading, runAction } = useDashboardAction();

  const profileQ = useExitInterviewProfile();
  const flags = profileQ.data?.flags;
  const autofill = profileQ.data?.autofill ?? {};
  const employeeStatus = resolveEffectiveEmployeeStatus(
    user?.status,
    resolveProfileStatus(profileQ.data?.profile, user)
  );

  const showForm = Boolean(
    flags &&
    canEmployeeAccessExitSurvey(flags, employeeStatus) &&
    flags.can_fill_exit_interview &&
    !flags.exit_interview_submitted,
  );

  const formDefQ = useExitInterviewFormDefinition({
    enabled: Boolean(
      flags &&
      canEmployeeAccessExitSurvey(flags, employeeStatus) &&
      !flags.exit_interview_submitted,
    ),
  });
  const fields = formDefQ.data?.fields ?? [];

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!formDefQ.data || initialized || !showForm) return;
    const initial = initialFormAnswers(formDefQ.data);
    const managerName = String(profileQ.data?.profile?.reporting_manager ?? "").trim();
    if (managerName) {
      initial.reporting_managers = managerName;
    }
    setAnswers(initial);
    setInitialized(true);
  }, [formDefQ.data, initialized, showForm, profileQ.data?.profile?.reporting_manager]);

  const daysLeft = flags?.exit_interview_days_until_last_working_day;

  const statusMessage = useMemo(() => {
    if (profileQ.isLoading) return null;
    if (isPreActiveEmployeeStatus(employeeStatus)) return null;
    if (!flags || !canEmployeeAccessExitSurvey(flags, employeeStatus)) return null;
    if (flags.exit_interview_submitted) {
      return "Thank you — your exit survey has been submitted. HR will review your responses.";
    }
    if (!flags.can_fill_exit_interview) {
      return "Your exit survey will be available during your notice period.";
    }
    return null;
  }, [profileQ.isLoading, flags, employeeStatus]);

  const onChange = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = () => {
    if (!formDefQ.data) return;
    const errors = validateExitInterviewAnswers(formDefQ.data, answers);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    void runAction("Submit exit survey", async () => {
      const body = buildExitInterviewSubmitBody(formDefQ.data, answers);
      await exitInterviewService.submit(body);
      await queryClient.invalidateQueries({
        queryKey: ["profile", "exit-interview"],
      });
      await queryClient.invalidateQueries({ queryKey: ["profile", "self"] });
      setInitialized(false);
    });
  };

  if (
    !profileQ.isLoading &&
    flags &&
    !flags.exit_interview_applicable &&
    (!canEmployeeAccessExitSurvey(flags, employeeStatus) ||
      isPreActiveEmployeeStatus(employeeStatus))
  ) {
    return null;
  }

  return (
    <div className={className}>
      <div className="rounded-2xl border border-wt-border bg-wt-surface-1 px-5 py-6 md:px-7">
        <h3 className="text-lg font-semibold">Exit Survey</h3>

        {profileQ.isLoading ? (
          <>
            <ExitSurveyDetailsSkeleton />
            <div className="mt-6">
              <FormFieldsSkeleton rows={6} />
            </div>
          </>
        ) : null}

        {profileQ.isError ? (
          <p className="mt-3 text-sm text-rose-600">
            Could not load your profile.
            {profileQ.error instanceof Error
              ? ` ${profileQ.error.message}`
              : ""}
          </p>
        ) : null}

        {!profileQ.isLoading && statusMessage ? (
          <p className="mt-3 text-sm text-wt-text-muted">{statusMessage}</p>
        ) : null}

        {!profileQ.isLoading && showForm && flags ? (
          <>
            <div className="mt-4 grid gap-3 rounded-xl border border-wt-border bg-wt-surface-1 p-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-wt-text-muted">Resignation date</span>
                <p className="font-medium tabular-nums">
                  {formatApiDateDisplay(flags.exit_interview_resignation_date) || "—"}
                </p>
              </div>
              <div>
                <span className="text-wt-text-muted">Last working day</span>
                <p className="font-medium tabular-nums">
                  {formatApiDateDisplay(flags.exit_interview_last_working_day) || "—"}
                </p>
              </div>
              {daysLeft != null ? (
                <div className="sm:col-span-2">
                  <span className="text-wt-text-muted">
                    Days until last working day
                  </span>
                  <p className="font-medium tabular-nums">{daysLeft}</p>
                </div>
              ) : null}
            </div>

            {formDefQ.isError ? (
              <p className="mt-6 text-sm text-rose-600">
                Could not load the survey questions.
              </p>
            ) : null}

            {formDefQ.isLoading ? (
              <div className="mt-6">
                <FormFieldsSkeleton rows={6} />
              </div>
            ) : null}

            {formDefQ.data && fields.length ? (
              <div className="mt-6">
                <ExitInterviewFormFields
                  fields={fields}
                  autofill={autofill}
                  answers={answers}
                  errors={fieldErrors}
                  onChange={onChange}
                  disabled={actionLoading}
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="brand"
                    size="sm"
                    type="button"
                    className="px-4 py-2 text-sm"
                    disabled={actionLoading}
                    onClick={handleSubmit}
                  >
                    {actionLoading ? "Submitting…" : "Submit Exit Survey"}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {!profileQ.isLoading && flags?.exit_interview_submitted ? (
          <div className={bannerClass("success", "mt-4")}>
            Your responses have been recorded and marked as completed. If HR needs changes, you will
            receive a notification to resubmit.
          </div>
        ) : null}
      </div>
    </div>
  );
}
