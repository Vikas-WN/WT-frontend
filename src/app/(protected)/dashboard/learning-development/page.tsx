"use client";

import { Button } from "@/components/ui/button";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { MetricCard } from "@/components/dashboard/ui/MetricCard";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { EmployeeLearningCatalog } from "@/components/learning-development/EmployeeLearningCatalog";
import { TrainingCard } from "@/components/learning-development/TrainingCard";
import { useHrTrainingsList } from "@/hooks/learning/useLearningTrainings";

function EmployeeLearningDashboard() {
  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Learning"
        title="Learning & Development"
        description="Browse optional open trainings available to everyone. Enroll to access materials and marks."
      />
      <EmployeeLearningCatalog />
    </div>
  );
}

function HrLearningDashboard() {
  const hrTrainingsQ = useHrTrainingsList();
  const trainings = hrTrainingsQ.data ?? [];
  const isLoading = hrTrainingsQ.isLoading;

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="Learning"
        title="Learning Overview"
        description="Open a training card to manage sessions, trainers, trainees, attendance, and scores."
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard label="Total Trainings" value={trainings.length} loading={isLoading} />
      </div>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-wt-text">Trainings</h2>
          {!isLoading && trainings.length > 0 ? (
            <p className="text-sm text-wt-text-muted">
              {trainings.length} program{trainings.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        {isLoading ? (
          <SectionLoading label="Loading Trainings…" />
        ) : trainings.length === 0 ? (
          <EmptyState
            title="No Trainings Yet"
            description="Create your first training to start building the learning library."
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

  return hasHrAccess ? <HrLearningDashboard /> : <EmployeeLearningDashboard />;
}
