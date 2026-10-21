"use client";

import { Button } from "@/components/ui/button";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SegmentedTabs } from "@/components/dashboard/ui/SegmentedTabs";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { EmployeeLearningCatalog } from "@/components/learning-development/EmployeeLearningCatalog";
import { TeamTrainingCompletionPanel } from "@/components/learning-development/TeamTrainingCompletionPanel";
import { TrainingCard } from "@/components/learning-development/TrainingCard";
import { useHrTrainingsList } from "@/hooks/learning/useLearningTrainings";
import { LearningPageShell } from "@/components/learning-development/LearningPageShell";

function EmployeeLearningDashboard({ showTeamCompletion = false }: { showTeamCompletion?: boolean }) {
  return (
    <div className="space-y-8">
      <PageHero
        raw
        title="Learning"
        description="Your trainings, and the open programs you can join. Enroll to access materials and marks."
      />
      <EmployeeLearningCatalog />
      {showTeamCompletion ? <TeamTrainingCompletionPanel /> : null}
    </div>
  );
}

function HrLearningDashboard() {
  const hrTrainingsQ = useHrTrainingsList();
  const allTrainings = hrTrainingsQ.data ?? [];
  const isLoading = hrTrainingsQ.isLoading;
  // UI state: which group of programs is showing.
  const [group, setGroup] = useState<"active" | "cancelled" | "all">("active");
  const isCancelled = (row: { status?: unknown }) => String(row.status ?? "").toUpperCase() === "CANCELLED";
  const counts = {
    active: allTrainings.filter((row) => !isCancelled(row)).length,
    cancelled: allTrainings.filter(isCancelled).length,
    all: allTrainings.length,
  };
  const trainings = group === "all" ? allTrainings : allTrainings.filter((row) => (group === "cancelled") === isCancelled(row));

  return (
    <div className="space-y-8">
      <PageHero
        raw
        title="Learning"
        description="Your trainings, and the programs you run for others. Open a card to manage sessions, trainers, trainees, attendance and scores."
        action={
          <Button
            variant="brand"
            nativeButton={false}
            render={<Link href="/dashboard/learning-development/trainings?create=1" />}
          >
            <Plus className="size-4" /> New training
          </Button>
        }
      />

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-wt-text">Programs</h2>
          <SegmentedTabs
            label="Program group"
            value={group}
            onChange={(value) => setGroup(value as "active" | "cancelled" | "all")}
            options={[
              { value: "active", label: `Active ${counts.active}` },
              { value: "cancelled", label: `Cancelled ${counts.cancelled}` },
              { value: "all", label: `All ${counts.all}` },
            ]}
          />
        </div>
        {isLoading ? (
          <SectionLoading label="Loading Trainings…" />
        ) : trainings.length === 0 ? (
          <EmptyState
            title={allTrainings.length === 0 ? "No Trainings Yet" : "Nothing in this group"}
            description={allTrainings.length === 0 ? "Create your first training to start building the learning library." : "Try another group above."}
            action={
              <Button
                variant="brand"
                size="sm"
                nativeButton={false}
                render={<Link href="/dashboard/learning-development/trainings?create=1" />}
              >
                New Training
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {trainings.map((row) => {
              const id = String(row.id ?? "").trim();
              return (
                <TrainingCard
                  key={id || String(row.name)}
                  row={row}
                  href={`/dashboard/learning-development/trainings/${encodeURIComponent(id)}`}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function LearningDevelopmentDashboardPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const hasHrAccess = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const isManager = roles.includes("ROLE_MANAGER") || roles.includes("ROLE_DM");

  return (
    <LearningPageShell>
      {hasHrAccess ? (
        <HrLearningDashboard />
      ) : (
        <EmployeeLearningDashboard showTeamCompletion={isManager} />
      )}
    </LearningPageShell>
  );
}
