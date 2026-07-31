import type { OpportunityListResult, OpportunityRecord } from "@/types/opportunity";

function readString(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return null;
}

function readNumber(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const raw = row[key];
    if (raw === undefined || raw === null || raw === "") continue;
    const num = Number(raw);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

export function parseOpportunityRow(row: Record<string, unknown>): OpportunityRecord | null {
  const idRaw = row.id ?? row.external_id ?? row.externalId;
  const id =
    idRaw !== undefined && idRaw !== null && String(idRaw).trim() !== ""
      ? String(idRaw).trim()
      : null;
  const opportunityName = readString(row, "opportunity_name", "opportunityName", "name");
  if (!id || !opportunityName) return null;

  const clientRaw = row.client;
  let clientId: string | null = null;
  let clientName: string | null = null;
  if (clientRaw && typeof clientRaw === "object") {
    const clientObj = clientRaw as Record<string, unknown>;
    clientId = readString(clientObj, "id");
    clientName = readString(clientObj, "name");
  }

  return {
    id,
    oppId: readString(row, "opp_id", "oppId"),
    opportunityName,
    clientId,
    clientName,
    currentStatus: readString(row, "current_status", "currentStatus", "status"),
    businessType: readString(row, "business_type", "businessType"),
    billingType: readString(row, "billing_type", "billingType"),
    techType: readString(row, "tech_type", "techType"),
    contractType: readString(row, "contract_type", "contractType"),
    domain: readString(row, "domain"),
    location: readString(row, "location"),
    probabilityPercent: readNumber(row, "probability_percent", "probabilityPercent"),
    pursuitStartDate: readString(row, "pursuit_start_date", "pursuitStartDate"),
    pursuitCloseDate: readString(row, "pursuit_close_date", "pursuitCloseDate"),
    projectStartDate: readString(row, "project_start_date", "projectStartDate"),
    projectEndDate: readString(row, "project_end_date", "projectEndDate"),
    description: readString(row, "description"),
  };
}

export function parseOpportunityList(data: unknown): OpportunityListResult {
  if (!data || typeof data !== "object") {
    return { items: [], total: 0 };
  }

  const envelope = data as Record<string, unknown>;
  const payload = (envelope.data !== undefined ? envelope.data : envelope) as unknown;
  if (!payload || typeof payload !== "object") {
    return { items: [], total: 0 };
  }

  const obj = payload as Record<string, unknown>;
  const rows = Array.isArray(obj.items)
    ? obj.items
    : Array.isArray(payload)
      ? payload
      : [];

  const items = rows
    .map((row) => parseOpportunityRow(row as Record<string, unknown>))
    .filter((row): row is OpportunityRecord => Boolean(row));

  const total = Number(obj.total);
  return {
    items,
    total: Number.isFinite(total) && total >= 0 ? total : items.length,
  };
}

export function formatOpportunityLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
