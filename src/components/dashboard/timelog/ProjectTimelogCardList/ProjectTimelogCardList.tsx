"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";
import { TABLE_ROW_SELECTED_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import type { ProjectTimelogCardListProps } from "./ProjectTimelogCardList.types";

function employeeTotal(
  totals: Record<string, { email: string; name: string; week_total: number }[]>,
  projectCode: string,
  email: string
): string {
  const code = projectCode.trim().toUpperCase();
  const list =
    totals[projectCode] ??
    totals[code] ??
    Object.entries(totals).find(([key]) => key.trim().toUpperCase() === code)?.[1];
  if (!list) return "0";
  const found = list.find(
    (e) => e.email.trim().toLowerCase() === email.trim().toLowerCase()
  );
  if (!found) return "0";
  const t = found.week_total;
  if (t <= 0) return "0";
  return t % 1 === 0 ? String(t) : t.toFixed(2);
}

export function ProjectTimelogCardList({
  projects,
  weekTotals,
  weekTotalsLoading,
  expandedProject,
  selectedEmployee,
  onToggleProject,
  onSelectEmployee,
}: ProjectTimelogCardListProps) {
  if (!projects.length) {
    return (
      <p className="py-8 text-center text-sm text-wt-text-muted">No projects available.</p>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const isExpanded = expandedProject === project.project_code;
        return (
          <div
            key={project.project_code}
            className="overflow-hidden rounded-xl border border-wt-border bg-wt-surface-1"
          >
            <div
              className="flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-wt-surface-2"
              onClick={() => onToggleProject(project.project_code)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleProject(project.project_code); } }}
            >
              <span className="min-w-0 truncate text-sm font-medium text-wt-text">
                {project.project_name}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-wt-text-muted">
                {project.employees.length} member{project.employees.length !== 1 ? "s" : ""}
                {isExpanded ? (
                  <ChevronUp className="size-3.5" aria-hidden />
                ) : (
                  <ChevronDown className="size-3.5" aria-hidden />
                )}
              </span>
            </div>
            {isExpanded ? (
              <div className="divide-y divide-wt-border border-t border-wt-border">
                {weekTotalsLoading ? (
                  <div className="p-4">
                    <WtLoaderCentered label="" />
                  </div>
                ) : !project.employees.length ? (
                  <p className="px-3.5 py-3 text-center text-sm text-wt-text-muted">
                    No employees allocated
                  </p>
                ) : (
                  project.employees.map((emp) => {
                    const selected =
                      selectedEmployee?.trim().toLowerCase() === emp.email.trim().toLowerCase();
                    return (
                      <div
                        key={emp.email}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2 text-sm transition-colors hover:bg-wt-surface-2",
                          selected && TABLE_ROW_SELECTED_CLASS
                        )}
                        onClick={() => onSelectEmployee(emp.email)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectEmployee(emp.email); } }}
                      >
                        <span className="min-w-0 truncate font-medium text-wt-text">{emp.name}</span>
                        <span className="shrink-0 tabular-nums text-wt-text-muted">
                          {employeeTotal(weekTotals, project.project_code, emp.email)}h
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
