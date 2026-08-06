import type { DayTimelogEntry } from "@/hooks/timelog/useDayTimelog.types";
import { TimelogProjectOption } from "@/utils/timelog/categories";

export type DayEntriesPanelProps = {
  selectedDate: string | null;
  entries: DayTimelogEntry[];
  totalHours: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  projectOptions?: TimelogProjectOption[];
  onAdd: () => void;
  onEdit: (entry: DayTimelogEntry) => void;
  onDelete: (entryId: number) => void;
  onSubmit: () => void;
  onClose: () => void;
};
