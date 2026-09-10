"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  ChevronRight,
  ClipboardCheck,
  LayoutGrid,
  Plane,
  Search,
} from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useCommandPalette } from "@/components/dashboard/CommandPalette";
import { useAuth } from "@/context/AuthContext";
import { hrmsService, type WhosOutData } from "@/services/hrms.service";
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

function HomeCard({
  title,
  icon,
  href,
  cta,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
  cta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-wt-border bg-wt-surface-1 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-wt-text-muted">{icon}</span>
          <h2 className="text-sm font-semibold text-wt-text">{title}</h2>
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--wt-brand)] hover:underline"
          >
            {cta ?? "Open"}
            <ChevronRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
    </section>
  );
}

function CardMessage({ text }: { text: string }) {
  return <p className="py-4 text-sm text-wt-text-muted">{text}</p>;
}

function CardSkeleton() {
  return (
    <div className="space-y-2 py-1" aria-hidden>
      <div className="h-3 w-2/3 animate-pulse rounded bg-wt-surface-3" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-wt-surface-3" />
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
  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] || "there";

  const today = useMemo(() => new Date(), []);
  const todayIso = iso(today);

  const balance = useLoad(() => hrmsService.getMyLeaveBalance().then((r) => r.data), []);
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

  return (
    <DashboardPageShell>
      <div>
        <h1 className="text-xl font-semibold text-wt-text sm:text-2xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-wt-text-muted">
          {today.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`${DASHBOARD_ROUTES.leave}?tab=my`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm font-medium text-wt-text transition-colors hover:bg-wt-surface-2"
        >
          <Plane className="size-4 text-wt-text-muted" /> Apply for leave
        </Link>
        <Link
          href={DASHBOARD_ROUTES.timelog}
          className="inline-flex items-center gap-1.5 rounded-xl border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm font-medium text-wt-text transition-colors hover:bg-wt-surface-2"
        >
          <CalendarDays className="size-4 text-wt-text-muted" /> Log time
        </Link>
        <button
          type="button"
          onClick={openSearch}
          className="inline-flex items-center gap-1.5 rounded-xl border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm font-medium text-wt-text transition-colors hover:bg-wt-surface-2"
        >
          <Search className="size-4 text-wt-text-muted" /> Search
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {isApprover ? (
          <HomeCard
            title="Pending approvals"
            icon={<ClipboardCheck className="size-4" />}
            href={DASHBOARD_ROUTES["leave-team"]}
            cta="Review"
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
        ) : null}

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
            <div className="flex gap-5">
              {[
                { label: "Primary", value: balance.data.leave.primary },
                { label: "Secondary", value: balance.data.leave.secondary },
                { label: "Comp-off", value: balance.data.comp_off_balance },
              ].map((b) => (
                <div key={b.label}>
                  <p className="text-2xl font-semibold tabular-nums text-wt-text">
                    {Number(b.value ?? 0)}
                  </p>
                  <p className="text-xs text-wt-text-muted">{b.label}</p>
                </div>
              ))}
            </div>
          )}
        </HomeCard>

        {isApprover ? (
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
        ) : null}

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
      </div>
    </DashboardPageShell>
  );
}
