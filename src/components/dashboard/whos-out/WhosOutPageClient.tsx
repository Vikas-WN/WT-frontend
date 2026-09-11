"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarRange, RotateCw } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageSectionHeader } from "@/components/dashboard/ui/PageSectionHeader";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  hrmsService,
  type WhosOutData,
  type WhosOutEntry,
  type WhosOutPerson,
} from "@/services/hrms.service";
import { normalizeRoles } from "@/utils/roles";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AGENDA_PAGE_SIZE = 12;

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function parseMonthParam(v: string | null): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(v ?? "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return Number.isNaN(d.getTime()) ? null : d;
}
function monthRange(anchor: Date): { from: string; to: string } {
  const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { from: iso(from), to: iso(to) };
}
function eachDayIso(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  const d = new Date(`${fromIso}T00:00:00`);
  const end = new Date(`${toIso}T00:00:00`);
  while (d <= end) {
    out.push(iso(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

type DayOccurrence = { person: WhosOutPerson; entry: WhosOutEntry };

const ENTRY_LABEL: Record<string, string> = {
  LEAVE: "Leave",
  WFH: "WFH",
  WFH_EXCEPTION: "Extra WFH",
};
function entryLabel(e: WhosOutEntry): string {
  const base = ENTRY_LABEL[e.type] ?? e.type;
  return e.is_half_day ? `½ ${base}` : base;
}
function entryTone(e: WhosOutEntry): string {
  if (e.type === "LEAVE") {
    return "bg-amber-500/12 text-amber-700 dark:text-amber-400";
  }
  return "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]";
}

export function WhosOutPageClient() {
  const { user } = useAuth();
  const roles = useMemo(() => normalizeRoles(user?.roles ?? []), [user?.roles]);
  const canSeeOrg = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const isApprover =
    canSeeOrg ||
    roles.includes("ROLE_MANAGER") ||
    roles.includes("ROLE_DM");

  const searchParams = useSearchParams();
  const initialMonth = useMemo(
    () => parseMonthParam(searchParams.get("month")) ?? new Date(),
    [searchParams]
  );
  // HR/Admin land on the whole-org view; managers/DMs are always team-scoped.
  const initialScope: "team" | "org" = canSeeOrg
    ? searchParams.get("scope") === "team"
      ? "team"
      : "org"
    : "team";

  const [anchor, setAnchor] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
  );
  const [scope, setScope] = useState<"team" | "org">(initialScope);
  const [view, setView] = useState<"agenda" | "month">("agenda");
  const [data, setData] = useState<WhosOutData | null>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [visibleDays, setVisibleDays] = useState(AGENDA_PAGE_SIZE);
  const reqSeq = useRef(0);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const load = useCallback(async () => {
    if (!isApprover) {
      setData(null);
      setStatus("done");
      return;
    }
    const { from, to } = monthRange(anchor);
    const seq = ++reqSeq.current;
    setStatus("loading");
    try {
      const res = await hrmsService.getWhosOut({ from, to, scope });
      if (seq !== reqSeq.current) return;
      setData(res?.data ?? null);
      setStatus("done");
    } catch {
      if (seq !== reqSeq.current) return;
      setData(null);
      setStatus("error");
      notifyError("Couldn't load the team calendar.");
    }
  }, [anchor, scope, isApprover]);

  useEffect(() => {
    void load();
  }, [load]);

  // Collapse the agenda back to the first page whenever the month or scope
  // changes so a fresh load doesn't start half-expanded. (Not on view toggle —
  // jumping from the month grid to a specific day needs to keep its expansion.)
  useEffect(() => {
    setVisibleDays(AGENDA_PAGE_SIZE);
  }, [anchor, scope]);

  const { from: fromIso, to: toIso } = monthRange(anchor);
  const monthLabel = `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  const todayIso = iso(new Date());

  const holidaysByDay = useMemo(() => {
    const map = new Map<string, { name: string; is_optional: boolean }>();
    for (const h of data?.holidays ?? []) map.set(h.date, h);
    return map;
  }, [data]);

  const occByDay = useMemo(() => {
    const map = new Map<string, DayOccurrence[]>();
    for (const person of data?.people ?? []) {
      for (const entry of person.entries) {
        for (const day of eachDayIso(
          entry.from_date < fromIso ? fromIso : entry.from_date,
          entry.to_date > toIso ? toIso : entry.to_date
        )) {
          // Do NOT skip weekends here — a multi-day leave/WFH entry that
          // spans a Sat/Sun (or where "today" itself falls on one) must
          // still show. Dropping weekend days silently hid people from the
          // agenda and from the "out today" count whenever the check
          // happened to land on a weekend.
          const list = map.get(day) ?? [];
          list.push({ person, entry });
          map.set(day, list);
        }
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.person.name.localeCompare(b.person.name));
    }
    return map;
  }, [data, fromIso, toIso]);

  const agendaDays = useMemo(
    () =>
      eachDayIso(fromIso, toIso).filter(
        (d) => holidaysByDay.has(d) || (occByDay.get(d)?.length ?? 0) > 0
      ),
    [fromIso, toIso, holidaysByDay, occByDay]
  );

  const goMonth = (delta: number) =>
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1));

  const openDayInAgenda = useCallback(
    (day: string) => {
      setView("agenda");
      // Make sure the target day is past the "show more" cut-off before scrolling.
      const idx = agendaDays.indexOf(day);
      if (idx >= 0) {
        setVisibleDays((n) =>
          idx < n ? n : Math.min(agendaDays.length, idx + AGENDA_PAGE_SIZE)
        );
      }
      window.setTimeout(() => {
        dayRefs.current[day]?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 80);
    },
    [agendaDays]
  );

  const totalPeople = data?.people.length ?? 0;

  const outTodayCount = useMemo(
    () => (occByDay.get(todayIso) ?? []).length,
    [occByDay, todayIso]
  );

  if (!isApprover) {
    return (
      <DashboardPageShell>
        <PageSectionHeader
          title="Who's Out"
          description="Team leave and work-from-home at a glance."
        />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-wt-border px-6 py-16 text-center">
          <CalendarRange className="size-8 text-wt-text-faint" aria-hidden />
          <p className="max-w-xs text-sm text-wt-text-muted">
            This calendar is for people who approve leave. Check your own time off
            on the Leave page.
          </p>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <PageSectionHeader
        title="Who's Out"
        description={
          scope === "org"
            ? "Approved leave and work-from-home across the organisation, plus holidays."
            : "Approved leave and work-from-home across your team, plus holidays."
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[9.5rem] text-center text-sm font-semibold text-wt-text">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
          {anchor.getMonth() !== new Date().getMonth() ||
          anchor.getFullYear() !== new Date().getFullYear() ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnchor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            >
              Today
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {canSeeOrg ? (
            <div className="inline-flex rounded-lg border border-wt-border p-0.5">
              {(["team", "org"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    scope === s
                      ? "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
                      : "text-wt-text-muted hover:text-wt-text"
                  )}
                >
                  {s === "org" ? "Everyone" : "My team"}
                </button>
              ))}
            </div>
          ) : null}
          <div className="hidden rounded-lg border border-wt-border p-0.5 sm:inline-flex">
            {(["agenda", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  view === v
                    ? "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
                    : "text-wt-text-muted hover:text-wt-text"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {status === "done" ? (
        <button
          type="button"
          onClick={() => openDayInAgenda(todayIso)}
          className="group flex w-full items-center gap-3 rounded-2xl border border-wt-border bg-gradient-to-br from-wt-surface-1 to-wt-surface-2/40 px-4 py-3 text-left transition-colors hover:border-[var(--wt-brand)]/40"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
            <CalendarRange className="size-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-wt-text">
              {outTodayCount === 0
                ? scope === "org"
                  ? "Everyone's in today"
                  : "Your team is all in today"
                : `${outTodayCount} ${outTodayCount === 1 ? "person" : "people"} out today`}
            </span>
            <span className="block truncate text-xs text-wt-text-muted">
              {(occByDay.get(todayIso) ?? [])
                .map((o) => o.person.name.split(" ")[0])
                .slice(0, 6)
                .join(", ") || "Tap to jump to today"}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-wt-text-faint transition-transform group-hover:translate-x-0.5" />
        </button>
      ) : null}

      {status === "loading" && !data ? (
        <SectionLoading label="" />
      ) : status === "error" && !data ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-wt-border px-6 py-14">
          <CalendarRange className="size-8 text-wt-text-faint" aria-hidden />
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw className="mr-1.5 size-3.5" /> Try again
          </Button>
        </div>
      ) : agendaDays.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-wt-border px-6 py-16 text-center text-sm text-wt-text-muted">
          {scope === "org"
            ? `Nobody across the org has approved leave or WFH in ${monthLabel}.`
            : `Nobody on your team has approved leave or WFH in ${monthLabel}.`}
        </div>
      ) : view === "month" ? (
        <MonthGrid
          fromIso={fromIso}
          toIso={toIso}
          todayIso={todayIso}
          holidaysByDay={holidaysByDay}
          occByDay={occByDay}
          onDayClick={openDayInAgenda}
        />
      ) : (
        <div className="space-y-2.5">
          {agendaDays.slice(0, visibleDays).map((day) => {
            const d = new Date(`${day}T00:00:00`);
            const holiday = holidaysByDay.get(day);
            const occ = occByDay.get(day) ?? [];
            return (
              <div
                key={day}
                ref={(el) => {
                  dayRefs.current[day] = el;
                }}
                className="rounded-2xl border border-wt-border bg-wt-surface-1 p-3.5"
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-wt-text">
                    {WEEKDAYS[(d.getDay() + 6) % 7]} {d.getDate()} {MONTHS[d.getMonth()].slice(0, 3)}
                  </p>
                  {day === todayIso ? (
                    <span className="text-[11px] font-medium text-[var(--wt-brand)]">Today</span>
                  ) : null}
                </div>
                {holiday ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                    {holiday.name}
                    {holiday.is_optional ? (
                      <span className="text-rose-500/70">· optional</span>
                    ) : null}
                  </p>
                ) : null}
                {occ.length > 0 ? (
                  <ul className="mt-2.5 space-y-1.5">
                    {occ.map(({ person, entry }, i) => (
                      <li key={`${person.email}-${i}`} className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-wt-surface-3 text-[11px] font-semibold text-wt-text-muted">
                          {initials(person.name)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-wt-text">
                          {person.name}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            entryTone(entry)
                          )}
                        >
                          {entryLabel(entry)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}

          {agendaDays.length > visibleDays ? (
            <div className="flex justify-center pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setVisibleDays((n) => Math.min(n + AGENDA_PAGE_SIZE, agendaDays.length))
                }
              >
                Show {Math.min(AGENDA_PAGE_SIZE, agendaDays.length - visibleDays)} more
                {agendaDays.length - visibleDays === 1 ? " day" : " days"}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {status === "done" && agendaDays.length > 0 ? (
        <p className="text-center text-xs text-wt-text-faint">
          {view === "agenda" && agendaDays.length > visibleDays
            ? `Showing ${visibleDays} of ${agendaDays.length} days · `
            : null}
          {totalPeople} {totalPeople === 1 ? "person" : "people"} with time off ·{" "}
          {(data?.holidays.length ?? 0)} holiday
          {(data?.holidays.length ?? 0) === 1 ? "" : "s"} in {monthLabel}
        </p>
      ) : null}
    </DashboardPageShell>
  );
}

function MonthGrid({
  fromIso,
  toIso,
  todayIso,
  holidaysByDay,
  occByDay,
  onDayClick,
}: {
  fromIso: string;
  toIso: string;
  todayIso: string;
  holidaysByDay: Map<string, { name: string; is_optional: boolean }>;
  occByDay: Map<string, DayOccurrence[]>;
  onDayClick: (day: string) => void;
}) {
  const first = new Date(`${fromIso}T00:00:00`);
  const leadingBlanks = (first.getDay() + 6) % 7; // Mon = 0
  const days = eachDayIso(fromIso, toIso);
  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-wt-border">
      <div className="grid grid-cols-7 border-b border-wt-border bg-wt-surface-2/50 text-center text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`b-${idx}`} className="min-h-[92px] border-b border-r border-wt-border/60 bg-wt-surface-2/20" />;
          }
          const d = new Date(`${day}T00:00:00`);
          const weekend = d.getDay() === 0 || d.getDay() === 6;
          const holiday = holidaysByDay.get(day);
          const occ = occByDay.get(day) ?? [];
          return (
            <button
              key={day}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[92px] border-b border-r border-wt-border/60 p-1.5 text-left align-top transition-colors hover:bg-[var(--wt-brand-soft)]/40",
                weekend && "bg-wt-surface-2/30"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-xs",
                  day === todayIso
                    ? "bg-[var(--wt-brand)] font-semibold text-white"
                    : "text-wt-text-muted"
                )}
              >
                {d.getDate()}
              </span>
              {holiday ? (
                <p className="mt-0.5 truncate text-[10px] font-medium text-rose-600 dark:text-rose-400">
                  {holiday.name}
                </p>
              ) : null}
              <div className="mt-0.5 space-y-0.5">
                {occ.slice(0, 3).map(({ person, entry }, i) => (
                  <p
                    key={`${person.email}-${i}`}
                    className="truncate text-[10px] text-wt-text-muted"
                  >
                    <span
                      className={cn(
                        "mr-1 inline-block size-1.5 rounded-full align-middle",
                        entry.type === "LEAVE" ? "bg-amber-500" : "bg-[var(--wt-brand)]"
                      )}
                    />
                    {person.name.split(" ")[0]}
                  </p>
                ))}
                {occ.length > 3 ? (
                  <p className="text-[10px] font-medium text-wt-text-faint">
                    +{occ.length - 3} more
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
