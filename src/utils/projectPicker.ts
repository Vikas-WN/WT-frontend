import {
  GENERAL_PROJECT_CODE,
  INTERNAL_PROJECT_CODE,
} from "@/utils/timelog/categories";

const SYSTEM_PROJECT_CODES = new Set([GENERAL_PROJECT_CODE, INTERNAL_PROJECT_CODE]);

/** True for HR-created allocation projects (excludes timelog system projects). */
export function isHrCreatedProjectCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return Boolean(normalized) && !SYSTEM_PROJECT_CODES.has(normalized);
}

export type ProjectPickerRow = {
  code: string;
  name: string;
  project_type: string;
  id?: number;
  client_id?: number | null;
};

/** Normalize GET /projects/all (or paginated /projects) rows for pickers. */
export function parseProjectPickerRows(
  rows: Array<Record<string, unknown>>
): ProjectPickerRow[] {
  const mapped: Array<[string, ProjectPickerRow]> = [];

  for (const row of rows) {
    const code = String(row.project_code ?? row.projectCode ?? "").trim();
    const name = String(row.project_name ?? row.projectName ?? code).trim();
    if (!code) continue;

    const project_type = String(row.project_type ?? row.projectType ?? "").trim();
    const idRaw = row.id ?? row.project_id ?? row.projectId;
    const idNum = idRaw !== undefined && idRaw !== null && idRaw !== "" ? Number(idRaw) : NaN;
    const clientRaw = row.client_id ?? row.clientId;
    const clientNum =
      clientRaw !== undefined && clientRaw !== null && clientRaw !== ""
        ? Number(clientRaw)
        : NaN;

    mapped.push([
      code,
      {
        code,
        name,
        project_type,
        ...(Number.isFinite(idNum) ? { id: idNum } : {}),
        client_id: Number.isFinite(clientNum) ? clientNum : null,
      },
    ]);
  }

  return Array.from(new Map(mapped).values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
