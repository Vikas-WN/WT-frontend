export type AssetStatus = "AVAILABLE" | "ASSIGNED" | "IN_REPAIR" | "RETIRED" | "LOST";

export interface AssetHolder {
  emp_id: string | null;
  name: string;
  email: string;
}

export interface AssetItem {
  id: number;
  asset_tag: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  status: AssetStatus;
  notes: string | null;
  holder: AssetHolder | null;
  created_at: string;
  updated_at: string;
}

export interface AssetCreatePayload {
  asset_tag: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  purchase_date?: string | null;
  notes?: string | null;
}

export interface AssetUpdatePayload {
  category?: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  purchase_date?: string | null;
  status?: "AVAILABLE" | "IN_REPAIR" | "RETIRED" | "LOST";
  notes?: string | null;
}

export interface AssetAssignPayload {
  emp_id: string;
  condition?: string | null;
  notes?: string | null;
}

export interface AssetReturnPayload {
  condition?: string | null;
  notes?: string | null;
  next_status?: "AVAILABLE" | "IN_REPAIR" | "RETIRED" | "LOST";
}

export interface AssetAssignmentHistoryItem {
  id: number;
  emp_id: string | null;
  name: string;
  email: string;
  assigned_at: string;
  returned_at: string | null;
  assigned_by_email: string;
  returned_by_email: string | null;
  condition_on_assign: string | null;
  condition_on_return: string | null;
  notes: string | null;
}

export interface PaginatedAssets {
  data: AssetItem[];
  current_page: number;
  page_size: number;
  total_element: number;
  total_page: number;
}

export interface AssetRosterEmployee {
  emp_id: string;
  name: string;
  email: string;
  department: string | null;
}
