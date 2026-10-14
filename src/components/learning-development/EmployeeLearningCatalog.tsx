"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { TrainingCard } from "@/components/learning-development/TrainingCard";
import { useMyTrainingsList, useOpenTrainingsList } from "@/hooks/learning/useLearningTrainings";
import { hrmsService } from "@/services/hrms.service";
import { notifyError } from "@/lib/notify";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";

function enrollmentLabel(row: Record<string, unknown>): string {
  if (String(row.enrollment_status ?? "").toUpperCase() === "COMPLETED") return "Completed";
  const progress = Number(row.progress_percent ?? 0);
  return progress > 0 ? `In progress · ${Math.round(progress)}%` : "Enrolled";
}

function trainingDetailHref(trainingId: string) {
  return `/dashboard/learning-development/trainings/${encodeURIComponent(trainingId)}`;
}

export function EmployeeLearningCatalog() {
  const qc = useQueryClient();
  const openQ = useOpenTrainingsList();
  const mineQ = useMyTrainingsList();
  // UI state: which training's Enroll button is mid-request.
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  // Business rule: during the notice period an employee keeps their assigned
  // trainings but can't enrol in new ones (the backend enforces it too).
  const { isServingNotice } = useDashboardAccess();

  const myTrainings = useMemo(() => mineQ.data ?? [], [mineQ.data]);
  const enrolledIds = useMemo(() => new Set(myTrainings.map((row) => String(row.id ?? "").trim())), [myTrainings]);
  const openTrainings = openQ.data ?? [];

  const enrollMut = useMutation({
    mutationFn: (trainingId: string) => hrmsService.selfEnrollTraining(trainingId),
    onSuccess: async (_data, trainingId) => {
      await qc.invalidateQueries({ queryKey: ["learning", "trainings", "mine"] });
      await qc.invalidateQueries({ queryKey: ["learning", "trainings", "open"] });
      await qc.invalidateQueries({ queryKey: ["learning", "my-marks", trainingId] });
    },
  });

  const enroll = (trainingId: string) => {
    setEnrollingId(trainingId);
    enrollMut.mutate(trainingId, {
      onSettled: () => setEnrollingId(null),
      onError: (e) => notifyError(e instanceof Error ? e.message : String(e)),
    });
  };

  const sortedOpen = useMemo(
    () =>
      [...openTrainings].sort((a, b) =>
        String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
          sensitivity: "base",
        })
      ),
    [openTrainings]
  );

  const myList = (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">My Trainings</h2>
        <p className="text-sm text-wt-text-muted mt-1">
          Trainings you are enrolled in, including the ones HR assigned to you.
        </p>
      </div>
      {mineQ.isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" aria-hidden />
      ) : mineQ.isError ? (
        <p className="text-sm text-wt-text-muted">We couldn&apos;t load your trainings. Please refresh to try again.</p>
      ) : myTrainings.length === 0 ? (
        <p className="text-sm text-wt-text-muted">You aren&apos;t enrolled in any training yet. Enroll in one below.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {myTrainings.map((row) => {
            const id = String(row.id ?? "").trim();
            return (
              <div key={id || String(row.name)} className="relative flex flex-col">
                <TrainingCard row={row} href={trainingDetailHref(id)} />
                <p className="mt-2 px-1 text-right text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {enrollmentLabel(row)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-8">
    {myList}
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Open Trainings</h2>
        <p className="text-sm text-wt-text-muted mt-1">
          Optional and hybrid trainings with status Scheduled. Everyone can browse and self-enroll.
          Mandatory trainings are only visible after HR assigns you.
        </p>
      </div>
      {openQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      ) : isServingNotice ? (
        <p className="text-sm text-wt-text-muted">
          You&apos;re serving your notice period, so you can&apos;t enrol in new trainings. Trainings already
          assigned to you are unaffected.
        </p>
      ) : sortedOpen.length === 0 ? (
        <p className="text-sm text-wt-text-muted">
          No open trainings right now. HR must set type Optional or Hybrid and status Scheduled.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedOpen.map((row) => {
            const id = String(row.id ?? "").trim();
            const enrolled = enrolledIds.has(id);
            return (
              <div key={id || String(row.name)} className="relative flex flex-col">
                <TrainingCard row={row} href={trainingDetailHref(id)} />
                <div className="mt-2 flex justify-end px-1">
                  {enrolled ? (
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Enrolled</span>
                  ) : (
                    <Button variant="brand" size="xs" type="button" className="px-3 py-1.5 text-xs" disabled={enrollMut.isPending && enrollingId === id} onClick={() => enroll(id)}
                    >
                      {enrollMut.isPending && enrollingId === id ? "Enrolling…" : "Enroll"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
    </div>
  );
}
