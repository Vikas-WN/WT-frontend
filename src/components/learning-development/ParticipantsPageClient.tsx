"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTrainingParticipants } from "@/hooks/learning/useLearningTrainings";
import { TrainingParticipantsList } from "@/components/learning-development/TrainingParticipantsList";
import { TrainingScopePicker } from "@/components/learning-development/TrainingScopePicker";
import { TrainingAudienceAdder } from "@/components/learning-development/TrainingAudienceAdder";
import { hrmsService } from "@/services/hrms.service";
import { LearningPageShell } from "@/components/learning-development/LearningPageShell";
import { notifyError } from "@/lib/notify";

export function ParticipantsPageClient() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const hasHrAccess = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");

  const [trainingId, setTrainingId] = useState("");
  const [updatingParticipantId, setUpdatingParticipantId] = useState<string | null>(null);
  const qc = useQueryClient();
  const traineesQ = useTrainingParticipants(trainingId, Boolean(trainingId.trim()));

  const updateParticipantStatus = async (userId: string, status: "COMPLETED" | "WITHDRAWN") => {
    setUpdatingParticipantId(userId);
    try {
      await hrmsService.updateTrainingParticipantStatus(trainingId, userId, status);
      await qc.invalidateQueries({ queryKey: ["learning", "participants", trainingId] });
    } finally {
      setUpdatingParticipantId(null);
    }
  };

  return (
    <LearningPageShell>
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trainees</h1>
          <p className="text-sm text-wt-text-muted mt-1">Manage training roster enrollment.</p>
        </div>
        {trainingId ? (
          <Link
            href={`/dashboard/learning-development/trainings/${encodeURIComponent(trainingId)}?tab=participants`}
            className="text-sm font-medium text-[var(--wt-brand)] hover:underline self-center"
          >
            Detail view
          </Link>
        ) : null}
      </div>

      <TrainingScopePicker trainingId={trainingId} onTrainingIdChange={setTrainingId} required />

      {hasHrAccess ? (
        <section className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5 space-y-4">
          {trainingId ? (
            <TrainingAudienceAdder trainingId={trainingId} currentCount={traineesQ.data?.length ?? 0} />
          ) : null}
          <TrainingParticipantsList
            rows={traineesQ.data ?? []}
            loading={traineesQ.isLoading}
            canManage={hasHrAccess}
            updatingUserId={updatingParticipantId}
            onMarkCompleted={
              trainingId
                ? (userId) =>
                    void updateParticipantStatus(userId, "COMPLETED").catch((e) =>
                      notifyError(e instanceof Error ? e.message : "Failed")
                    )
                : undefined
            }
            onMarkWithdrawn={
              trainingId
                ? (userId) =>
                    void updateParticipantStatus(userId, "WITHDRAWN").catch((e) =>
                      notifyError(e instanceof Error ? e.message : "Failed")
                    )
                : undefined
            }
          />
        </section>
      ) : (
        <p className="text-sm text-wt-text-muted">Trainee management requires HR/Admin.</p>
      )}
    </div>
    </LearningPageShell>
  );
}
