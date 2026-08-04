"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { ExitInterviewFormFields } from "@/components/exit-interview/ExitInterviewFormFields";
import { WebTrakBrand } from "@/components/shared/WebTrakBrand";
import { ApiError } from "@/api/error";
import { exitInterviewService } from "@/services/exitInterview.service";
import {
  buildExitInterviewSubmitBody,
  initialFormAnswers,
  validateExitInterviewAnswers,
} from "@/utils/exitInterview";
import { applyResolvedTheme } from "@/utils/dashboard/theme";
import { formatApiDateDisplay } from "@/utils/apiDate";
import type { ExitSurveyMagicLinkContext } from "@/types/exit-interview";

type Blocker = { title: string; message: string };

function resolveLoadBlocker(error: unknown): Blocker {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 404:
        return {
          title: "Link not found",
          message:
            "This exit survey link is invalid or has been removed. Please contact HR to receive a new link.",
        };
      case 410:
        return {
          title: "Link expired",
          message:
            "This exit survey link has expired or has already been used. Please contact HR to receive a new link.",
        };
      case 403:
      case 401:
        return {
          title: "Access denied",
          message:
            "You do not have access to this exit survey. Open it from the secure link sent to your registered email.",
        };
      case 409:
        return {
          title: "Already submitted",
          message: "Your exit survey has already been submitted. Thank you!",
        };
      default:
        return {
          title: "Something went wrong",
          message:
            error.message || "Unable to load the exit survey. Please try again later.",
        };
    }
  }
  return {
    title: "Something went wrong",
    message: "Unable to load the exit survey. Please try again later.",
  };
}

function resolveSubmitBlocker(error: unknown): Blocker | null {
  if (error instanceof ApiError) {
    if (error.status === 403 || error.status === 401) {
      return {
        title: "Access denied",
        message:
          "You do not have access to this exit survey. Open it from the secure link sent to your registered email.",
      };
    }
    if (error.status === 410) {
      return {
        title: "Link expired",
        message:
          "This exit survey link has expired or has already been used. Please contact HR to receive a new link.",
      };
    }
    if (error.status === 409) {
      return {
        title: "Already submitted",
        message: "Your exit survey has already been submitted. Thank you!",
      };
    }
  }
  return null;
}

function PublicBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 bg-[var(--wt-bg)]" aria-hidden="true">
      <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-[var(--wt-brand)]/20 blur-[100px]" />
      <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-[var(--wt-brand)]/10 blur-[90px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_55%)]" />
    </div>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-[var(--wt-bg)] text-wt-text">
      <PublicBackdrop />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-10 sm:px-8">
        <header className="flex items-center justify-between">
          <WebTrakBrand variant="login" />
        </header>
        <main className="flex flex-1 flex-col justify-center py-8">{children}</main>
        <footer className="pb-2 text-center text-xs text-wt-text-faint">
          © {new Date().getFullYear()} WebTrak. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div
      className="rounded-2xl border border-wt-border bg-wt-surface-1/95 p-6 shadow-xl backdrop-blur-sm sm:p-8"
      aria-busy="true"
    >
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="mt-6">
        <FormFieldsSkeleton rows={5} />
      </div>
    </div>
  );
}

function BlockerCard({ blocker }: { blocker: Blocker }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-wt-border bg-wt-surface-1/95 p-6 text-center shadow-xl backdrop-blur-sm sm:p-8"
    >
      <h1 className="text-xl font-semibold tracking-tight text-wt-text">{blocker.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-wt-text-muted">
        {blocker.message}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-8 rounded-xl px-5"
        onClick={() => {
          window.location.href = "/login";
        }}
      >
        Return to login
      </Button>
    </div>
  );
}

