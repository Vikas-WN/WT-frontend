"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { hrmsService } from "@/services/hrms.service";
import type { EmployeeSummary, ManagerReviewDraftState, MonthlySubmissionItem } from "@/types/kpi";
import {
  buildPatch,
  fieldsFromDraft,
  isEmptyPatch,
  mergeRemoteDraft,
  settleDirty,
  snapshotFields,
  type DirtyKey,
  type ReviewFields,
} from "@/utils/managerReviewDraft";

export const MANAGER_REVIEW_DRAFT_QUERY_KEY = ["pulse", "manager-review-draft"] as const;

/** How often an open review checks what the other managers have entered. */
const POLL_MS = 4_000;
/** Typing pauses this long before the change is sent, so each keystroke isn't a request. */
const SAVE_DEBOUNCE_MS = 600;
/** A co-manager who saved within this window counts as "editing right now". */
const CO_EDITOR_ACTIVE_MS = 2 * 60 * 1000;

const AWAITING_STATUSES = new Set(["SUBMITTED", "NEEDS_MANAGER_REVIEW"]);

export type DraftSaveState = "idle" | "saving" | "saved" | "error";

export interface ManagerReviewDraftApi {
  fields: ReviewFields;
  rateKpi: (kpiId: number, rating: number) => void;
  rateValue: (valueId: number, rating: number) => void;
  setComments: (comments: string) => void;
  /** Sends any unsaved change now. Call before submitting so the draft is current. */
  flush: () => Promise<void>;
  /** Set once a co-manager has already submitted or sent it back; the review is then read-only. */
  decided: { by: EmployeeSummary | null; reviewStatus: string | null } | null;
  /** Another manager who is editing this review right now. */
  coEditor: EmployeeSummary | null;
  saveState: DraftSaveState;
}

/**
 * The review draft every manager the submission went to shares. Edits are saved
 * (debounced) as small patches and the server's draft is polled, so what one
 * manager enters appears for the others within a few seconds — without a poll
 * ever overwriting something this manager is in the middle of changing.
 */
export function useManagerReviewDraft(
  submission: MonthlySubmissionItem,
  myEmail: string | null | undefined
): ManagerReviewDraftApi {
  const queryClient = useQueryClient();
  const queryKey = [...MANAGER_REVIEW_DRAFT_QUERY_KEY, submission.id] as const;

  // Local edit buffer: the manager's own unsaved typing has to live in the UI
  // (not the query cache) so a poll can be merged around it.
  const [fields, setFields] = useState<ReviewFields>(() => fieldsFromDraft(submission.manager_draft));
  const [saveState, setSaveState] = useState<DraftSaveState>("idle");
  const [coEditor, setCoEditor] = useState<EmployeeSummary | null>(null);
  const fieldsRef = useRef(fields);
  const dirtyRef = useRef(new Set<DirtyKey>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const applyFields = useCallback((next: ReviewFields) => {
    fieldsRef.current = next;
    setFields(next);
  }, []);

  const saveMutation = useMutation({
    mutationFn: (patch: ReturnType<typeof buildPatch>) => hrmsService.saveManagerReviewDraft(submission.id, patch),
  });

  const adoptServerState = useCallback(
    (state: ManagerReviewDraftState) => {
      if (state.draft) applyFields(mergeRemoteDraft(fieldsRef.current, state.draft, dirtyRef.current));
      const author = state.draft?.updated_by ?? null;
      const mine = author != null && author.email.toLowerCase() === (myEmail ?? "").toLowerCase();
      const recent = state.draft?.updated_at ? Date.now() - Date.parse(state.draft.updated_at) < CO_EDITOR_ACTIVE_MS : false;
      setCoEditor(author && !mine && recent ? author : null);
    },
    [applyFields, myEmail]
  );

  const flush = useCallback(async (): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // One request at a time, so two patches can't land out of order.
    if (inFlightRef.current) await inFlightRef.current;
    const dirty = new Set(dirtyRef.current);
    if (dirty.size === 0) return;
    const sent = snapshotFields(fieldsRef.current);
    const patch = buildPatch(sent, dirty);
    if (isEmptyPatch(patch)) {
      dirtyRef.current = new Set();
      return;
    }
    setSaveState("saving");
    const run = (async () => {
      try {
        const state = await saveMutation.mutateAsync(patch);
        // A field changed again during the request stays dirty, so the next poll
        // can't put the value we just saved back over the newer one.
        dirtyRef.current = settleDirty(dirtyRef.current, sent, fieldsRef.current);
        queryClient.setQueryData(queryKey, state);
        adoptServerState(state);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    })();
    inFlightRef.current = run;
    await run;
    inFlightRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adoptServerState, queryClient, saveMutation.mutateAsync, submission.id]);

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flushRef.current(), SAVE_DEBOUNCE_MS);
  }, []);

  const edit = useCallback(
    (key: DirtyKey, next: ReviewFields) => {
      applyFields(next);
      dirtyRef.current.add(key);
      setSaveState("idle");
      scheduleSave();
    },
    [applyFields, scheduleSave]
  );

  const rateKpi = useCallback(
    (kpiId: number, rating: number) =>
      edit(`k:${kpiId}`, { ...fieldsRef.current, kpi: { ...fieldsRef.current.kpi, [kpiId]: rating } }),
    [edit]
  );
  const rateValue = useCallback(
    (valueId: number, rating: number) =>
      edit(`v:${valueId}`, { ...fieldsRef.current, values: { ...fieldsRef.current.values, [valueId]: rating } }),
    [edit]
  );
  const setComments = useCallback(
    (comments: string) => edit("comments", { ...fieldsRef.current, comments }),
    [edit]
  );

  const serverState = useQuery({
    queryKey,
    queryFn: () => hrmsService.getManagerReviewDraft(submission.id),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  // Bridges polled server data into the local edit buffer (merged around dirty
  // fields); the buffer can't be derived during render because it holds unsent typing.
  useEffect(() => {
    if (serverState.data) adoptServerState(serverState.data);
  }, [serverState.data, adoptServerState]);

  // Leaving the review (closing the modal) sends whatever is still unsaved.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void flushRef.current();
    };
  }, []);

  const status = serverState.data;
  const decided =
    status && status.review_status && !AWAITING_STATUSES.has(status.review_status)
      ? { by: status.decided_by, reviewStatus: status.review_status }
      : null;

  return { fields, rateKpi, rateValue, setComments, flush, decided, coEditor, saveState };
}
