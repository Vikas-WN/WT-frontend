"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  MAX_PROJECTS,
  computeProgress,
  draftFromSubmission,
  toApiPayload,
  type ReviewContext,
} from "@/components/dashboard/pulse/employee/review/reviewModel";
import { useSaveDraft, useSubmitSelfReview } from "@/hooks/pulse/usePulse";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { MonthlySubmissionDraftPayload, MonthlySubmissionItem } from "@/types/kpi";

const AUTOSAVE_DELAY_MS = 900;

export type SaveState = "saved" | "saving" | "error";

/** Local form state for the monthly self review, with debounced autosave and
 *  live validation. Components stay presentational; this owns the editing. */
export function useReviewForm(initial: MonthlySubmissionItem, ctx: ReviewContext, onSubmitted: () => void) {
  // The form owns its edits while mounted (a draft is fetched once per mount).
  const [form, setForm] = useState<MonthlySubmissionDraftPayload>(() => draftFromSubmission(initial));
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const saveDraft = useSaveDraft();
  const submit = useSubmitSelfReview();

  // Autosave: debounce edits, PUT only when the payload really changed.
  const debounced = useDebouncedValue(form, AUTOSAVE_DELAY_MS);
  const lastSaved = useRef<string>(JSON.stringify(draftFromSubmission(initial)));
  const { mutate: persist } = saveDraft;
  useEffect(() => {
    const serialized = JSON.stringify(debounced);
    if (serialized === lastSaved.current) return;
    lastSaved.current = serialized;
    // Mirrors the in-flight save into the header indicator.
    setSaveState("saving");
    persist(toApiPayload(debounced), {
      onSuccess: () => setSaveState("saved"),
      onError: () => setSaveState("error"),
    });
  }, [debounced, persist]);

  const progress = computeProgress(form, ctx);

  const toggleProject = useCallback(
    (code: string) =>
      setForm((f) => {
        // Prune projects the employee is no longer on, so they don't eat into
        // the cap invisibly.
        const current = f.project_codes.filter((c) => ctx.projectRows.some((p) => p.code === c));
        if (current.includes(code)) return { ...f, project_codes: current.filter((c) => c !== code) };
        if (current.length >= MAX_PROJECTS) return f;
        return { ...f, project_codes: [...current, code] };
      }),
    [ctx.projectRows]
  );

  // A KPI's rating and its reason are one entry; either can be set first, so the
  // other half is kept (a not-yet-chosen rating is 0 and never leaves the browser).
  const setKpi = useCallback(
    (kpiId: number, patch: { rating?: number; comment?: string }) =>
      setForm((f) => {
        const existing = f.kpi_ratings.find((r) => r.kpi_id === kpiId);
        const next = {
          kpi_id: kpiId,
          rating: patch.rating ?? existing?.rating ?? 0,
          comment: patch.comment ?? existing?.comment ?? "",
        };
        return { ...f, kpi_ratings: [...f.kpi_ratings.filter((r) => r.kpi_id !== kpiId), next] };
      }),
    []
  );

  const setValue = useCallback(
    (valueId: number, patch: { rating?: number; comment?: string }) =>
      setForm((f) => {
        const existing = f.value_ratings.find((r) => r.value_id === valueId);
        const next = {
          value_id: valueId,
          rating: patch.rating ?? existing?.rating ?? 0,
          comment: patch.comment ?? existing?.comment ?? "",
        };
        return { ...f, value_ratings: [...f.value_ratings.filter((r) => r.value_id !== valueId), next] };
      }),
    []
  );

  const toggleCertification = useCallback(
    (certificationId: number) =>
      setForm((f) => {
        const has = f.certifications.some((c) => c.certification_id === certificationId);
        return {
          ...f,
          certifications: has
            ? f.certifications.filter((c) => c.certification_id !== certificationId)
            : [...f.certifications, { certification_id: certificationId, proof: "" }],
        };
      }),
    []
  );

  const setCertificationProof = useCallback(
    (certificationId: number, proof: string) =>
      setForm((f) => ({
        ...f,
        certifications: f.certifications.map((c) => (c.certification_id === certificationId ? { ...c, proof } : c)),
      })),
    []
  );

  const patch = useCallback(
    (changes: Partial<MonthlySubmissionDraftPayload>) => setForm((f) => ({ ...f, ...changes })),
    []
  );

  const send = () => {
    if (!progress.canSubmit) return;
    const selected = form.project_codes.filter((c) => ctx.projectRows.some((p) => p.code === c));
    submit.mutate({ ...toApiPayload(form), project_codes: selected }, { onSuccess: onSubmitted });
  };

  return {
    form,
    progress,
    saveState,
    submitting: submit.isPending,
    actions: { toggleProject, setKpi, setValue, toggleCertification, setCertificationProof, patch, send },
  };
}

export type ReviewFormApi = ReturnType<typeof useReviewForm>;
