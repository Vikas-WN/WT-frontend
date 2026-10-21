"use client";

import { useState } from "react";

import { AttendanceBucketDialog } from "@/components/dashboard/home/attendance/AttendanceBucketDialog";
import { BUCKET_META, BUCKET_ORDER, initialsOf, type BucketKey } from "@/components/dashboard/home/attendance/attendanceMeta";
import { CardMessage, CardSkeleton, HomeCard } from "@/components/dashboard/home/HomeCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HOME_ATTENDANCE_COPY } from "@/constants/homeCards";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { AttendanceBucket, AttendanceSnapshot } from "@/services/hrms.service";

const NAMES_SHOWN = 2;
const AVATARS_SHOWN = 5;
const AVATAR_TONE = ["bg-amber-500/18 text-amber-900 dark:text-amber-200", "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]", "bg-emerald-500/16 text-emerald-900 dark:text-emerald-200", "bg-violet-500/16 text-violet-900 dark:text-violet-200", "bg-rose-500/14 text-rose-900 dark:text-rose-200"] as const;

function BucketTile({ bucketKey, bucket, onOpen }: { bucketKey: BucketKey; bucket: AttendanceBucket; onOpen: () => void }) {
  const meta = BUCKET_META[bucketKey];
  const names = bucket.employees.slice(0, NAMES_SHOWN).map((e) => e.name.split(" ")[0]);
  const more = bucket.count - names.length;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={bucket.count === 0}
      aria-label={HOME_ATTENDANCE_COPY.open(meta.label)}
      className="min-w-0 rounded-2xl border border-wt-border bg-wt-surface-1 p-4 text-left transition-colors hover:bg-wt-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)] disabled:cursor-default disabled:hover:bg-wt-surface-1"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[15px] text-wt-text">
          <span className={cn("size-2.5 shrink-0 rounded-full", meta.bar)} aria-hidden />
          <span className="truncate">{meta.short}</span>
        </span>
        <span className="text-[1.4rem] font-bold leading-none tabular-nums text-wt-text">
          <AnimatedNumber value={bucket.count} />
        </span>
      </span>
      <span className="mt-2.5 block text-sm leading-snug text-wt-text-muted">
        {names.length ? `${names.join(", ")}${more > 0 ? ` and ${more} ${more === 1 ? "other" : "others"}` : ""}` : HOME_ATTENDANCE_COPY.none}
      </span>
    </button>
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

/** HR/Admin: "Who's where today" — the headcount bar, a tile for each place, and who is out. */
export function AttendanceCard({ data, status }: { data: AttendanceSnapshot | null; status: "loading" | "done" | "error" }) {
  const [openBucket, setOpenBucket] = useState<BucketKey | null>(null);
  const total = data ? BUCKET_ORDER.reduce((sum, key) => sum + data[key].count, 0) : 0;
  const out = data?.on_leave.employees ?? [];

  return (
    <HomeCard title={HOME_ATTENDANCE_COPY.title} subtitle={data ? HOME_ATTENDANCE_COPY.total(total) : undefined} href={DASHBOARD_ROUTES["whos-out"]} cta={HOME_ATTENDANCE_COPY.cta}>
      {status === "loading" ? (
        <CardSkeleton />
      ) : status === "error" || !data ? (
        <CardMessage text={HOME_ATTENDANCE_COPY.unavailable} />
      ) : (
        <div>
          {total > 0 ? <SplitBar data={data} total={total} /> : null}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BUCKET_ORDER.map((key) => (
              <BucketTile key={key} bucketKey={key} bucket={data[key]} onOpen={() => setOpenBucket(key)} />
            ))}
          </div>
          {out.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-wt-border pt-4">
              <span className="text-sm text-wt-text-muted">{HOME_ATTENDANCE_COPY.outToday}</span>
              <span className="flex -space-x-1.5">
                {out.slice(0, AVATARS_SHOWN).map((e, i) => (
                  <span key={`${e.emp_id}-${i}`} className={cn("grid size-8 place-items-center rounded-full border-2 border-wt-surface-1 text-[11px] font-semibold", AVATAR_TONE[i % AVATAR_TONE.length])} title={e.name}>
                    {initialsOf(e.name)}
                  </span>
                ))}
                {out.length > AVATARS_SHOWN ? <span className="grid size-8 place-items-center rounded-full border-2 border-wt-surface-1 bg-wt-surface-3 text-[11px] font-semibold text-wt-text-muted">+{out.length - AVATARS_SHOWN}</span> : null}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-wt-text">{out.slice(0, AVATARS_SHOWN).map((e) => e.name.split(" ")[0]).join(", ")}</span>
            </div>
          ) : null}
        </div>
      )}
      {data && openBucket ? <AttendanceBucketDialog bucketKey={openBucket} bucket={data[openBucket]} onClose={() => setOpenBucket(null)} /> : null}
    </HomeCard>
  );
}
