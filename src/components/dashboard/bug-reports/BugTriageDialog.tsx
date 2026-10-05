"use client";

import { useState } from "react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { SelectField, TextAreaField } from "@/components/dashboard/ui/forms";
import { BUG_REPORT_COPY, BUG_STATUS_OPTIONS } from "@/constants/bugReports";
import { useUpdateBugReport } from "@/hooks/bug-reports/useBugReports";
import type { BugReport, BugStatus } from "@/types/bugReport";

/** HR/Admin: read the full report, set its status and leave the reporter a note. */
export function BugTriageDialog({ bug, onClose }: { bug: BugReport; onClose: () => void }) {
  const [status, setStatus] = useState<BugStatus>(bug.status);
  const [note, setNote] = useState(bug.resolution_note ?? "");
  const update = useUpdateBugReport();

  const changed = status !== bug.status || note.trim() !== (bug.resolution_note ?? "");

  return (
    <WtFormDialog
      open
      title={BUG_REPORT_COPY.triageTitle}
      description={`Bug #${bug.id} · reported by ${bug.reporter.name}`}
      onClose={onClose}
      onSubmit={() =>
        update.mutate(
          { id: bug.id, payload: { status, resolution_note: note.trim() || null } },
          { onSuccess: onClose }
        )
      }
      submitLabel={BUG_REPORT_COPY.save}
      submittingLabel={BUG_REPORT_COPY.saving}
      submitDisabled={!changed}
      loading={update.isPending}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-wt-border bg-wt-surface-2 p-4">
          <p className="text-sm font-semibold text-wt-text">{bug.title}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-wt-text-muted">{bug.description}</p>
          {bug.page_url ? <p className="mt-3 break-all text-xs text-wt-text-faint">{bug.page_url}</p> : null}
          {bug.user_agent ? <p className="mt-1 break-all text-xs text-wt-text-faint">{bug.user_agent}</p> : null}
        </div>
        <SelectField
          label="Status"
          value={status}
          options={BUG_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
          onChange={(value) => setStatus(value as BugStatus)}
          clearSelectionOnEmptyInput={false}
        />
        <TextAreaField
          label={BUG_REPORT_COPY.noteLabel}
          value={note}
          onChange={setNote}
          rows={3}
          placeholder={BUG_REPORT_COPY.notePlaceholder}
        />
      </div>
    </WtFormDialog>
  );
}
