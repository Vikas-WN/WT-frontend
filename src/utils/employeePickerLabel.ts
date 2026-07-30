export function formatEmployeePickerLabel(employee: {
  employeeName: string;
  employeeEmail: string;
  empId?: string;
}): string {
  const name = employee.employeeName.trim() || employee.employeeEmail;
  const email = employee.employeeEmail.trim();
  // Employee IDs must never appear in dropdown labels.
  void employee.empId;
  if (email && name !== email) return `${name} (${email})`;
  return name || email || "—";
}