function ThankYouCard() {
  return (
    <div className="rounded-2xl border border-wt-border bg-wt-surface-1/95 p-6 text-center shadow-xl backdrop-blur-sm sm:p-8">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-xl text-emerald-400">
        ✓
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-wt-text">
        Thank you — your exit survey has been submitted
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-wt-text-muted">
        Your responses have been recorded and will be reviewed by HR. You can close this page.
      </p>
    </div>
  );
}

/** Public, no-login exit survey flow for offboarded interns opening their emailed magic link. */
export function ExitSurveyMagicLinkClient({ token }: { token: string }) {
  const [phase, setPhase] = useState<"loading" | "ready" | "submitting" | "submitted">("loading");
  const [blocker, setBlocker] = useState<Blocker | null>(null);
  const [context, setContext] = useState<ExitSurveyMagicLinkContext | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const didLoad = useRef(false);

  useEffect(() => {
    applyResolvedTheme("dark");
  }, []);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    exitInterviewService
      .getMagicLinkContext(token)
      .then((res) => {
        setContext(res.data);
        setAnswers(initialFormAnswers(res.data.form));
        setPhase("ready");
      })
      .catch((error: unknown) => {
        setBlocker(resolveLoadBlocker(error));
        setPhase("submitted");
      });
  }, [token]);

  const onChange = useCallback((key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    if (!context || phase !== "ready") return;
    const errors = validateExitInterviewAnswers(context.form, answers);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitError(null);
    setPhase("submitting");
    try {
      await exitInterviewService.submitViaMagicLink(
        token,
        buildExitInterviewSubmitBody(context.form, answers)
      );
      setPhase("submitted");
    } catch (error: unknown) {
      const resolved = resolveSubmitBlocker(error);
      if (resolved) {
        setBlocker(resolved);
        setPhase("submitted");
        return;
      }
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "Unable to submit the exit survey. Please try again."
      );
      setPhase("ready");
    }
  };

  if (blocker) {
    return (
      <PublicShell>
        <BlockerCard blocker={blocker} />
      </PublicShell>
    );
  }

  if (phase === "submitted") {
    return (
      <PublicShell>
        <ThankYouCard />
      </PublicShell>
    );
  }

  if (phase === "loading" || !context) {
    return (
      <PublicShell>
        <LoadingCard />
      </PublicShell>
    );
  }

  const { form, prefill } = context;
  const submitting = phase === "submitting";

  return (
    <PublicShell>
      <div className="rounded-2xl border border-wt-border bg-wt-surface-1/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[var(--wt-brand)]">Exit Survey</p>
          <h1 className="text-2xl font-semibold tracking-tight text-wt-text">
            Welcome{context.employee_name ? `, ${context.employee_name}` : ""}
          </h1>
          {context.email ? (
            <p className="text-sm text-wt-text-muted">{context.email}</p>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 rounded-xl border border-wt-border bg-wt-surface-1 p-4 text-sm sm:grid-cols-2">
          <div>
            <span className="text-wt-text-muted">Resignation date</span>
            <p className="font-medium tabular-nums">
              {formatApiDateDisplay(context.resignation_date) || "—"}
            </p>
          </div>
          <div>
            <span className="text-wt-text-muted">Last working day</span>
            <p className="font-medium tabular-nums">
              {formatApiDateDisplay(context.last_working_day) || "—"}
            </p>
          </div>
        </div>

        {context.expires_at ? (
          <p className="mt-3 text-xs text-wt-text-faint">
            This link is valid until {formatApiDateDisplay(context.expires_at)}.
          </p>
        ) : null}

        {form.fields.length ? (
          <div className="mt-6">
            <ExitInterviewFormFields
              fields={form.fields}
              autofill={prefill}
              answers={answers}
              errors={fieldErrors}
              onChange={onChange}
              disabled={submitting}
              reportingManagersAsText
            />
            {submitError ? (
              <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-200">
                {submitError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end">
              <Button
                variant="brand"
                size="sm"
                type="button"
                className="px-4 py-2 text-sm"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting…" : "Submit Exit Survey"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </PublicShell>
  );
}
