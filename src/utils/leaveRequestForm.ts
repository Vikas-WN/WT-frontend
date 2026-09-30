import { todayApiDate } from "@/utils/apiDate";
import type { LeaveRequestFormState } from "@/types/leaveRequestForm";

export function createDefaultLeaveRequestForm(): LeaveRequestFormState {
  const today = todayApiDate();
  return {
    request_from_date: today,
    request_to_date: today,
    request_type: "LEAVE",
    comments: "",
    is_half_day: false,
    client_approval: false,
  };
}
