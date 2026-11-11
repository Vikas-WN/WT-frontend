"use client";

import { useCallback, useMemo, useState } from "react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { PageSectionHeader } from "@/components/dashboard/ui/PageSectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/api/error";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { hrmsService } from "@/services/hrms.service";
import { downloadBlob } from "@/utils/downloadBlob";
import { normalizeRoles } from "@/utils/roles";

const SHEETS: Array<{ name: string; detail: string }> = [
  { name: "Summary", detail: "One row per employee: days taken in each month, full days, half days and the year total." },
  { name: "Leave Dates", detail: "One row per employee, one column per month, listing the exact dates (full and half days apart)." },
  { name: "Detail", detail: "One row for every leave day with date, weekday, full or half day, leave type and loss of pay. Filterable." },
];

export function LeaveYearReportPageClient() {
  const { user } = useAuth();
  const roles = useMemo(() => normalizeRoles(user?.roles ?? []), [user?.roles]);
  const isHrOrAdmin = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");

  // Read once per mount; the list of selectable years only needs to be right when the page opens.
  const [currentYear] = useState(() => new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const [downloading, setDownloading] = useState(false);
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const blob = await hrmsService.downloadYearlyLeaveReport({ year });
      downloadBlob(blob, `Leave_Report_${year}.xlsx`);
      showSuccessToast(`Leave report for ${year} downloaded.`);
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : "";
      showErrorToast(message || "Could not download the yearly leave report.");
    } finally {
      setDownloading(false);
    }
  }, [year]);

  if (!isHrOrAdmin) {
    return (
      <DashboardPageShell>
        <EmptyState title="Not available" description="The yearly leave report is available to HR and Admin only." />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <PageSectionHeader
        title="Yearly Leave Report"
        description="Download an Excel workbook for a calendar year, January to December, showing the dates every employee took leave, with half days marked separately."
      />
      <Card>
        <CardHeader>
          <CardTitle>Choose a year</CardTitle>
          <CardDescription>
            Approved leave and optional leave only. Weekends and company holidays are not counted, so totals match leave balances.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-wt-text-muted">Year</span>
              <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button onClick={() => void handleDownload()} disabled={downloading}>
              {downloading ? "Preparing…" : "Download Excel"}
            </Button>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">The workbook has three sheets</p>
            <ul className="flex flex-col gap-1.5 text-sm text-wt-text-muted">
              {SHEETS.map((sheet) => (
                <li key={sheet.name}>
                  <span className="font-medium text-foreground">{sheet.name}</span> — {sheet.detail}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
