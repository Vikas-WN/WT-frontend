"use client";

import { createPortal } from "react-dom";

import { BUCKET_META, type BucketKey, initialsOf } from "@/components/dashboard/home/attendance/attendanceMeta";
import { MODAL_BODY_CLASS, MODAL_HEADER_CLASS, MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from "@/components/dashboard/ui/uiLayout";
import { Button } from "@/components/ui/button";
import type { AttendanceBucket } from "@/services/hrms.service";
import { cn } from "@/lib/utils";

/** Everyone in one bucket (in office / work from home / on leave) today. */
export function AttendanceBucketDialog({ bucketKey, bucket, onClose }: { bucketKey: BucketKey; bucket: AttendanceBucket; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  const meta = BUCKET_META[bucketKey];
  return createPortal(
    <div
      className={cn(MODAL_OVERLAY_CLASS, "z-[110]")}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={meta.label} className={cn(MODAL_PANEL_CLASS, "max-w-md")}>
        <div className={cn(MODAL_HEADER_CLASS, "flex items-center justify-between gap-3")}>
          <div className="flex items-center gap-2.5">
            <span className={cn("flex size-9 items-center justify-center rounded-xl", meta.tone)}>{meta.icon}</span>
            <div>
              <h2 className="text-base font-semibold text-wt-text">{meta.label}</h2>
              <p className="text-xs text-wt-text-muted">
                {bucket.count} {bucket.count === 1 ? "employee" : "employees"} today
              </p>
            </div>
          </div>
        </div>
        <div className={MODAL_BODY_CLASS}>
          {bucket.employees.length === 0 ? (
            <p className="py-6 text-center text-sm text-wt-text-muted">Nobody in this list.</p>
          ) : (
            <ul className="space-y-2">
              {bucket.employees.map((e) => (
                <li key={e.email || e.emp_id} className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-wt-surface-3 text-[11px] font-semibold text-wt-text-muted">
                    {initialsOf(e.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-wt-text">{e.name}</span>
                    {e.department ? <span className="block truncate text-xs text-wt-text-muted">{e.department}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex shrink-0 justify-end border-t border-wt-border px-5 py-4 sm:px-7 dark:border-wt-border/80">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
