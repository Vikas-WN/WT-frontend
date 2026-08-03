import type { DayTimelogEntry } from "@/hooks/timelog/useDayTimelog.types";
import { TimelogProjectOption } from "@/utils/timelog/categories";

export type TimelogTableProps = {
  entries: DayTimelogEntry[];
  total: number;
  page: number;
  size: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  projectOptions?: TimelogProjectOption[];
};
