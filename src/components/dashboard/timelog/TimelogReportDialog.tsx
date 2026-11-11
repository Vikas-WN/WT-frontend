"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelectField } from "@/components/dashboard/ui/forms";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { MultiCheckList, type CheckListItem } from "@/components/dashboard/timelog/MultiCheckList";
import { TIMELOG_REPORT_COPY as COPY } from "@/constants/timelogReport";
import { useTimelogReportOptions } from "@/hooks/timelog/useTimelogReportOptions";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { hrmsService } from "@/services/hrms.service";
import type { TimelogReportStatus } from "@/types/timelogReport";
import { downloadBlob } from "@/utils/downloadBlob";
import type { MonthRef } from "@/utils/timelog/monthWeeks";

const ALL = "";

function monthName(index: number): string {
  return new Date(2000, index, 1).toLocaleString(undefined, { month: "long" });
}

/**
 * Choose what goes into the monthly timelog PDF, then download it. The server limits every list to what this person
 * may see (HR/Admin: everything; a manager: the projects they run), so the filters here can only narrow.
 */
export function TimelogReportDialog({
  open,
  initialMonth,
  onClose,
}: {
  open: boolean;
  initialMonth: MonthRef;
  onClose: () => void;
}) {
  const { options, loading, error, reload } = useTimelogReportOptions(open);
  const now = new Date();
  const [year, setYear] = useState(initialMonth.year);
  const [month, setMonth] = useState(initialMonth.month); // 0-based, like MonthRef
  const [projects, setProjects] = useState<Set<string>>(new Set());
  const [manager, setManager] = useState(ALL);
  const [people, setPeople] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<TimelogReportStatus>>(new Set(["SUBMITTED", "APPROVED", "REJECTED"]));
  const [includeEntries, setIncludeEntries] = useState(true);
  const [busy, setBusy] = useState(false);

  const thisYear = now.getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => thisYear - i);
  const lastMonth = year === thisYear ? now.getMonth() : 11;

  // Projects narrowed by the chosen manager; people narrowed by the projects in play.
  const visibleProjects = useMemo(
    () => (options?.projects ?? []).filter((p) => !manager || p.managers.includes(manager)),
    [options, manager]
  );
  const projectsInPlay = useMemo(
    () => (projects.size ? visibleProjects.filter((p) => projects.has(p.code)) : visibleProjects),
    [visibleProjects, projects]
  );
  const visiblePeople = useMemo(() => {
    const emails = new Set(projectsInPlay.flatMap((p) => p.people));
    return (options?.people ?? []).filter((p) => emails.has(p.email));
  }, [options, projectsInPlay]);

  const projectItems: CheckListItem[] = visibleProjects.map((p) => ({ value: p.code, label: p.name, hint: p.code }));
  const peopleItems: CheckListItem[] = visiblePeople.map((p) => ({ value: p.email, label: p.name, hint: p.emp_id || undefined }));

  const changeProjects = (next: Set<string>) => {
    setProjects(next);
    // Drop people who are no longer on any selected project.
    const keep = new Set(
      (options?.projects ?? []).filter((p) => !manager || p.managers.includes(manager)).filter((p) => !next.size || next.has(p.code)).flatMap((p) => p.people)
    );
    setPeople((prev) => new Set([...prev].filter((email) => keep.has(email))));
  };
  const changeManager = (next: string) => {
    setManager(next);
    setProjects(new Set());
    setPeople(new Set());
  };
  const toggleStatus = (value: TimelogReportStatus) =>
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const noStatus = statuses.size === 0;
  const nothingToExport = !!options && options.projects.length === 0;
  const canGenerate = !busy && !!options && !nothingToExport && !noStatus;

  const generate = async () => {
    setBusy(true);
    try {
      // Everything ticked is the same as nothing ticked ("all in scope"), and sending the full list would only bloat the URL.
      const everyProject = visibleProjects.length > 0 && visibleProjects.every((p) => projects.has(p.code));
      const everyPerson = visiblePeople.length > 0 && visiblePeople.every((p) => people.has(p.email));
      const blob = await hrmsService.downloadMonthlyTimelogPdf({
        year,
        month: month + 1,
        projects: everyProject ? [] : [...projects],
        managers: manager ? [manager] : [],
        people: everyPerson ? [] : [...people],
        statuses: [...statuses],
        includeEntries,
      });
      const single = !everyProject && projects.size === 1 ? `_${[...projects][0]}` : "";
      downloadBlob(blob, `Timelogs_${year}-${String(month + 1).padStart(2, "0")}${single}.pdf`);
      showSuccessToast(COPY.done);
      onClose();
    } catch {
      showErrorToast(COPY.failed);
    } finally {
      setBusy(false);
    }
  };

  const summary = options
    ? `${projectsInPlay.length} ${projectsInPlay.length === 1 ? "project" : "projects"} · ${people.size || visiblePeople.length} ${
        (people.size || visiblePeople.length) === 1 ? "person" : "people"
      }`
    : "";

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="wt-modal-overlay fixed inset-0 z-[200] bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-[201] flex max-h-[calc(100dvh-32px)] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 text-wt-text shadow-[var(--wt-shadow-lg)] outline-none">
          <header className="flex items-start justify-between gap-4 border-b border-wt-border px-6 py-5">
            <div>
              <Dialog.Title className="font-[family-name:var(--font-brand)] text-xl font-semibold tracking-tight">{COPY.title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-wt-text-muted">{COPY.description}</Dialog.Description>
            </div>
            <Dialog.Close className="grid size-8 shrink-0 place-items-center rounded-lg text-wt-text-muted hover:bg-wt-surface-2" aria-label="Close" disabled={busy}>
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </header>

          <div className="space-y-5 overflow-y-auto px-6 py-5">
            {loading ? (
              <SectionLoading className="py-10" label="Loading filters…" />
            ) : error || !options ? (
              <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
                <p>{error ?? COPY.loadFailed}</p>
                <Button variant="outline" size="sm" onClick={reload}>{COPY.retry}</Button>
              </div>
            ) : nothingToExport ? (
              <p className="py-6 text-center text-sm text-wt-text-muted">{COPY.noScope}</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NativeSelectField label={COPY.month} value={String(Math.min(month, lastMonth))} onChange={(v) => setMonth(Number(v))}>
                    {Array.from({ length: lastMonth + 1 }, (_, i) => <option key={i} value={String(i)}>{monthName(i)}</option>)}
                  </NativeSelectField>
                  <NativeSelectField
                    label={COPY.year}
                    value={String(year)}
                    onChange={(v) => {
                      const nextYear = Number(v);
                      setYear(nextYear);
                      if (nextYear === now.getFullYear()) setMonth((m) => Math.min(m, now.getMonth()));
                    }}
                  >
                    {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                  </NativeSelectField>
                </div>

                {options.can_filter_by_manager ? (
                  <NativeSelectField label={COPY.manager} value={manager} onChange={changeManager} placeholder={COPY.managerAll}>
                    <option value={ALL}>{COPY.managerAll}</option>
                    {options.managers.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
                  </NativeSelectField>
                ) : null}

                <MultiCheckList
                  legend={COPY.projects}
                  items={projectItems}
                  selected={projects}
                  onChange={changeProjects}
                  allLabel={COPY.projectsAll}
                  searchLabel={COPY.projectsSearch}
                  emptyLabel={COPY.projectsEmpty}
                />
                <MultiCheckList
                  legend={COPY.people}
                  items={peopleItems}
                  selected={people}
                  onChange={setPeople}
                  allLabel={COPY.peopleAll}
                  searchLabel={COPY.peopleSearch}
                  emptyLabel={COPY.peopleEmpty}
                />

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">{COPY.status}</legend>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {options.statuses.map((s) => (
                      <label key={s.value} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox checked={statuses.has(s.value)} onCheckedChange={() => toggleStatus(s.value)} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                  {noStatus ? <p className="text-xs text-rose-600" role="alert">{COPY.statusNeedOne}</p> : null}
                </fieldset>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-wt-border p-3 text-sm">
                  <Checkbox className="mt-0.5" checked={includeEntries} onCheckedChange={(c) => setIncludeEntries(c === true)} />
                  <span>
                    <span className="font-medium">{COPY.includeEntries}</span>
                    <span className="block text-xs text-wt-text-muted">{COPY.includeEntriesHint}</span>
                  </span>
                </label>
              </>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-wt-border bg-wt-surface-2 px-6 py-4">
            <span className="text-xs text-wt-text-muted" aria-live="polite">{summary}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={busy}>{COPY.cancel}</Button>
              <Button variant="brand" onClick={() => void generate()} disabled={!canGenerate}>
                <Download className="size-4" aria-hidden />
                {busy ? COPY.generating : COPY.generate}
              </Button>
            </div>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
