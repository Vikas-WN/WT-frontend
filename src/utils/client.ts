import type {
  ClientListPage,
  ClientListSummary,
  ClientProjectSummary,
  ClientRecord,
} from "@/types/client";
import { toRows } from "@/utils/apiRows";

function readString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function readNullableString(row: Record<string, unknown>, ...keys: string[]): string | null {
  const value = readString(row, ...keys);
  return value || null;
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

function parseProjectSummary(row: Record<string, unknown>): ClientProjectSummary {
  const projectName = readString(row, "project_name", "projectName", "name");
  const projectCode = readString(row, "project_code", "projectCode", "code") || projectName;
  return {
    projectCode,
    projectName: projectName || projectCode,
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
  };
}

function readId(row: Record<string, unknown>): string | number | null {
  const raw = row.id ?? row.external_id ?? row.externalId;
  if (raw === undefined || raw === null || String(raw).trim() === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const value = String(raw).trim();
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

export function parseClientRow(row: Record<string, unknown>): ClientRecord | null {
  const id = readId(row);
  const name = readString(row, "name");
  if (id == null || !name) return null;

  const projectsRaw = row.projects;
  const projects = Array.isArray(projectsRaw)
    ? projectsRaw
        .map((item) => parseProjectSummary(item as Record<string, unknown>))
        .filter((item) => item.projectCode || item.projectName)
    : undefined;

  const externalId = readNullableString(row, "external_id", "externalId") ?? (typeof id === "string" ? id : null);

  return {
    id,
    externalId,
    name,
    address: readNullableString(row, "address"),
    spocExternalName: readNullableString(
      row,
      "spoc_external_name",
      "spocExternalName",
      "contact_person",
      "contactPerson"
    ),
    spocExternalEmail: readNullableString(row, "spoc_external_email", "spocExternalEmail", "email"),
    spocExternalPhone: readNullableString(row, "spoc_external_phone", "spocExternalPhone", "phone"),
    pocInternalUserId: readNumber(row, "poc_internal_user_id", "pocInternalUserId"),
    pocInternalEmail: readNullableString(row, "poc_internal_email", "pocInternalEmail"),
    pocInternalName: readNullableString(row, "poc_internal_name", "pocInternalName"),
    accountManagerUserId: readNumber(row, "account_manager_user_id", "accountManagerUserId"),
    accountManagerEmail: readNullableString(row, "account_manager_email", "accountManagerEmail"),
    accountManagerName: readNullableString(row, "account_manager_name", "accountManagerName"),
    deliveryManagerUserId: readNumber(row, "delivery_manager_user_id", "deliveryManagerUserId"),
    deliveryManagerEmail: readNullableString(row, "delivery_manager_email", "deliveryManagerEmail"),
    deliveryManagerName: readNullableString(row, "delivery_manager_name", "deliveryManagerName"),
    projectManagerUserId: readNumber(row, "project_manager_user_id", "projectManagerUserId"),
    projectManagerEmail: readNullableString(row, "project_manager_email", "projectManagerEmail"),
    projectManagerName: readNullableString(row, "project_manager_name", "projectManagerName"),
    isActive: (() => {
      const status = readString(row, "status").toLowerCase();
      if (status === "active") return true;
      if (status === "inactive") return false;
      return Boolean(row.is_active ?? row.isActive ?? true);
    })(),
    projectCount: readNumber(row, "project_count", "projectCount") ?? projects?.length ?? 0,
    ...(projects ? { projects } : {}),
  };
}

function parseClientItems(payload: unknown): ClientRecord[] {
  return toRows(payload)
    .map((row) => parseClientRow(row))
    .filter((row): row is ClientRecord => Boolean(row));
}

function parseClientListPayload(payload: unknown): ClientRecord[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return parseClientItems(payload);
  if (typeof payload !== "object") return [];

  const obj = payload as Record<string, unknown>;
  // Prefer explicit list shapes — do not use generic toRows("projects"), which can
  // mistake a single client's projects[] for the clients list.
  if (Array.isArray(obj.items)) {
    return obj.items
      .map((row) => parseClientRow(row as Record<string, unknown>))
      .filter((row): row is ClientRecord => Boolean(row));
  }
  if (Array.isArray(obj.clients)) {
    return obj.clients
      .map((row) => parseClientRow(row as Record<string, unknown>))
      .filter((row): row is ClientRecord => Boolean(row));
  }
  return [];
}

function parseClientListSummary(raw: unknown): ClientListSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  return {
    total: readNumber(row, "total") ?? 0,
    active: readNumber(row, "active") ?? 0,
    inactive: readNumber(row, "inactive") ?? 0,
    withProjects: readNumber(row, "with_projects", "withProjects") ?? 0,
  };
}

export function parseClientList(data: unknown): ClientRecord[] {
  if (!data) return [];
  if (Array.isArray(data)) return parseClientItems(data);
  if (typeof data !== "object") return [];

  const envelope = data as Record<string, unknown>;
  const payload = (envelope.data !== undefined ? envelope.data : envelope) as unknown;
  const items = parseClientListPayload(payload);
  if (items.length) return items;
  if (Array.isArray(payload)) return parseClientItems(payload);
  return [];
}

function clientNumericId(client: ClientRecord): number | null {
  if (typeof client.id === "number" && Number.isFinite(client.id)) return client.id;
  const value = String(client.id).trim();
  if (/^\d+$/.test(value)) return Number(value);
  return null;
}

/** Merge projects from the catalog onto client rows (by numeric id or client name). */
export function attachProjectsToClients(
  clients: ClientRecord[],
  catalog: Array<{
    code: string;
    name: string;
    client_id?: number | null;
    client_name?: string | null;
    is_active?: boolean;
  }>,
): ClientRecord[] {
  if (!clients.length || !catalog.length) return clients;

  return clients.map((client) => {
    const existing = client.projects ?? [];
    const seen = new Set(
      existing.map((item) => item.projectCode.trim().toUpperCase()).filter(Boolean)
    );
    const numericId = clientNumericId(client);
    const nameKey = client.name.trim().toLowerCase();
    const extra: ClientProjectSummary[] = [];

    for (const row of catalog) {
      const idMatch = numericId != null && row.client_id != null && row.client_id === numericId;
      const catalogClientName = row.client_name?.trim().toLowerCase() ?? "";
      const nameMatch = Boolean(catalogClientName) && catalogClientName === nameKey;
      if (!idMatch && !nameMatch) continue;
      const code = row.code.trim();
      if (!code || seen.has(code.toUpperCase())) continue;
      seen.add(code.toUpperCase());
      extra.push({
        projectCode: code,
        projectName: row.name || code,
        isActive: row.is_active ?? true,
      });
    }

    const projects = extra.length ? [...existing, ...extra] : existing;
    return {
      ...client,
      projects,
      projectCount: Math.max(client.projectCount, projects.length),
    };
  });
}

export function isExternalClientId(id: string | number | null | undefined): boolean {
  if (id == null) return false;
  const value = String(id).trim();
  if (!value) return false;
  return !/^\d+$/.test(value);
}

export function parseClientListPage(data: unknown): ClientListPage {
  const empty: ClientListPage = {
    items: [],
    total: 0,
    page: 0,
    size: 0,
    totalPages: 1,
    summary: null,
  };
  if (!data || typeof data !== "object") return empty;

  const envelope = data as Record<string, unknown>;
  const payload = (envelope.data !== undefined ? envelope.data : envelope) as unknown;
  if (!payload || typeof payload !== "object") {
    const items = parseClientList(data);
    return {
      ...empty,
      items,
      total: items.length,
      size: items.length,
      totalPages: items.length ? 1 : 0,
    };
  }

  const obj = payload as Record<string, unknown>;
  const items = parseClientListPayload(payload);
  const total = readNumber(obj, "total") ?? items.length;
  const page = readNumber(obj, "page") ?? 0;
  const size = readNumber(obj, "size") ?? items.length;
  const totalPages =
    readNumber(obj, "total_pages", "totalPages") ??
    (total === 0 ? 0 : Math.max(1, Math.ceil(total / Math.max(size || 1, 1))));

  return {
    items,
    total,
    page,
    size,
    totalPages,
    summary: parseClientListSummary(obj.summary),
  };
}

export function clientToFormState(client: ClientRecord) {
  return {
    name: client.name,
    address: client.address ?? "",
    spoc_external_name: client.spocExternalName ?? "",
    spoc_external_email: client.spocExternalEmail ?? "",
    spoc_external_phone: client.spocExternalPhone ?? "",
    poc_internal_email: client.pocInternalEmail ?? "",
    account_manager_email: client.accountManagerEmail ?? "",
    delivery_manager_email: client.deliveryManagerEmail ?? "",
    is_active: client.isActive,
  };
}
