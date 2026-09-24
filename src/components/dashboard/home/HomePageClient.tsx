"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  Check,
  ClipboardCheck,
  GraduationCap,
  LayoutGrid,
  Plane,
  Search,
  Settings2,
} from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { useCommandPalette } from "@/components/dashboard/CommandPalette";
import { HomeCard, CardMessage, CardSkeleton } from "@/components/dashboard/home/HomeCard";
import { CelebrationsCard } from "@/components/dashboard/home/CelebrationsCard";
import { TodaysCelebrationsBanner } from "@/components/dashboard/home/TodaysCelebrationsBanner";
import { QuickPollCard } from "@/components/dashboard/home/QuickPollCard";
import { AttendanceCard } from "@/components/dashboard/home/AttendanceCard";
import { DashboardWidgetFrame } from "@/components/dashboard/home/DashboardWidgetFrame";
import { AddWidgetMenu } from "@/components/dashboard/home/AddWidgetMenu";
import { useHomeDashboardLayout } from "@/hooks/dashboard/useHomeDashboardLayout";
import { Button } from "@/components/ui/button";
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
import { fetchPaginatedScopedUserRequests } from "@/utils/userRequest";
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

const LEAVE_SEGMENT_COLORS = ["bg-[var(--wt-brand)]", "bg-emerald-500", "bg-amber-500"] as const;

const HOME_WIDGET_IDS = [
  "attendance",
  "approvals",
  "leave-balance",
  "learning",
  "whos-out",
  "projects",
  "holidays",
  "celebrations",
  "quick-poll",
] as const;

const HOME_WIDGET_TITLES: Record<string, string> = {
  attendance: "Today's Attendance",
  approvals: "Pending Approvals",
  "leave-balance": "My Leave Balance",
  learning: "My Learning",
  "whos-out": "Who's Out Today",
  projects: "My Projects",
  holidays: "Upcoming Holidays",
  celebrations: "Celebrations",
  "quick-poll": "Quick Poll",
};

/** Proportional split bar under the leave-balance numbers — purely visual,
 *  degrades gracefully (renders nothing) when every bucket is zero. */
function LeaveSplitBar({ values }: { values: number[] }) {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  if (total <= 0) return null;
  return (
    <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-wt-surface-3">
      {values.map((v, i) =>
        v > 0 ? (
          <div
            key={i}
            className={LEAVE_SEGMENT_COLORS[i % LEAVE_SEGMENT_COLORS.length]}
            style={{ width: `${(Math.max(0, v) / total) * 100}%` }}
          />
        ) : null
      )}
    </div>
  );
}

