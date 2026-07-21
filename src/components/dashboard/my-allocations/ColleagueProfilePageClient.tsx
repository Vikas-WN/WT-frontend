"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { hrmsService } from "@/services/hrms.service";
import { formatRoleDisplayValue } from "@/utils/roles";
import { colleagueProfilePath } from "@/constants/routes";

type ColleagueProfile = {
  empId: string;
  employeeName: string;
  employeeEmail: string;
  role: string | null;
  department: string | null;
  phoneNumber: string | null;
};

function parseColleagueProfile(data: unknown): ColleagueProfile | null {
  const payload = (data as { data?: unknown })?.data ?? data;
  if (!payload || typeof payload !== "object") return null;
  const row = payload as Record<string, unknown>;
  const empId = String(row.emp_id ?? row.empId ?? "").trim();
  const employeeEmail = String(row.employee_email ?? row.employeeEmail ?? "").trim();
  const employeeName = String(row.employee_name ?? row.employeeName ?? employeeEmail).trim();
  if (!empId || !employeeEmail) return null;
  return {
    empId,
    employeeName,
    employeeEmail,
    role: String(row.role ?? "").trim() || null,
    department: String(row.department ?? "").trim() || null,
    phoneNumber: String(row.phone_number ?? row.phoneNumber ?? "").trim() || null,
  };
}

export function ColleagueProfilePageClient({ empId }: { empId: string }) {
  const normalizedEmpId = empId.trim();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["colleague-profile", normalizedEmpId],
    enabled: Boolean(normalizedEmpId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await hrmsService.getColleagueProfile(normalizedEmpId);
      const parsed = parseColleagueProfile(res);
      if (!parsed) throw new Error("Could not load colleague profile.");
      return parsed;
    },
  });

  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="border-b border-wt-border px-4 py-4 sm:px-6">
          <Link
            href={DASHBOARD_ROUTES["my-allocations"]}
            className="text-sm font-medium text-[var(--wt-brand)] hover:underline"
          >
            ← Back To My Allocations
          </Link>
          <h2 className="mt-3 text-lg font-semibold text-wt-text">Colleague Profile</h2>
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <SectionLoading label="Loading profile…" />
          ) : isError ? (
            <EmptyState
              title="Could Not Load Profile"
              description={error instanceof Error ? error.message : "Please try again."}
              className="py-10"
            />
          ) : data ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-wt-border bg-wt-surface-1 p-5">
              <h3 className="text-xl font-semibold text-wt-text">{data.employeeName}</h3>
              <p className="mt-1 text-sm text-wt-text-muted">{data.employeeEmail}</p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-wt-text-muted">Employee ID</dt>
                  <dd className="mt-1 text-sm text-wt-text">{data.empId}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-wt-text-muted">Role</dt>
                  <dd className="mt-1 text-sm text-wt-text">
                    {data.role ? formatRoleDisplayValue(data.role) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-wt-text-muted">Department</dt>
                  <dd className="mt-1 text-sm text-wt-text">{data.department || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-wt-text-muted">Phone Number</dt>
                  <dd className="mt-1 text-sm text-wt-text">{data.phoneNumber || "—"}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </ContentCard>
    </DashboardPageShell>
  );
}

export function ColleagueProfileLink({
  empId,
  label,
  className,
}: {
  empId: string | null | undefined;
  label: string;
  className?: string;
}) {
  const trimmed = empId?.trim();
  if (!trimmed) {
    return <span className={className}>{label}</span>;
  }
  return (
    <Link
      href={colleagueProfilePath(trimmed)}
      className={className ?? "font-medium text-[var(--wt-brand)] hover:underline"}
    >
      {label}
    </Link>
  );
}
