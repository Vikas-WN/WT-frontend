"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useCallback, useMemo, useState, type ClipboardEvent } from "react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { BugAttachmentPicker } from "@/components/dashboard/bug-reports/BugAttachmentPicker";
import { BugContextSummary } from "@/components/dashboard/bug-reports/BugContextSummary";
import { InputField, SelectField, TextAreaField } from "@/components/dashboard/ui/forms";
import { BUG_REPORT_COPY, BUG_SEVERITY_OPTIONS, BUG_SUBMIT_COPY } from "@/constants/bugReports";
import { useAuth } from "@/context/AuthContext";
import { useBugReportSubmission } from "@/hooks/bug-reports/useBugReportSubmission";
import { captureBugContext } from "@/lib/diagnostics/captureContext";
import { notifySuccess } from "@/lib/notify";
import { safePageUrl } from "@/utils/diagnostics";
import { nameForPastedImage } from "@/utils/bugAttachments";
import type { BugSeverity } from "@/types/bugReport";

const MIN_TITLE = 3;
const MIN_DETAILS = 10;

export function ReportBugDialog({ onClose }: { onClose: () => void }) {
  const { user, allRoles, activePersona } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("MEDIUM");
  const [files, setFiles] = useState<File[]>([]);
  const [includeDetails, setIncludeDetails] = useState(true);
  const submission = useBugReportSubmission();

  // Taken once, as the dialog opens — that is the moment closest to when the problem happened.
  const context = useMemo(() => captureBugContext({ roles: allRoles.length ? allRoles : (user?.roles ?? []), activeRole: activePersona }), [allRoles, user?.roles, activePersona]);

  const canSubmit = title.trim().length >= MIN_TITLE && description.trim().length >= MIN_DETAILS;
  const hint = BUG_SEVERITY_OPTIONS.find((option) => option.value === severity)?.hint;
  const afterSending = submission.phase === "finished";
  const partial = afterSending && submission.failedCount > 0;

  // Closing mid-send would abandon files that are still uploading, so it waits until they finish.
  const requestClose = useCallback(() => {
    if (!submission.busy) onClose();
  }, [submission.busy, onClose]);

  async function send() {
    const outcome = await submission.submit(
      {
        title: title.trim(),
        description: description.trim(),
        severity,
        page_url: safePageUrl(window.location.href).slice(0, 500),
        user_agent: navigator.userAgent.slice(0, 500),
        occurred_at: context.captured_at,
        context: includeDetails ? context : { captured_at: context.captured_at, page: context.page, time_zone: context.time_zone, app: context.app },
      },
      files
    );
    if (outcome.saved && outcome.failedFiles === 0 && files.length > 0) {
      notifySuccess(BUG_SUBMIT_COPY.thanksWithFiles);
      onClose();
    } else if (outcome.saved && files.length === 0) {
      onClose();
    }
  }

  async function retry() {
    const failed = await submission.retryFailed();
    if (failed === 0) {
      notifySuccess(BUG_SUBMIT_COPY.thanksWithFiles);
      onClose();
    }
  }

  // After the report is saved, a "send" would create it again — the button only retries the files that failed.
  function onSubmit() {
    if (partial) void retry();
    else void send();
  }

  // A screenshot pasted anywhere in the dialog is attached; pasted text goes into the field as usual.
  function onPaste(event: ClipboardEvent) {
    if (submission.busy || afterSending) return;
    const images = Array.from(event.clipboardData.files).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    event.preventDefault();
    const named = images.map((f) => new File([f], f.name && f.name !== "image.png" ? f.name : nameForPastedImage(f.type, new Date()), { type: f.type }));
    setFiles((list) => [...list, ...named].slice(0, 5));
  }

  return (
    <WtFormDialog
      open
      title={partial ? BUG_SUBMIT_COPY.partialTitle : BUG_REPORT_COPY.dialogTitle}
      description={partial ? BUG_SUBMIT_COPY.partialHint : BUG_REPORT_COPY.dialogDescription}
      onClose={requestClose}
      onSubmit={onSubmit}
      submitLabel={partial ? BUG_SUBMIT_COPY.retry : BUG_REPORT_COPY.submit}
      submittingLabel={submission.phase === "uploading" ? BUG_SUBMIT_COPY.uploadingOverall(submission.doneCount, files.length) : BUG_REPORT_COPY.submitting}
      cancelLabel={afterSending ? BUG_SUBMIT_COPY.close : undefined}
      submitDisabled={!canSubmit}
      loading={submission.busy}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5" onPaste={onPaste}>
        {afterSending ? (
          <p className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${partial ? "bg-amber-500/12 text-amber-800 dark:text-amber-300" : "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"}`} role="status">
            {partial ? <AlertCircle className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
            {partial ? BUG_SUBMIT_COPY.sentNote : BUG_SUBMIT_COPY.sentTitle}
          </p>
        ) : (
          <>
            <InputField label={BUG_REPORT_COPY.titleLabel} value={title} onChange={setTitle} required placeholder={BUG_REPORT_COPY.titlePlaceholder} />
            <TextAreaField label={BUG_REPORT_COPY.descriptionLabel} value={description} onChange={setDescription} rows={5} required placeholder={BUG_REPORT_COPY.descriptionPlaceholder} />
            <div>
              <SelectField
                label={BUG_REPORT_COPY.severityLabel}
                value={severity}
                options={BUG_SEVERITY_OPTIONS.map(({ value, label }) => ({ value, label }))}
                onChange={(value) => setSeverity(value as BugSeverity)}
                clearSelectionOnEmptyInput={false}
              />
              {hint ? <p className="mt-1.5 text-xs text-wt-text-muted">{hint}</p> : null}
            </div>
          </>
        )}
        <BugAttachmentPicker
          files={files}
          uploads={submission.uploads}
          disabled={submission.busy || afterSending}
          locked={afterSending}
          onAdd={(accepted) => setFiles((list) => [...list, ...accepted])}
          onRemove={(index) => setFiles((list) => list.filter((_, i) => i !== index))}
        />
        {afterSending ? null : <BugContextSummary context={context} included={includeDetails} onIncludedChange={setIncludeDetails} />}
      </div>
    </WtFormDialog>
  );
}
