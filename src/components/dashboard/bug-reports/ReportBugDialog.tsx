"use client";

import { useMemo, useState } from "react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { InputField, SelectField, TextAreaField } from "@/components/dashboard/ui/forms";
import { BUG_REPORT_COPY, BUG_SEVERITY_OPTIONS } from "@/constants/bugReports";
import { useCreateBugReport } from "@/hooks/bug-reports/useBugReports";
import type { BugSeverity } from "@/types/bugReport";

const MIN_TITLE = 3;
const MIN_DETAILS = 10;

/** Where the report was raised — captured automatically so the reporter doesn't have to describe it. */
function captureContext(): { pageUrl: string; userAgent: string } {
  if (typeof window === "undefined") return { pageUrl: "", userAgent: "" };
  return { pageUrl: window.location.href.slice(0, 500), userAgent: window.navigator.userAgent.slice(0, 500) };
}

export function ReportBugDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("MEDIUM");
  const context = useMemo(() => captureContext(), []);
  const create = useCreateBugReport();

  const canSubmit = title.trim().length >= MIN_TITLE && description.trim().length >= MIN_DETAILS;
  const hint = BUG_SEVERITY_OPTIONS.find((option) => option.value === severity)?.hint;

  return (
    <WtFormDialog
      open
      title={BUG_REPORT_COPY.dialogTitle}
      description={BUG_REPORT_COPY.dialogDescription}
      onClose={onClose}
      onSubmit={() =>
        create.mutate(
          {
            title: title.trim(),
            description: description.trim(),
            severity,
            page_url: context.pageUrl || null,
            user_agent: context.userAgent || null,
          },
          { onSuccess: onClose }
        )
      }
      submitLabel={BUG_REPORT_COPY.submit}
      submittingLabel={BUG_REPORT_COPY.submitting}
      submitDisabled={!canSubmit}
      loading={create.isPending}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5">
        <InputField
          label={BUG_REPORT_COPY.titleLabel}
          value={title}
          onChange={setTitle}
          required
          placeholder={BUG_REPORT_COPY.titlePlaceholder}
        />
        <TextAreaField
          label={BUG_REPORT_COPY.descriptionLabel}
          value={description}
          onChange={setDescription}
          rows={5}
          required
          placeholder={BUG_REPORT_COPY.descriptionPlaceholder}
        />
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
        {context.pageUrl ? (
          <div className="rounded-lg bg-wt-surface-2 px-3 py-2 text-xs text-wt-text-muted">
            <p className="font-medium text-wt-text">{BUG_REPORT_COPY.contextLabel}</p>
            <p className="mt-0.5 break-all">{context.pageUrl}</p>
          </div>
        ) : null}
      </div>
    </WtFormDialog>
  );
}
