"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Building2, CalendarOff, Home as HomeIcon } from "lucide-react";

import { HomeCard, CardMessage, CardSkeleton } from "@/components/dashboard/home/HomeCard";
import {
  MODAL_BODY_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { Button } from "@/components/ui/button";
import type { AttendanceBucket, AttendanceSnapshot } from "@/services/hrms.service";
import { cn } from "@/lib/utils";

type BucketKey = "office" | "work_from_home" | "on_leave";

const BUCKET_META: Record<
  BucketKey,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  office: {
    label: "In Office",
    icon: <Building2 className="size-4" />,
    tone: "text-[var(--wt-brand)] bg-[var(--wt-brand-soft)]",
  },
  work_from_home: {
    label: "Work From Home",
    icon: <HomeIcon className="size-4" />,
    tone: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/12",
  },
  on_leave: {
    label: "On Leave",
    icon: <CalendarOff className="size-4" />,
    tone: "text-amber-700 dark:text-amber-400 bg-amber-500/12",
  },
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function BucketDialog({
  bucketKey,
  bucket,
  onClose,
}: {
  bucketKey: BucketKey;
  bucket: AttendanceBucket;
  onClose: () => void;
}) {
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
      <div role="dialog" aria-modal="true" className={cn(MODAL_PANEL_CLASS, "max-w-md")}>
        <div className={cn(MODAL_HEADER_CLASS, "flex items-center justify-between gap-3")}>
          <div className="flex items-center gap-2.5">
            <span className={cn("flex size-9 items-center justify-center rounded-xl", meta.tone)}>
              {meta.icon}
            </span>
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
                    {initials(e.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-wt-text">{e.name}</span>
                    {e.department ? (
                      <span className="block truncate text-xs text-wt-text-muted">
                        {e.department}
                      </span>
                    ) : null}
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

function StatRow({
  bucketKey,
  bucket,
  onOpen,
}: {
  bucketKey: BucketKey;
  bucket: AttendanceBucket;
  onOpen: () => void;
}) {
  const meta = BUCKET_META[bucketKey];
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={bucket.count === 0}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-wt-surface-2 disabled:cursor-default disabled:hover:bg-transparent"
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", meta.tone)}>
        {meta.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-wt-text">{meta.label}</span>
        <span className="block truncate text-xs text-wt-text-muted">
          {bucket.employees
            .slice(0, 2)
            .map((e) => e.name.split(" ")[0])
            .join(", ") || "None today"}
          {bucket.count > 2 ? ` +${bucket.count - 2} more` : ""}
        </span>
      </span>
      <span className="shrink-0 text-2xl font-semibold tabular-nums text-wt-text">
        {bucket.count}
      </span>
    </button>
  );
}

export function AttendanceCard({
  data,
  status,
}: {
  data: AttendanceSnapshot | null;
  status: "loading" | "done" | "error";
}) {
  const [openBucket, setOpenBucket] = useState<BucketKey | null>(null);

  return (
    <HomeCard
      title="Today's Attendance"
      icon={<Building2 className="size-4" />}
    >
      {status === "loading" ? (
        <CardSkeleton />
      ) : status === "error" || !data ? (
        <CardMessage text="Unavailable" />
      ) : (
        <div className="space-y-0.5">
          <StatRow bucketKey="office" bucket={data.office} onOpen={() => setOpenBucket("office")} />
          <StatRow
            bucketKey="work_from_home"
            bucket={data.work_from_home}
            onOpen={() => setOpenBucket("work_from_home")}
          />
          <StatRow
            bucketKey="on_leave"
            bucket={data.on_leave}
            onOpen={() => setOpenBucket("on_leave")}
          />
        </div>
      )}

      {data && openBucket ? (
        <BucketDialog
          bucketKey={openBucket}
          bucket={data[openBucket]}
          onClose={() => setOpenBucket(null)}
        />
      ) : null}
    </HomeCard>
  );
}
