export function formatEmployeePickerLabel(employee: {
  employeeName: string;
  employeeEmail: string;
  empId?: string;
}): string {
  const name = employee.employeeName.trim() || employee.employeeEmail;
  const email = employee.employeeEmail.trim();
  const empId = employee.empId?.trim();
  if (empId) return `${empId} — ${name} (${email})`;
  return `${name} (${email})`;
}