/** Thin completion bar for the Learning card. */
function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-wt-surface-3">
      <div
        className="h-full rounded-full bg-[var(--wt-brand)] transition-[width] duration-500 ease-[var(--wt-ease)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function HomePageClient() {
  const { user } = useAuth();
  const { open: openSearch } = useCommandPalette();
  const roles = useMemo(() => normalizeRoles(user?.roles ?? []), [user?.roles]);
  const isApprover =
    roles.includes("ROLE_MANAGER") ||
    roles.includes("ROLE_DM") ||
    roles.includes("ROLE_HR") ||
    roles.includes("ROLE_ADMIN");
  const canSeeOrgOut = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const [editMode, setEditMode] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const { layout, reorder, toggleSize, setHidden, resetLayout } = useHomeDashboardLayout(HOME_WIDGET_IDS);
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
  const approvals = useLoad<number | null>(async () => {
    if (!isApprover) return null;
    const from = new Date(today);
    from.setDate(from.getDate() - 45);
    const to = new Date(today);
    to.setDate(to.getDate() + 60);
    const scopes: Array<{ orgScope?: boolean; hrTeamScope?: boolean }> = [
      { orgScope: true },
      { hrTeamScope: true },
    ];
    const seen = new Set<string>();
    let pending = 0;
    for (const scope of scopes) {
      try {
        const res = await fetchPaginatedScopedUserRequests({
          fromDate: iso(from),
          toDate: iso(to),
          requestType: "ALL",
          page: 0,
          size: 200,
          ...scope,
        });
        for (const row of res.rows) {
          const id = String(
            row.user_request_id ?? row.userRequestId ?? row.id ?? Math.random()
          );
          const status = String(row.status ?? row.final_status ?? "").toUpperCase();
          if (!seen.has(id) && status === "PENDING") {
            seen.add(id);
            pending += 1;
          }
        }
      } catch {
        /* one scope failing shouldn't blank the card */
      }
    }
    return pending;
  }, [isApprover, todayIso]);

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
    const out: { key: string; name: string; label: string; optional: boolean }[] = [];
    for (const { year, rows } of holidays.data ?? []) {
      for (const row of upcomingHolidayRowsInYear(rows, year, today)) {
        const d = parseHolidayCalendarDate(row.date, year);
        out.push({
          key: `${year}-${row.date}-${row.holiday}`,
          name: row.holiday || "Holiday",
          label: d
            ? d.toLocaleDateString(undefined, { day: "numeric", month: "short" })
            : row.date,
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
      node: (
        <HomeCard
          title="Pending approvals"
          icon={<ClipboardCheck className="size-4" />}
          href={DASHBOARD_ROUTES["leave-team"]}
          cta="Review"
          featured={Boolean(approvals.data)}
        >
          {approvals.status === "loading" ? (
            <CardSkeleton />
          ) : approvals.status === "error" || approvals.data == null ? (
            <p className="text-sm text-wt-text-muted">Open your team requests to review.</p>
          ) : approvals.data === 0 ? (
            <p className="text-sm text-wt-text-muted">Nothing waiting on you. 🎉</p>
          ) : (
            <p className="text-3xl font-semibold tabular-nums text-wt-text">
              {approvals.data}
              <span className="ml-2 align-middle text-sm font-normal text-wt-text-muted">
                awaiting your review
              </span>
            </p>
          )}
        </HomeCard>
      ),
    },
    "leave-balance": {
      eligible: true,
      node: (
        <HomeCard
          title="My leave balance"
          icon={<Plane className="size-4" />}
          href={`${DASHBOARD_ROUTES.leave}?tab=my`}
          cta="Details"
        >
          {balance.status === "loading" ? (
            <CardSkeleton />
          ) : balance.status === "error" || !balance.data ? (
            <CardMessage text="Unavailable" />
          ) : (
            <div>
              <div className="flex gap-5">
                {[
                  { label: "Primary", value: balance.data.leave.primary, dot: LEAVE_SEGMENT_COLORS[0] },
                  { label: "Secondary", value: balance.data.leave.secondary, dot: LEAVE_SEGMENT_COLORS[1] },
                  { label: "Comp-off", value: balance.data.comp_off_balance, dot: LEAVE_SEGMENT_COLORS[2] },
                ].map((b) => (
                  <div key={b.label}>
                    <p className="text-2xl font-semibold tabular-nums text-wt-text">
                      {Number(b.value ?? 0)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-wt-text-muted">
                      <span className={cn("size-1.5 rounded-full", b.dot)} aria-hidden />
                      {b.label}
                    </p>
                  </div>
                ))}
              </div>
              <LeaveSplitBar
                values={[
                  Number(balance.data.leave.primary ?? 0),
                  Number(balance.data.leave.secondary ?? 0),
                  Number(balance.data.comp_off_balance ?? 0),
                ]}
              />
            </div>
          )}
        </HomeCard>
      ),
    },
    learning: {
      eligible: true,
      node: (
        <HomeCard
          title="My learning"
          icon={<GraduationCap className="size-4" />}
          href={DASHBOARD_ROUTES.learning}
          cta="Open"
        >
          {learning.status === "loading" ? (
            <CardSkeleton />
          ) : learning.status === "error" || !learning.data ? (
            <CardMessage text="Unavailable" />
          ) : learning.data.enrolled_count === 0 ? (
            <p className="text-sm text-wt-text-muted">No trainings enrolled yet.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-5">
                {[
                  { label: "Enrolled", value: learning.data.enrolled_count },
                  { label: "Completed", value: learning.data.completed_count },
                  { label: "In progress", value: learning.data.in_progress_count },
                ].map((b) => (
                  <div key={b.label}>
                    <p className="text-2xl font-semibold tabular-nums text-wt-text">{b.value}</p>
                    <p className="text-xs text-wt-text-muted">{b.label}</p>
                  </div>
                ))}
              </div>
              <ProgressBar value={learning.data.completed_count} max={learning.data.enrolled_count} />
              {learning.data.overdue_mandatory_count > 0 ? (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {learning.data.overdue_mandatory_count} mandatory training
                  {learning.data.overdue_mandatory_count === 1 ? "" : "s"} overdue
                </p>
              ) : learning.data.next_deadline_training_name ? (
                <p className="text-xs text-wt-text-muted">
                  Next due: {learning.data.next_deadline_training_name}
                </p>
              ) : null}
            </div>
          )}
        </HomeCard>
      ),
    },
    "whos-out": {
      eligible: isApprover,
      node: (
        <HomeCard
          title="Who's out today"
          icon={<CalendarRange className="size-4" />}
          href={DASHBOARD_ROUTES["whos-out"]}
          cta="Calendar"
        >
          {whosOut.status === "loading" ? (
            <CardSkeleton />
          ) : whosOut.status === "error" ? (
            <CardMessage text="Unavailable" />
          ) : outToday.length === 0 ? (
            <p className="text-sm text-wt-text-muted">Everyone&apos;s in today.</p>
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
        <HomeCard
          title="My projects"
          icon={<LayoutGrid className="size-4" />}
          href={DASHBOARD_ROUTES["my-allocations"]}
          cta="Allocations"
        >
          {allocations.status === "loading" ? (
            <CardSkeleton />
          ) : allocations.status === "error" ? (
            <CardMessage text="Unavailable" />
          ) : activeProjects.length === 0 ? (
            <p className="text-sm text-wt-text-muted">No active project allocation.</p>
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
        <HomeCard
          title="Upcoming holidays"
          icon={<CalendarDays className="size-4" />}
          href={DASHBOARD_ROUTES["annual-calendar"]}
          cta="Calendar"
        >
          {holidays.status === "loading" ? (
            <CardSkeleton />
          ) : holidays.status === "error" ? (
            <CardMessage text="Unavailable" />
          ) : upcomingHolidays.length === 0 ? (
            <p className="text-sm text-wt-text-muted">No holidays coming up.</p>
          ) : (
            <ul className="space-y-1.5">
              {upcomingHolidays.map((h) => (
                <li key={h.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-wt-text">
                    {h.name}
                    {h.optional ? (
                      <span className="ml-1.5 text-xs text-wt-text-faint">optional</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs text-wt-text-muted">{h.label}</span>
                </li>
              ))}
            </ul>
          )}
        </HomeCard>
      ),
    },
    celebrations: {
      eligible: true,
      node: <CelebrationsCard data={celebrations.data} status={celebrations.status} />,
    },
    "quick-poll": {
      eligible: true,
      node: <QuickPollCard />,
    },
  };

  const visibleLayout = layout.filter((w) => widgetRegistry[w.id]?.eligible && !w.hidden);
  const hiddenWidgets = layout
    .filter((w) => widgetRegistry[w.id]?.eligible && w.hidden)
    .map((w) => ({ id: w.id, title: HOME_WIDGET_TITLES[w.id] ?? w.id }));

  return (
    <DashboardPageShell>
      <PageHero
        surface
        raw
        eyebrow={today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting()}, ${firstName}`}
        description="Here's where things stand across your work today."
        action={
          <>
            <Button variant="brand" size="sm" render={<Link href={`${DASHBOARD_ROUTES.leave}?tab=my`} />}>
              <Plane className="size-4" /> Apply for leave
            </Button>
            <Button variant="outline" size="sm" render={<Link href={DASHBOARD_ROUTES.timelog} />}>
              <CalendarDays className="size-4" /> Log time
            </Button>
            <Button variant="outline" size="sm" onClick={openSearch}>
              <Search className="size-4" /> Search
            </Button>
          </>
        }
      />

      <TodaysCelebrationsBanner />

      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        {editMode ? (
          <>
            <AddWidgetMenu hiddenWidgets={hiddenWidgets} onShow={(id) => setHidden(id, false)} />
            <Button variant="outline" size="sm" onClick={resetLayout}>
              Reset layout
            </Button>
            <Button variant="brand" size="sm" onClick={() => setEditMode(false)}>
              <Check className="size-4" /> Done
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
            <Settings2 className="size-4" /> Customize
          </Button>
        )}
      </div>

      {visibleLayout.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-wt-border p-8 text-center text-sm text-wt-text-muted">
          All widgets are hidden.{" "}
          {editMode ? "Use “Add widget” above to bring one back." : "Click “Customize” to add one back."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      )}
    </DashboardPageShell>
  );
}
