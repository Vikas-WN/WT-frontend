"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import { ApiError } from "@/api/error";
import { showSuccessToast } from "@/lib/toast";
import { formatApiDate, parseTimelogDate, toIsoDateKey } from "@/utils/timelog/weekDates";
import {
  projectOptionsFromPayload,
  normalizeTimelogOptionsPayload,
  type TimelogOptionsPayload,
} from "@/utils/timelog/categories";
import type {
  DayTimelogEntry,
  DayTimelogEntryForm,
  CalendarMonth,
  CalendarDayInfo,
} from "./useDayTimelog.types";
import { buildTimelogEntryPayload, primaryManagerEmailsFromEntries } from "@/utils/timelog/entryManager";
import { validateTimelogHours } from "@/utils/timelog/hoursValidation";
import { isEmployeeTimelogEditable } from "@/utils/timelog/employeeEditability";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type ApiTimelogList = { items: DayTimelogEntry[]; total: number };

function parseApiEnvelope<T>(response: unknown): T {
  return ((response as { data?: T }).data ?? response) as T;
}

function isDraftEntry(entry: DayTimelogEntry): boolean {
  return String(entry.status ?? "").toUpperCase() === "DRAFT";
}

/** Drafts are excluded from logged hours/entry counts and reported separately. */
function summarizeDayEntries(dayEntries: DayTimelogEntry[]): {
  totalHours: number;
  entryCount: number;
  draftCount: number;
} {
  const submitted = dayEntries.filter((e) => !isDraftEntry(e));
  return {
    totalHours: submitted.reduce((s, e) => s + e.hours, 0),
    entryCount: submitted.length,
    draftCount: dayEntries.length - submitted.length,
  };
}

function buildCalendarMonth(
  year: number,
  month: number,
  entriesByDate: Record<string, DayTimelogEntry[]>,
): CalendarMonth {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayKey = formatApiDate(today);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days: CalendarDayInfo[] = [];

  const pushDay = (d: Date, isCurrentMonth: boolean) => {
    const dateKey = formatApiDate(d);
    const dayEntries = entriesByDate[dateKey] ?? [];
    days.push({
      date: d,
      dateKey,
      day: d.getDate(),
      isCurrentMonth,
      isToday: dateKey === todayKey,
      isFuture: d > todayStart,
      ...summarizeDayEntries(dayEntries),
    });
  };

  for (let i = 0; i < startPad; i++) {
    pushDay(new Date(year, month, i - startPad + 1), false);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    pushDay(new Date(year, month, i), true);
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    pushDay(new Date(year, month + 1, i), false);
  }

  return { year, month, days };
}

export { DAYS_OF_WEEK, MONTHS, buildCalendarMonth };

