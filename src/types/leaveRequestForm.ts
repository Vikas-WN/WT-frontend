/** The shared draft behind the Leave and WFH request forms (dates are dd/mm/yyyy). */
export interface LeaveRequestFormState {
  request_from_date: string;
  request_to_date: string;
  request_type: string;
  comments: string;
  is_half_day: boolean;
  client_approval: boolean;
}

/** A yes/no prompt the Leave page shows before running a destructive action. */
export interface LeaveConfirmState {
  title: string;
  description?: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  run: () => Promise<unknown> | void;
}
