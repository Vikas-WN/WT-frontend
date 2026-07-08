import type { ClientProjectSummary, ClientRecord } from "@/types/client";

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
  return {
    projectCode: readString(row, "project_code", "projectCode"),
    projectName: readString(row, "project_name", "projectName"),
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
  };
}

export function parseClientRow(row: Record<string, unknown>): ClientRecord | null {
  const id = readNumber(row, "id");
  const name = readString(row, "name");
  if (!id || !name) return null;

  const projectsRaw = row.projects;
  const projects = Array.isArray(projectsRaw)
    ? projectsRaw
        .map((item) => parseProjectSummary(item as Record<string, unknown>))
        .filter((item) => item.projectCode)
    : undefined;

  return {
    id,
    name,
    address: readNullableString(row, "address"),
    spocExternalName: readNullableString(row, "spoc_external_name", "spocExternalName"),
    spocExternalEmail: readNullableString(row, "spoc_external_email", "spocExternalEmail"),
    spocExternalPhone: readNullableString(row, "spoc_external_phone", "spocExternalPhone"),
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
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
    projectCount: readNumber(row, "project_count", "projectCount") ?? projects?.length ?? 0,
    ...(projects ? { projects } : {}),
  };
}

function parseClientItems(payload: unknown): ClientRecord[] {
  if (Array.isArray(payload)) {
    return payload
      .map((row) => parseClientRow(row as Record<string, unknown>))
      .filter((row): row is ClientRecord => Boolean(row));
  }
  if (payload && typeof payload === "object") {
    const items = (payload as Record<string, unknown>).items;
    if (Array.isArray(items)) {
      return items
        .map((row) => parseClientRow(row as Record<string, unknown>))
        .filter((row): row is ClientRecord => Boolean(row));
    }
  }
  return [];
}

export function parseClientList(data: unknown): ClientRecord[] {
  if (!data) return [];
  if (Array.isArray(data)) return parseClientItems(data);
  if (typeof data !== "object") return [];

  const envelope = data as Record<string, unknown>;
  const nested = envelope.data;
  if (nested !== undefined) {
    const fromNested = parseClientItems(nested);
    if (fromNested.length) return fromNested;
  }
  return parseClientItems(envelope);
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
    project_manager_email: client.projectManagerEmail ?? "",
    is_active: client.isActive,
  };
}
