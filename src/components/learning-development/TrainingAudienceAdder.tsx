"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AudiencePicker, isAudienceComplete } from "@/components/audience/AudiencePicker";
import { AUDIENCE_COPY, TRAINING_AUDIENCE_COPY, describeAudience } from "@/constants/audience";
import { useAudienceOptions } from "@/hooks/announcements/useAnnouncements";
import { useAddTrainingAudience } from "@/hooks/learning/useLearningTrainings";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { AudienceSpec } from "@/types/audience";

const START: AudienceSpec = { scope: "USERS", departments: [], project_ids: [], user_ids: [] };

/** Add trainees to an existing training: specific people, departments, projects, your team, or everyone. */
export function TrainingAudienceAdder({ trainingId, currentCount }: { trainingId: string; currentCount: number }) {
  const options = useAudienceOptions(Boolean(trainingId));
  const add = useAddTrainingAudience(trainingId);
  // The picker's in-progress choice; reset after a successful add.
  const [audience, setAudience] = useState<AudienceSpec>(START);

  const summary = describeAudience(audience.scope, {
    departments: audience.departments.length,
    projects: audience.project_ids.length,
    users: audience.user_ids.length,
  });

  const submit = () =>
    add.mutate(audience, {
      onSuccess: (total) => {
        notifySuccess(TRAINING_AUDIENCE_COPY.added(Math.max(0, total - currentCount)));
        setAudience(START);
      },
      onError: (e) => notifyError(e instanceof Error ? e.message : String(e)),
    });

  if (options.isLoading) return <p className="text-sm text-wt-text-muted">{AUDIENCE_COPY.loading}</p>;
  if (!options.data) return <p className="text-sm text-rose-600 dark:text-rose-400">{AUDIENCE_COPY.error}</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-wt-text">{TRAINING_AUDIENCE_COPY.addHeading}</h3>
      <AudiencePicker options={options.data} value={audience} onChange={setAudience} />
      <div className="flex justify-end">
        <Button
          variant="brand"
          size="sm"
          type="button"
          className="px-4 py-2 text-sm"
          disabled={!trainingId || add.isPending || !isAudienceComplete(audience)}
          onClick={submit}
        >
          {add.isPending ? TRAINING_AUDIENCE_COPY.adding : TRAINING_AUDIENCE_COPY.add(summary)}
        </Button>
      </div>
    </div>
  );
}
