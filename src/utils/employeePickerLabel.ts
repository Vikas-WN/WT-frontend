export function formatEmployeePickerLabel(employee: {
  employeeName: string;
  employeeEmail: string;
  empId?: string;
}): string {
  const name = employee.employeeName.trim();
  const email = employee.employeeEmail.trim();
  // Employee IDs and emails must not appear in dropdown labels.
  void employee.empId;
  return name || email || "—";
}

/** Email (or other detail) for hover/tooltip — not shown in the dropdown label. */
export function formatEmployeePickerTitle(employee: {
  employeeName: string;
  employeeEmail: string;
}): string | undefined {
  const name = employee.employeeName.trim();
  const email = employee.employeeEmail.trim();
  if (email && name && name !== email) return email;
  return undefined;
}
