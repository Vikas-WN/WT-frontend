"use client";

import { SeasonalGreeting } from "@/components/seasonal/SeasonalGreeting";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Folder,
  GraduationCap,
} from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { WorkspacePaths } from "@/components/dashboard/home/WorkspacePaths";
import { HomeHeader } from "@/components/dashboard/home/HomeHeader";
import { AnimatedBar } from "@/components/motion/AnimatedBar";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HomeSummaryLine } from "@/components/dashboard/home/HomeSummaryLine";
import { HOME_GRID } from "@/constants/homeGrid";
import { daysUntil, holidayWhen } from "@/utils/holidayWhen";
import { useHomeAttention } from "@/hooks/dashboard/useHomeAttention";
import { useHomePendingApprovals } from "@/hooks/dashboard/useHomePendingApprovals";
import { HOME_EMPTY_COPY } from "@/constants/homeCards";
import { HomeCard, CardEmpty, CardMessage, CardSkeleton } from "@/components/dashboard/home/HomeCard";
import { CelebrationsCard } from "@/components/dashboard/home/CelebrationsCard";
import { HomeUpdatesGallery } from "@/components/dashboard/home/HomeUpdatesGallery";
import { TodaysCelebrationsBanner } from "@/components/dashboard/home/TodaysCelebrationsBanner";
import { LeaveBalanceCard } from "@/components/dashboard/home/LeaveBalanceCard";
import { ApprovalsCard } from "@/components/dashboard/home/ApprovalsCard";
import { AttendanceCard } from "@/components/dashboard/home/AttendanceCard";
import { DashboardWidgetFrame } from "@/components/dashboard/home/DashboardWidgetFrame";
import { useHomeDashboardLayout } from "@/hooks/dashboard/useHomeDashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  hrmsService,
  type AttendanceSnapshot,
  type CelebrationsData,
  type WhosOutData,
} from "@/services/hrms.service";
import type { MyLearningSummary } from "@/types/learning";
import { holidayCalendarStorageService } from "@/services/holidayCalendarStorage.service";
import {
  parseHolidayCalendarDate,
  upcomingHolidayRowsInYear,
  type HolidayCalendarRow,
} from "@/utils/holidayCalendarTable";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { normalizeRoles } from "@/utils/roles";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";

type Load<T> = { status: "loading" | "done" | "error"; data: T | null };

function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading", data: null });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ status: "loading", data: s.data }));
    void (async () => {
      try {
        const data = await fn();
        if (alive) setState({ status: "done", data });
      } catch {
        if (alive) setState({ status: "error", data: null });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}


/** The order of the redesign: approvals and leave, who is where and holidays, then learning, projects and celebrations. */
const HOME_WIDGET_IDS = [
  "approvals",
  "leave-balance",
  "attendance",
  "holidays",
  "learning",
  "projects",
  "celebrations",
  "whos-out",
] as const;

/** Wide in the redesign (two of the three columns); everything else takes one. */
const HOME_WIDGET_DEFAULT_SIZES: Record<string, "wide"> = { approvals: "wide", attendance: "wide" };

const HOME_WIDGET_TITLES: Record<string, string> = {
  attendance: "Today's Attendance",
  approvals: "Pending Approvals",
  "leave-balance": "My Leave Balance",
  learning: "My Learning",
  "whos-out": "Who's Out Today",
  projects: "My Projects",
  holidays: "Upcoming Holidays",
  celebrations: "Celebrations",
};

/** Thin completion bar for the Learning card. */
function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <AnimatedBar percent={pct} className="mt-3 h-1.5" />
  );
}