export function useDayTimelog() {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatApiDate(today), [today]);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DayTimelogEntry | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const TABLE_PAGE_SIZE = 20;
  const queryClient = useQueryClient();

  const monthStart = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    const start = new Date(d);
    start.setDate(start.getDate() - start.getDay());
    return start;
  }, [viewYear, viewMonth]);

  const monthEnd = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    const end = new Date(viewYear, viewMonth + 1, 0);
    const remaining = 42 - (end.getDate() + d.getDay() - 1);
    end.setDate(end.getDate() + Math.max(0, remaining));
    return end;
  }, [viewYear, viewMonth]);

  const optionsQuery = useQuery({
    queryKey: ["timelog-options"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await hrmsService.getTimelogOptions();
      return normalizeTimelogOptionsPayload(res);
    },
  });

  const logsQuery = useQuery({
    queryKey: ["day-timelog-logs", formatApiDate(monthStart), formatApiDate(monthEnd)],
    staleTime: 30 * 1000,
    queryFn: async () => {
      const res = await hrmsService.getTimelogs({ page: "0", size: "200" });
      const raw = parseApiEnvelope<ApiTimelogList>(res);
      const allItems = raw.items ?? [];
      const ms = monthStart.getTime();
      const me = monthEnd.getTime();
      return allItems.filter((item) => {
        const itemDate = parseTimelogDate(item.log_date);
        return itemDate && itemDate.getTime() >= ms && itemDate.getTime() <= me;
      });
    },
  });

  const dayLogsQuery = useQuery({
    queryKey: ["day-timelog-day", selectedDate],
    staleTime: 15 * 1000,
    enabled: !!selectedDate,
    queryFn: async () => {
      if (!selectedDate) return [];
      const res = await hrmsService.getTimelogs({
        logDate: selectedDate,
        page: "0",
        size: "200",
      });
      const raw = parseApiEnvelope<ApiTimelogList>(res);
      return raw.items ?? [];
    },
  });

  const tableLogsQuery = useQuery({
    queryKey: ["timelog-table", tablePage],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const res = await hrmsService.getTimelogs({
        page: String(tablePage),
        size: String(TABLE_PAGE_SIZE),
      });
      return parseApiEnvelope<ApiTimelogList>(res);
    },
  });

  const tableEntries = tableLogsQuery.data?.items ?? [];
  const tableTotal = tableLogsQuery.data?.total ?? 0;

  const allEntries = logsQuery.data ?? [];
  const entriesByDate = useMemo(() => {
    const map: Record<string, DayTimelogEntry[]> = {};
    for (const entry of allEntries) {
      const key = toIsoDateKey(entry.log_date);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    return map;
  }, [allEntries]);

  const calendar = useMemo(
    () => buildCalendarMonth(viewYear, viewMonth, entriesByDate),
    [viewYear, viewMonth, entriesByDate],
  );

  const selectedDayEntries = dayLogsQuery.data ?? [];
  const selectedDateTotal = useMemo(
    () => selectedDayEntries.reduce((s, e) => s + e.hours, 0),
    [selectedDayEntries],
  );

  const projectOptions = useMemo(
    () => projectOptionsFromPayload(optionsQuery.data ?? null),
    [optionsQuery.data],
  );

  const navigateMonth = useCallback(
    (delta: number) => {
      const now = new Date();
      let newMonth = viewMonth + delta;
      let newYear = viewYear;
      if (newMonth < 0) {
        newYear -= 1;
        newMonth = 11;
      } else if (newMonth > 11) {
        newYear += 1;
        newMonth = 0;
      }
      if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth > now.getMonth())) return;
      setViewYear(newYear);
      setViewMonth(newMonth);
    },
    [viewMonth, viewYear],
  );

  const goToToday = useCallback(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(formatApiDate(now));
  }, []);

  const selectDate = useCallback((dateKey: string) => {
    setSelectedDate(dateKey);
    setShowEntryForm(false);
    setEditingEntry(null);
  }, []);

  const goToMonth = useCallback((year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  }, []);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>) => {
      setActionLoading(true);
      try {
        await fn();
      } catch (error) {
        const msg =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "An error occurred";
        throw new Error(msg);
      } finally {
        setActionLoading(false);
      }
    },
    [],
  );

  const [actionError, setActionError] = useState<string | null>(null);

  const handleAction = useCallback(
    async (fn: () => Promise<unknown>) => {
      setActionError(null);
      try {
        await runAction(fn);
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "An error occurred";
        setActionError(msg);
      }
    },
    [runAction],
  );

  const saveAndSubmitEntry = useCallback(
    (form: DayTimelogEntryForm) =>
      handleAction(async () => {
        if (!selectedDate) return;
        const hoursError = validateTimelogHours(form.hours);
        if (hoursError) throw new Error(hoursError);
        const hours = Number(form.hours);
        const entryPayload = buildTimelogEntryPayload(form, selectedDate, hours);
        if (!entryPayload.primaryManagerEmails?.length) {
          throw new Error("Select a project manager before submitting.");
        }
        if (editingEntry) {
          if (!isEmployeeTimelogEditable(editingEntry.status)) {
            throw new Error("Rejected or finalized timelog entries cannot be edited.");
          }
          await hrmsService.updateTimelogEntry(editingEntry.id, entryPayload);
        } else {
          await hrmsService.createTimelogDraft({
            ...entryPayload,
            task_category: form.task_category || undefined,
          });
        }
        await hrmsService.submitTimelogDate({
          log_date: selectedDate,
          date: selectedDate,
          primaryManagerEmails: entryPayload.primaryManagerEmails,
          primary_manager_emails: entryPayload.primary_manager_emails,
        });
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-logs"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-day"],
        });
        setShowEntryForm(false);
        setEditingEntry(null);
        showSuccessToast("Entry submitted for approval.");
      }),
    [selectedDate, handleAction, queryClient, editingEntry]
  );

  const addEntry = useCallback(
    (form: DayTimelogEntryForm) =>
      handleAction(async () => {
        if (!selectedDate) return;
        const hoursError = validateTimelogHours(form.hours);
        if (hoursError) throw new Error(hoursError);
        const hours = Number(form.hours);
        await hrmsService.createTimelogDraft({
          ...buildTimelogEntryPayload(form, selectedDate, hours),
          task_category: form.task_category || undefined,
        });
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-logs"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-day"],
        });
        setShowEntryForm(false);
        setEditingEntry(null);
        showSuccessToast("Draft saved.");
      }),
    [selectedDate, handleAction, queryClient],
  );

  const updateEntry = useCallback(
    (entryId: number, form: DayTimelogEntryForm) =>
      handleAction(async () => {
        const existing = selectedDayEntries.find((entry) => entry.id === entryId);
        if (existing && !isEmployeeTimelogEditable(existing.status)) {
          throw new Error("Rejected or finalized timelog entries cannot be edited.");
        }
        const hoursError = validateTimelogHours(form.hours);
        if (hoursError) throw new Error(hoursError);
        const hours = Number(form.hours);
        if (!selectedDate) return;
        await hrmsService.updateTimelogEntry(
          entryId,
          buildTimelogEntryPayload(form, selectedDate, hours)
        );
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-logs"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-day"],
        });
        setShowEntryForm(false);
        setEditingEntry(null);
        showSuccessToast("Entry updated.");
      }),
    [selectedDate, selectedDayEntries, handleAction, queryClient],
  );

  const deleteEntry = useCallback(
    (entryId: number) =>
      handleAction(async () => {
        const existing = selectedDayEntries.find((entry) => entry.id === entryId);
        if (existing && !isEmployeeTimelogEditable(existing.status)) {
          throw new Error("Rejected or finalized timelog entries cannot be deleted.");
        }
        await hrmsService.deleteTimelogEntry(entryId);
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-logs"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-day"],
        });
        showSuccessToast("Entry deleted.");
      }),
    [selectedDayEntries, handleAction, queryClient],
  );

  const submitDay = useCallback(
    () =>
      handleAction(async () => {
        if (!selectedDate) return;
        const managers = primaryManagerEmailsFromEntries(selectedDayEntries);
        if (!managers.length) {
          throw new Error(
            "Each entry needs a project manager before submit. Edit drafts to select a manager."
          );
        }
        await hrmsService.submitTimelogDate({
          log_date: selectedDate,
          date: selectedDate,
          primaryManagerEmails: managers,
          primary_manager_emails: managers,
        });
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-logs"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["day-timelog-day"],
        });
        showSuccessToast("Entries submitted for approval.");
      }),
    [selectedDate, selectedDayEntries, handleAction, queryClient]
  );

  const openAddForm = useCallback(() => {
    setEditingEntry(null);
    setShowEntryForm(true);
  }, []);

  const openEditForm = useCallback((entry: DayTimelogEntry) => {
    if (!isEmployeeTimelogEditable(entry.status)) {
      return;
    }
    setEditingEntry(entry);
    setShowEntryForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowEntryForm(false);
    setEditingEntry(null);
  }, []);

  const onTablePageChange = useCallback((newPage: number) => {
    setTablePage(newPage);
  }, []);

  const closePanel = useCallback(() => {
    setSelectedDate(null);
    setShowEntryForm(false);
    setEditingEntry(null);
  }, []);

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["day-timelog-logs"] });
    queryClient.invalidateQueries({ queryKey: ["day-timelog-day"] });
    queryClient.invalidateQueries({ queryKey: ["timelog-table"] });
    queryClient.invalidateQueries({ queryKey: ["timelog-options"] });
  }, [queryClient]);

  return {
    viewYear,
    viewMonth,
    calendar,
    selectedDate,
    selectedDayEntries,
    selectedDateTotal,
    projectOptions,
    reload,
    loading:
      (logsQuery.isFetching && !logsQuery.isPaused) ||
      (dayLogsQuery.isFetching && !dayLogsQuery.isPaused),
    error:
      logsQuery.error || dayLogsQuery.error
        ? "Unable to load timelog data"
        : actionError,
    actionLoading,
    editingEntry,
    showEntryForm,
    navigateMonth,
    goToToday,
    goToMonth,
    selectDate,
    tableEntries,
    tableTotal,
    tablePage,
    tablePageSize: TABLE_PAGE_SIZE,
    tableLoading: tableLogsQuery.isFetching && !tableLogsQuery.isPaused,
    onTablePageChange,
    addEntry,
    saveAndSubmitEntry,
    updateEntry,
    deleteEntry,
    submitDay,
    openAddForm,
    openEditForm,
    closeForm,
    closePanel,
  };
}
