export type QuickActionState = "ready" | "decided" | "expired";

export interface QuickActionRequest {
  id: number;
  type: string;
  requester: string;
  /** dd/mm/yyyy */
  from_date: string;
  to_date: string;
  is_half_day: boolean;
  reason: string | null;
  status: string;
}

export interface QuickActionPreview {
  state: QuickActionState;
  approver_name: string | null;
  request: QuickActionRequest | null;
}

export type QuickActionDecision = "APPROVED" | "REJECTED";
