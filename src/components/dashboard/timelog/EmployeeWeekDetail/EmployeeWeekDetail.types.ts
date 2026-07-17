import type { TimelogGridRow } from "@/utils/timelog/gridState";

export type EmployeeWeekDetailProps = {
  employeeEmail: string;
  weekStart: Date | null;
  dayKeys: string[];
  dayDates: Date[];
  gridRows: TimelogGridRow[];
  loading: boolean;
  error?: string | null;
  actionLoading: boolean;
  onBack: () => void;
  onWeekChange: (ws: Date | null) => void;
  onRefresh: () => void;
  onApprove: (row: TimelogGridRow, remark: string) => void;
  onReject: (row: TimelogGridRow, remark: string) => void;
};
