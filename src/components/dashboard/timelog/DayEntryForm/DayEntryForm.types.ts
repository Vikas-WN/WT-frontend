import type { DayTimelogEntry, DayTimelogEntryForm } from "@/hooks/timelog/useDayTimelog.types";
import type { TimelogProjectOption } from "@/utils/timelog/categories";

export type DayEntryFormProps = {
  entry: DayTimelogEntry | null;
  projectOptions: TimelogProjectOption[];
  actionLoading: boolean;
  dayTotalHours: number;
  selectedDate: string;
  /** Change the date this entry is logged against (new entries only) — keeps
   * the parent's day-scoped state (entries/total-hours for validation) in
   * sync with whatever date the employee picks. */
  onDateChange: (date: string) => void;
  onSave: (form: DayTimelogEntryForm) => void;
  onSaveAndSubmit: (form: DayTimelogEntryForm) => void;
  onUpdate: (entryId: number, form: DayTimelogEntryForm) => void;
  onCancel: () => void;
};
