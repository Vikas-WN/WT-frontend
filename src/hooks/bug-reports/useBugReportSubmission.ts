"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { BUG_REPORT_QUERY_KEYS, BUG_SUBMIT_COPY } from "@/constants/bugReports";
import { notifyError, notifySuccess } from "@/lib/notify";
import { bugReportService } from "@/services/bugReports.service";
import type { BugReportCreatePayload } from "@/types/bugReport";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

export type SubmissionPhase = "idle" | "creating" | "uploading" | "finished";
export type UploadStatus = "queued" | "uploading" | "done" | "failed";

export interface UploadItem {
  id: number;
  file: File;
  status: UploadStatus;
  error?: string;
}

/**
 * Sending a bug report in two steps, so a big or failing file can never lose the report: first the report itself (fast, saved at
 * once), then each file on its own with its own status — a failed file can be retried without sending the report again.
 */
export function useBugReportSubmission() {
  const queryClient = useQueryClient();
  // UI state: where the submission is, which report it created, and how each file is doing.
  const [phase, setPhase] = useState<SubmissionPhase>("idle");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const reportId = useRef<number | null>(null);
  const nextId = useRef(1);

  const patch = (id: number, change: Partial<UploadItem>) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...change } : u)));

  /** Uploads each file in turn; returns how many failed. */
  const uploadAll = useCallback(
    async (items: UploadItem[]): Promise<number> => {
      const id = reportId.current;
      if (id === null) return items.length;
      setPhase("uploading");
      let failed = 0;
      for (const item of items) {
        patch(item.id, { status: "uploading", error: undefined });
        try {
          await bugReportService.addAttachment(id, item.file);
          patch(item.id, { status: "done" });
        } catch (error) {
          failed += 1;
          patch(item.id, { status: "failed", error: apiErrorMessage(error, "Couldn't upload this file.") });
        }
      }
      setPhase("finished");
      void queryClient.invalidateQueries({ queryKey: BUG_REPORT_QUERY_KEYS.all });
      return failed;
    },
    [queryClient]
  );

  const submit = useCallback(
    async (payload: BugReportCreatePayload, files: File[]): Promise<{ saved: boolean; failedFiles: number }> => {
      setPhase("creating");
      try {
        const res = await bugReportService.create(payload);
        reportId.current = res.data.id;
      } catch (error) {
        setPhase("idle");
        notifyError(apiErrorMessage(error, "Couldn't send your report."));
        return { saved: false, failedFiles: 0 };
      }
      void queryClient.invalidateQueries({ queryKey: BUG_REPORT_QUERY_KEYS.all });
      const items = files.map((file) => ({ id: nextId.current++, file, status: "queued" as UploadStatus }));
      setUploads(items);
      if (items.length === 0) {
        setPhase("finished");
        notifySuccess(BUG_SUBMIT_COPY.thanks);
        return { saved: true, failedFiles: 0 };
      }
      return { saved: true, failedFiles: await uploadAll(items) };
    },
    [queryClient, uploadAll]
  );

  const retryFailed = useCallback(() => {
    const failed = uploads.filter((u) => u.status === "failed");
    return uploadAll(failed);
  }, [uploads, uploadAll]);

  const failedCount = uploads.filter((u) => u.status === "failed").length;
  const doneCount = uploads.filter((u) => u.status === "done").length;
  const busy = phase === "creating" || phase === "uploading";
  return { phase, uploads, failedCount, doneCount, busy, submit, retryFailed };
}