export function HomePageClient() {
  const { user } = useAuth();
  const roles = useMemo(() => normalizeRoles(user?.roles ?? []), [user?.roles]);
  const isApprover =
    roles.includes("ROLE_MANAGER") ||
    roles.includes("ROLE_DM") ||
    roles.includes("ROLE_HR") ||
    roles.includes("ROLE_ADMIN");
  const canSeeOrgOut = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const [editMode, setEditMode] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const { layout, reorder, toggleSize, setHidden, resetLayout } = useHomeDashboardLayout(HOME_WIDGET_IDS, HOME_WIDGET_DEFAULT_SIZES);
  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] || "there";

  const today = useMemo(() => new Date(), []);
  const todayIso = iso(today);

  const balance = useLoad(() => hrmsService.getMyLeaveBalance().then((r) => r.data), []);
  const learning = useLoad<MyLearningSummary | null>(
    () => hrmsService.getMyLearningSummary().then((r) => r.data),
    []
  );
  const allocations = useLoad(
    () => hrmsService.getMyAllocations().then((r) => (r.data ?? []) as Array<Record<string, unknown>>),
    []
  );
  // Who's-out is an approver-only feature (managers/DMs see their team, HR/Admin
  // the whole org). Plain employees never call it — the endpoint would 403.
  const whosOut = useLoad<WhosOutData | null>(
    () =>
      isApprover
        ? hrmsService
            .getWhosOut({
              from: todayIso,
              to: todayIso,
              scope: canSeeOrgOut ? "org" : "team",
            })
            .then((r) => r.data ?? null)
        : Promise.resolve(null),
    [todayIso, isApprover, canSeeOrgOut]
  );
  // Holidays come from the same stored calendar the Annual Calendar page uses
  // (works for every role, independent of the who's-out feature). Pull this year
  // and next so the list still works near the year boundary.
  const thisYear = today.getFullYear();
  const holidays = useLoad<{ year: number; rows: HolidayCalendarRow[] }[]>(async () => {
    const [cur, next] = await Promise.all([
      holidayCalendarStorageService.fetchByYear(thisYear).catch(() => null),
      holidayCalendarStorageService.fetchByYear(thisYear + 1).catch(() => null),
    ]);
    return [
      { year: thisYear, rows: cur?.rows ?? [] },
      { year: thisYear + 1, rows: next?.rows ?? [] },
    ];
  }, [thisYear]);
  // Everyone's card — recurring birthdays & work anniversaries, org-wide.
  const celebrations = useLoad<CelebrationsData | null>(
    () => hrmsService.getCelebrations().then((r) => r.data ?? null),
    []
  );
  // HR/Admin only — today's office / WFH / on-leave headcount.
  const attendance = useLoad<AttendanceSnapshot | null>(
    () =>
      canSeeOrgOut
        ? hrmsService.getAttendanceToday().then((r) => r.data ?? null)
        : Promise.resolve(null),
    [canSeeOrgOut]
  );
  const approvals = useHomePendingApprovals(isApprover);

  // One toast (desktop) / splash (mobile) if any card's data fails — never one
  // per card. See memory `webtrak-ui-conventions`.
  const anyError =
    balance.status === "error" ||
    allocations.status === "error" ||
    whosOut.status === "error" ||
    holidays.status === "error" ||
    celebrations.status === "error" ||
    attendance.status === "error" ||
    approvals.status === "error";
  const errorNotified = useRef(false);
  useEffect(() => {
    if (anyError && !errorNotified.current) {
      errorNotified.current = true;
      notifyError("Couldn't load part of your dashboard.");
    }
    if (!anyError) errorNotified.current = false;
  }, [anyError]);

  const outToday = useMemo(() => {
    const people = whosOut.data?.people ?? [];
    return people.filter((p) =>
      p.entries.some((e) => e.from_date <= todayIso && e.to_date >= todayIso)
    );
  }, [whosOut.data, todayIso]);

  const upcomingHolidays = useMemo(() => {
    const out: { key: string; name: string; label: string; date: Date | null; optional: boolean }[] = [];
    for (const { year, rows } of holidays.data ?? []) {
      for (const row of upcomingHolidayRowsInYear(rows, year, today)) {
        const d = parseHolidayCalendarDate(row.date, year);
        out.push({
          key: `${year}-${row.date}-${row.holiday}`,
          name: row.holiday || "Holiday",
          label: d
            ? d.toLocaleDateString(undefined, { day: "numeric", month: "short" })
            : row.date,
          date: d,
          optional: Boolean(row.optional && row.optional.trim() && row.optional !== "—"),
        });
      }
    }
    return out.slice(0, 3);
  }, [holidays.data, today]);

  const activeProjects = useMemo(() => {
    return (allocations.data ?? [])
      .map((row) => ({
        name: String(
          row.project_name ?? row.projectName ?? row.project_code ?? row.projectCode ?? ""
        ).trim(),
        pct: Number(row.allocation_percentage ?? row.allocationPercentage ?? row.percentage ?? 0),
      }))
      .filter((p) => p.name && p.name.toUpperCase() !== "BENCH");
  }, [allocations.data]);

  const widgetRegistry: Record<string, { eligible: boolean; node: React.ReactNode }> = {
    attendance: {
      eligible: canSeeOrgOut,
      node: <AttendanceCard data={attendance.data} status={attendance.status} />,
    },
    approvals: {
      eligible: isApprover,
      node: <ApprovalsCard status={approvals.status} count={approvals.count} items={approvals.items} />,
    },
    "leave-balance": {
      eligible: true,
      node: <LeaveBalanceCard />,
    },
    learning: {
      eligible: true,
      node: (
        <HomeCard title="My learning" href={DASHBOARD_ROUTES.learning} cta="Open">
          {learning.status === "loading" ? (
            <CardSkeleton />
          ) : learning.status === "error" || !learning.data ? (
            <CardMessage text="Unavailable" />
          ) : learning.data.enrolled_count === 0 ? (
            <CardEmpty icon={<GraduationCap className="size-5" />} title={HOME_EMPTY_COPY.learning.title} hint={HOME_EMPTY_COPY.learning.hint} />
          ) : (
            <div className="space-y-4">
              {learning.data.overdue_mandatory_count > 0 ? (
                <Link
                  href={DASHBOARD_ROUTES.learning}
                  className="flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/8 px-4 py-3.5 text-rose-800 transition-colors hover:bg-rose-500/12 dark:text-rose-200"
                >
                  <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">
                      {learning.data.overdue_mandatory_count} mandatory training{learning.data.overdue_mandatory_count === 1 ? "" : "s"} overdue
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold">Resume training</span>
                  </span>
                </Link>
              ) : learning.data.next_deadline_training_name ? (
                <p className="rounded-2xl bg-wt-surface-2 px-4 py-3 text-sm text-wt-text-muted">Next due: {learning.data.next_deadline_training_name}</p>
              ) : null}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Enrolled", value: learning.data.enrolled_count },
                  { label: "In progress", value: learning.data.in_progress_count },
                  { label: "Completed", value: learning.data.completed_count },
                ].map((b) => (
                  <div key={b.label}>
                    <p className="text-[1.65rem] font-bold leading-none tabular-nums text-wt-text">
                      <AnimatedNumber value={Number(b.value ?? 0)} />
                    </p>
                    <p className="mt-1 text-sm text-wt-text-muted">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </HomeCard>
      ),
    },
    "whos-out": {
      eligible: isApprover,
      node: (
        <HomeCard title="Who's out today" href={DASHBOARD_ROUTES["whos-out"]} cta="Calendar">
          {whosOut.status === "loading" ? (
            <CardSkeleton />
          ) : whosOut.status === "error" ? (
            <CardMessage text="Unavailable" />
          ) : outToday.length === 0 ? (
            <CardEmpty icon={<CalendarRange className="size-5" />} title={HOME_EMPTY_COPY.whosOut.title} hint={HOME_EMPTY_COPY.whosOut.hint} />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {outToday.slice(0, 5).map((p) => (
                <span
                  key={p.email}
                  className="rounded-md bg-wt-surface-2 px-2 py-1 text-xs text-wt-text"
                >
                  {p.name.split(" ")[0]}
                </span>
              ))}
              {outToday.length > 5 ? (
                <span className="rounded-md px-2 py-1 text-xs text-wt-text-muted">
                  +{outToday.length - 5} more
                </span>
              ) : null}
            </div>
          )}
        </HomeCard>
      ),
    },
    projects: {
      eligible: true,
      node: (
        <HomeCard title="My projects" href={DASHBOARD_ROUTES["my-allocations"]} cta="Allocations">
          {allocations.status === "loading" ? (
            <CardSkeleton />
          ) : allocations.status === "error" ? (
            <CardMessage text="Unavailable" />
          ) : activeProjects.length === 0 ? (
            <CardEmpty icon={<Folder className="size-5" />} title={HOME_EMPTY_COPY.projects.title} hint={HOME_EMPTY_COPY.projects.hint} />
          ) : (
            <ul className="space-y-1.5">
              {activeProjects.slice(0, 4).map((p) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between text-sm text-wt-text"
                >
                  <span className="min-w-0 truncate">{p.name}</span>
                  {p.pct > 0 ? (
                    <span className="shrink-0 text-xs text-wt-text-muted">{p.pct}%</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </HomeCard>
      ),
    },
    holidays: {
      eligible: true,
      node: (
        <HomeCard title="Upcoming holidays" href={DASHBOARD_ROUTES["annual-calendar"]} cta="Calendar">
          {holidays.status === "loading" ? (
            <CardSkeleton />
          ) : holidays.status === "error" ? (
            <CardMessage text="Unavailable" />
          ) : upcomingHolidays.length === 0 ? (
            <CardEmpty icon={<CalendarDays className="size-5" />} title={HOME_EMPTY_COPY.holidays.title} hint={HOME_EMPTY_COPY.holidays.hint} />
          ) : (
            <ul className="space-y-2">
              {upcomingHolidays.map((h, index) => {
                const when = h.date ? holidayWhen(h.date, today) : null;
                return (
                  <li key={h.key} className={cn("flex items-center gap-3.5 rounded-2xl px-3 py-2.5", index === 0 && "bg-[var(--wt-brand-soft)]")}>
                    <span
                      className={cn(
                        "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl leading-none",
                        index === 0 ? "bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "border border-wt-border bg-wt-surface-1 text-wt-text"
                      )}
                      aria-hidden
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{h.date ? h.date.toLocaleDateString("en-GB", { month: "short" }) : ""}</span>
                      <span className="mt-0.5 text-lg font-bold tabular-nums">{h.date ? h.date.getDate() : ""}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-wt-text">
                        {h.name}
                        {h.optional ? <span className="ml-1.5 text-xs font-normal text-wt-text-faint">optional</span> : null}
                      </span>
                      <span className={cn("block truncate text-sm", index === 0 ? "text-[var(--wt-brand)]" : "text-wt-text-muted")}>{when ?? h.label}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </HomeCard>
      ),
    },
    celebrations: {
      eligible: true,
      node: <CelebrationsCard data={celebrations.data} status={celebrations.status} />,
    },
  };

  const visibleLayout = layout.filter((w) => widgetRegistry[w.id]?.eligible && !w.hidden);
  const hiddenWidgets = layout
    .filter((w) => widgetRegistry[w.id]?.eligible && w.hidden)
    .map((w) => ({ id: w.id, title: HOME_WIDGET_TITLES[w.id] ?? w.id }));

  // Desktop: three columns, as in the redesign (a wide card takes two). Rows are as tall as their content needs.
  const attention = useHomeAttention(approvals.count);
  const columns = HOME_GRID.columnsDesktop;
  const nextHoliday = upcomingHolidays[0];
  const closedTomorrow = nextHoliday?.date && daysUntil(nextHoliday.date, today) === 1 ? nextHoliday.name : null;

  return (
    <DashboardPageShell
      className={cn(
        "wt-home-workspace space-y-7"
      )}
    >
      <HomeHeader
        eyebrow={`${canSeeOrgOut ? "Organization workspace" : isApprover ? "Team workspace" : "Your workspace"} · ${today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}`}
        title={`${greeting()}, ${firstName}`}
        subtitle={
          <HomeSummaryLine approvals={approvals.count} overdueTrainings={learning.data?.overdue_mandatory_count ?? 0} closedTomorrow={closedTomorrow} fallback={attention} />
        }
        editMode={editMode}
        onEditModeChange={setEditMode}
        hiddenWidgets={hiddenWidgets}
        onShowWidget={(id) => setHidden(id, false)}
        onReset={resetLayout}
      />

      <WorkspacePaths mode={canSeeOrgOut ? "admin" : isApprover ? "manager" : "employee"} />

      <SeasonalGreeting />

      <HomeUpdatesGallery />

      <TodaysCelebrationsBanner />

      {visibleLayout.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-wt-border p-8 text-center text-sm text-wt-text-muted">
          All widgets are hidden.{" "}
          {editMode ? "Use “Add widget” above to bring one back." : "Click “Customize” to add one back."}
        </div>
      ) : (
        // Columns follow the width of the page area (not the window): the sidebar takes ~250px, so a window-based
        // breakpoint thinks a laptop has room for more columns than it does and makes the cards too wide and large.
        <div className="@container">
        <div
          className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-4 @2xl:grid-cols-2 @2xl:gap-5 @2xl:grid-flow-dense @2xl:auto-rows-min @5xl:grid-cols-[repeat(var(--home-cols),minmax(0,1fr))]"
          style={{ "--home-cols": columns } as React.CSSProperties}
        >
          {visibleLayout.map((w) => (
            <DashboardWidgetFrame
              key={w.id}
              id={w.id}
              size={w.size}
              editing={editMode}
              draggedId={draggedWidgetId}
              onDragStart={setDraggedWidgetId}
              onDrop={(targetId) => {
                if (draggedWidgetId) reorder(draggedWidgetId, targetId);
                setDraggedWidgetId(null);
              }}
              onDragEnd={() => setDraggedWidgetId(null)}
              onToggleSize={toggleSize}
              onHide={(id) => setHidden(id, true)}
            >
              {widgetRegistry[w.id]?.node}
            </DashboardWidgetFrame>
          ))}
        </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
