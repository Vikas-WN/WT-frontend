import { hrmsService } from "@/services/hrms.service";
import { fetchAllocationUserDirectory } from "@/utils/allocation/allocationUserDirectory";
import { cleanEmployeeName, rowEmail, rowEmpId } from "@/utils/employeeDirectory";
import { formatEmployeePickerLabel } from "@/utils/employeePickerLabel";
import { pickManagerEmailList } from "@/utils/leaveManagerDisplay";

export type DirectoryPerson = {
  empId: string;
  name: string;
  email: string;
};

function requestRowEmail(row: Record<string, unknown>): string {
  return String(
    row.emp_email ??
      row.empEmail ??
      row.email ??
      row.user_email ??
      row.userEmail ??
      row.employee_email ??
      row.employeeEmail ??
      row.requested_by ??
      row.requestedBy ??
      ""
  )
    .trim()
    .toLowerCase();
}

export function buildDirectoryPersonMap(
  rows: Array<Record<string, unknown>>
): Record<string, DirectoryPerson> {
  const map: Record<string, DirectoryPerson> = {};
  for (const row of rows) {
    const email = rowEmail(row).toLowerCase();
    if (!email) continue;
    map[email] = {
      empId: rowEmpId(row),
      name: cleanEmployeeName(row),
      email,
    };
  }
  return map;
}

export function directoryPersonLabel(person: DirectoryPerson): string {
  return formatEmployeePickerLabel({
    employeeName: person.name,
    employeeEmail: person.email,
    empId: person.empId || undefined,
  });
}

export function labelForDirectoryEmail(
  email: string,
  personByEmail: Record<string, DirectoryPerson>
): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return "—";
  const person = personByEmail[normalized];
  return person ? directoryPersonLabel(person) : email.trim();
}

async function resolveMissingPeople(
  emails: string[],
  personByEmail: Record<string, DirectoryPerson>
): Promise<void> {
  const unresolved = [
    ...new Set(
      emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => Boolean(email) && !personByEmail[email])
    ),
  ];
  if (!unresolved.length) return;

  await Promise.all(
    unresolved.map(async (email) => {
      try {
        const userRes = await hrmsService.getUser({ email });
        const payload = ((userRes as { data?: unknown }).data ?? userRes) as
          | Record<string, unknown>
          | null;
        if (!payload || typeof payload !== "object") return;
        const nested =
          (payload.user as Record<string, unknown> | undefined) ??
          (payload.profile as Record<string, unknown> | undefined);
        const name = String(
          payload.name ??
            nested?.name ??
            payload.employee_name ??
            payload.employeeName ??
            ""
        ).trim();
        const empId = String(
          payload.emp_id ??
            payload.empId ??
            nested?.emp_id ??
            nested?.empId ??
            ""
        ).trim();
        if (!name && !empId) return;
        personByEmail[email] = {
          empId,
          name: name || email,
          email,
        };
      } catch {
        /* lookup miss */
      }
    })
  );
}

/** Enrich WFH request rows with employee + primary manager directory labels. */
export async function enrichWfhRequestRows(
  rows: Array<Record<string, unknown>>
): Promise<Array<Record<string, unknown>>> {
  let directoryRows: Array<Record<string, unknown>> = [];
  try {
    const directory = await fetchAllocationUserDirectory();
    directoryRows = directory.rows;
  } catch {
    directoryRows = [];
  }

  const personByEmail = buildDirectoryPersonMap(directoryRows);

  const emailsToResolve = rows.flatMap((row) => [
    requestRowEmail(row),
    ...pickManagerEmailList(row, "primary"),
  ]);
  await resolveMissingPeople(emailsToResolve, personByEmail);

  return rows.map((row) => {
    const email = requestRowEmail(row);
    const nameFromRow = String(
      row.name ?? row.employee_name ?? row.employeeName ?? row.employee_display ?? ""
    ).trim();
    const person = email ? personByEmail[email] : undefined;
    const employee_display =
      (person ? directoryPersonLabel(person) : "") ||
      nameFromRow ||
      email ||
      "—";

    const employee_name = person?.name || nameFromRow || email || "—";
    const employee_emp_id = person?.empId || String(row.emp_id ?? row.empId ?? "").trim() || "";

    const primaryManagers = pickManagerEmailList(row, "primary");
    const primary_manager_labels = primaryManagers.map((managerEmail) =>
      labelForDirectoryEmail(managerEmail, personByEmail)
    );

    return { ...row, employee_display, employee_name, employee_emp_id, primary_manager_labels };
  });
}
