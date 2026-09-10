"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DataTable } from "@/components/dashboard/ui/DataTable";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { MetricCard } from "@/components/dashboard/ui/MetricCard";
import { PageSectionHeader } from "@/components/dashboard/ui/PageSectionHeader";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/api/error";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { hrmsService, type LopReportData } from "@/services/hrms.service";
import { normalizeRoles } from "@/utils/roles";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TABLE_COLUMNS = [
  "emp_id",
  "name",
  "email",
  "employee_type",
  "band",
  "primary_balance",
  "secondary_balance",
  "lop_days",
];

function clampMonth(value: number | null): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return value >= 1 && value <= 12 ? value : null;
}

function readableError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "";
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function LopReportPageClient() {
  const { user } = useAuth();
  const roles = useMemo(() => normalizeRoles(user?.roles ?? []), [user?.roles]);
  const isHrOrAdmin = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");

  const searchParams = useSearchParams();
  const now = useMemo(() => new Date(), []);

  const initialYear = useMemo(() => {
    const raw = Number(searchParams.get("year"));
    return raw >= 2000 && raw <= 2100 ? raw : now.getFullYear();
  }, [searchParams, now]);
  const initialMonth = useMemo(() => {
    return clampMonth(Number(searchParams.get("month"))) ?? now.getMonth() + 1;
  }, [searchParams, now]);

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState<LopReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const yearOptions = useMemo(() => {
    const current = now.getFullYear();
    return [current, current - 1, current - 2];
  }, [now]);

  const loadReport = useCallback(async () => {
    if (!isHrOrAdmin) return;
    setLoading(true);
    setConfirmSend(false);
    try {
      const res = await hrmsService.getLopReport({ year, month });
      setReport(res?.data ?? null);
    } catch (error) {
      setReport(null);
      showErrorToast(readableError(error) || "Could not load the LOP report.");
    } finally {
      setLoading(false);
    }
  }, [isHrOrAdmin, year, month]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const blob = await hrmsService.downloadLopReport({ year, month });
      const label = report?.month_label ?? MONTHS[month - 1];
      triggerBlobDownload(blob, `LOP_Report_${label}_${year}.xlsx`);
      showSuccessToast("LOP report downloaded.");
    } catch (error) {
      showErrorToast(readableError(error) || "Could not download the LOP report.");
    } finally {
      setDownloading(false);
    }
  }, [year, month, report]);

  const handleSend = useCallback(async () => {
    setSending(true);
    try {
      const res = await hrmsService.sendLopReportToFinance({ year, month });
      const to = res?.data?.finance_email ?? report?.finance_email ?? "the finance team";
      showSuccessToast(`LOP report sent to ${to}.`);
      setConfirmSend(false);
    } catch (error) {
      showErrorToast(readableError(error) || "Could not send the LOP report.");
    } finally {
      setSending(false);
    }
  }, [year, month, report]);

  if (!isHrOrAdmin) {
    return (
      <DashboardPageShell>
        <EmptyState
          title="Not available"
          description="The LOP report is available to HR and Admin only."
        />
      </DashboardPageShell>
    );
  }

  const rows = report?.rows ?? [];
  const financeEmail = report?.finance_email?.trim() || "";
  const periodLabel =
    report?.period_label ?? `${MONTHS[month - 1]} ${year}`;

  return (
    <DashboardPageShell>
      <PageSectionHeader
        title="LOP Report"
        description="Active full-time employees, consultants and interns whose leave balance is negative for the month. Generated automatically on the last working day of each month; download the sheet and send it to the finance team."
      />

      <Card>
        <CardHeader>
          <CardTitle>Report period</CardTitle>
          <CardDescription>
            {report
              ? `${periodLabel} · auto-generation date ${report.generated_on}`
              : periodLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-wt-text-muted">Month</span>
              <Select
                value={String(month)}
                onValueChange={(value) => setMonth(Number(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((label, index) => (
                    <SelectItem key={label} value={String(index + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-wt-text-muted">Year</span>
              <Select
                value={String(year)}
                onValueChange={(value) => setYear(Number(value))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button
              variant="outline"
              onClick={() => void loadReport()}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void handleDownload()}
              disabled={loading || downloading || !report}
            >
              {downloading ? "Preparing…" : "Download Excel"}
            </Button>

            {confirmSend ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-wt-text-muted">
                  Email this report to {financeEmail || "the finance team"}?
                </span>
                <Button
                  onClick={() => void handleSend()}
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Confirm send"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmSend(false)}
                  disabled={sending}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setConfirmSend(true)}
                disabled={loading || !report}
              >
                Send to finance
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <SectionLoading label="Loading LOP report…" />
      ) : (
        <>
          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <MetricCard
              label="Employees in LOP"
              value={report?.total_employees ?? 0}
              loading={false}
            />
            <MetricCard
              label="Total LOP days"
              value={report?.total_lop_days ?? 0}
              loading={false}
            />
          </div>

          <DataTable
            title={`LOP breakdown — ${periodLabel}`}
            columns={TABLE_COLUMNS}
            rows={rows as unknown as Array<Record<string, unknown>>}
            emptyLabel="No employee is in LOP for this month."
            compact
          />
        </>
      )}
    </DashboardPageShell>
  );
}
