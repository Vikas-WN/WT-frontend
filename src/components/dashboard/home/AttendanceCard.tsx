"use client";

import { Building2, ChevronRight } from "lucide-react";
import { useState } from "react";

import { AttendanceBucketDialog } from "@/components/dashboard/home/attendance/AttendanceBucketDialog";
import { BUCKET_META, BUCKET_ORDER, type BucketKey } from "@/components/dashboard/home/attendance/attendanceMeta";
import { CardMessage, CardSkeleton, HomeCard } from "@/components/dashboard/home/HomeCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HOME_ATTENDANCE_COPY } from "@/constants/homeCards";
import { cn } from "@/lib/utils";
import type { AttendanceBucket, AttendanceSnapshot } from "@/services/hrms.service";

const NAMES_SHOWN = 2;

function BucketRow({ bucketKey, bucket, onOpen }: { bucketKey: BucketKey; bucket: AttendanceBucket; onOpen: () => void }) {
  const meta = BUCKET_META[bucketKey];
  const names = bucket.employees.slice(0, NAMES_SHOWN).map((e) => e.name.split(" ")[0]).join(", ");
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        disabled={bucket.count === 0}
        aria-label={HOME_ATTENDANCE_COPY.open(meta.label)}
        className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-[var(--wt-duration)] hover:bg-wt-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)] disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", meta.tone)}>{meta.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-wt-text">{meta.short}</span>
          <span className="block truncate text-xs text-wt-text-muted">
            {names || HOME_ATTENDANCE_COPY.none}
            {bucket.count > NAMES_SHOWN ? ` ${HOME_ATTENDANCE_COPY.more(bucket.count - NAMES_SHOWN)}` : ""}
          </span>
        </span>
        <span className="text-xl font-semibold tabular-nums text-wt-text">
          <AnimatedNumber value={bucket.count} />
        </span>
        <ChevronRight className="size-4 shrink-0 text-wt-text-faint opacity-0 transition-opacity group-hover:opacity-100 group-disabled:hidden" aria-hidden />
      </button>
    </li>
  );
}

/** One proportional bar for the whole headcount, split by where people are today. */
function SplitBar({ data, total }: { data: AttendanceSnapshot; total: number }) {
  return (
    <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-wt-surface-3" aria-hidden>
      {BUCKET_ORDER.map((key) => {
        const count = data[key].count;
        return count > 0 ? <span key={key} className={cn("h-full rounded-full", BUCKET_META[key].bar)} style={{ width: `${(count / total) * 100}%` }} /> : null;
      })}
    </div>
  );
}

/** HR/Admin: where everyone is today — a proportional bar, and a row per place with a few names. */
export function AttendanceCard({ data, status }: { data: AttendanceSnapshot | null; status: "loading" | "done" | "error" }) {
  const [openBucket, setOpenBucket] = useState<BucketKey | null>(null);
  const total = data ? BUCKET_ORDER.reduce((sum, key) => sum + data[key].count, 0) : 0;

  return (
    <HomeCard title={HOME_ATTENDANCE_COPY.title} icon={<Building2 className="size-4" />}>
      {status === "loading" ? (
        <CardSkeleton />
      ) : status === "error" || !data ? (
        <CardMessage text={HOME_ATTENDANCE_COPY.unavailable} />
      ) : (
        <div>
          <p className="mb-2.5 text-xs text-wt-text-muted">{HOME_ATTENDANCE_COPY.total(total)}</p>
          {total > 0 ? <SplitBar data={data} total={total} /> : null}
          <ul className="mt-2 space-y-0.5">
            {BUCKET_ORDER.map((key) => (
              <BucketRow key={key} bucketKey={key} bucket={data[key]} onOpen={() => setOpenBucket(key)} />
            ))}
          </ul>
        </div>
      )}
      {data && openBucket ? <AttendanceBucketDialog bucketKey={openBucket} bucket={data[openBucket]} onClose={() => setOpenBucket(null)} /> : null}
    </HomeCard>
  );
}
