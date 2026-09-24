"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileWarning, UserRoundX, ShieldCheck } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import { hrmsService, type ComplianceFlagItem } from "@/services/hrms.service";
import { formatApiDateDisplay } from "@/utils/apiDate";

function FlagBadge({ flag }: { flag: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
      {flag}
    </span>
  );
}

function FlaggedEmployeeRow({ item }: { item: ComplianceFlagItem }) {
  const href = item.emp_id
    ? `/dashboard/employee-directory/${encodeURIComponent(item.emp_id)}`
    : null;
  const content = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-2/40 px-4 py-3 transition-colors hover:bg-wt-surface-2/70">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-wt-text">{item.name}</p>
        <p className="truncate text-xs text-wt-text-muted">
          {item.email}
          {item.last_working_day
            ? ` · LWD ${formatApiDateDisplay(item.last_working_day)}`
            : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {item.flags.map((flag) => (
          <FlagBadge key={flag} flag={flag} />
        ))}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function ComplianceSection({
  title,
  description,
  icon,
  items,
  emptyLabel,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: ComplianceFlagItem[];
  emptyLabel: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 p-5 sm:p-6", CONTENT_CARD_CLASS)}>
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-wt-text">{title}</h3>
            {items.length ? (
              <span className="inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {items.length}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-wt-text-muted">{description}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-wt-border px-4 py-3 text-sm text-wt-text-muted">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <FlaggedEmployeeRow key={`${item.emp_id ?? item.email}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CompliancePageClient() {
  const nudgesQ = useQuery({
    queryKey: ["compliance", "nudges"],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await hrmsService.getComplianceNudges();
      return res.data ?? null;
    },
  });

  const data = nudgesQ.data;

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Employee"
        title="Compliance"
        description="Proactive flags for the active workforce — catch gaps before they surface during offboarding."
      />
      {nudgesQ.isLoading ? (
        <SectionLoading label="Checking compliance…" />
      ) : nudgesQ.isError ? (
        <EmptyState
          title="Could not load compliance data"
          description="Please retry in a moment."
          className="py-10"
        />
      ) : !data || data.total_flagged === 0 ? (
        <EmptyState
          title="Nothing needs attention"
          description="No missing documents, personal info gaps, or upcoming exit surveys without a submission."
          className="py-14"
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          <ComplianceSection
            title="Missing Documents"
            description="Aadhaar, PAN Card, or Profile Photo not on file."
            icon={<FileWarning className="size-4" />}
            items={data.missing_documents}
            emptyLabel="All active employees have their documents on file."
          />
          <ComplianceSection
            title="Missing Personal Info"
            description="Date of Birth or Personal Email not captured."
            icon={<AlertTriangle className="size-4" />}
            items={data.missing_personal_info}
            emptyLabel="No personal-info gaps found."
          />
          <ComplianceSection
            title="Exit Survey Pending"
            description="Serving Notice, last working day approaching, no survey submitted."
            icon={<UserRoundX className="size-4" />}
            items={data.exit_survey_pending}
            emptyLabel="Every upcoming exit has a submitted survey."
          />
        </div>
      )}
    </DashboardPageShell>
  );
}
