"use client";

import { useState } from "react";
import { Bug } from "lucide-react";

import { ReportBugDialog } from "@/components/dashboard/bug-reports/ReportBugDialog";
import { BUG_REPORT_COPY } from "@/constants/bugReports";

/** Header shortcut: raise a bug from whatever page you're on. */
export function ReportBugButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={BUG_REPORT_COPY.buttonLabel}
        title={BUG_REPORT_COPY.buttonLabel}
        className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-wt-text transition-colors hover:bg-wt-surface-3"
      >
        <Bug className="size-[18px]" aria-hidden />
      </button>
      {open ? <ReportBugDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}
