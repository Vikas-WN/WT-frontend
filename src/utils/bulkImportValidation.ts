import type { ImportDefinition } from "../constants/bulkImports";
export type ImportIssue = { row: number; field: string; message: string };
export type ImportPreview = { rows: Record<string, string>[]; issues: ImportIssue[]; validCount: number };

export function normalizedDate(value: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const display = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const parts = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : display ? [Number(display[3]), Number(display[2]), Number(display[1])] : null;
  if (!parts) return null;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}` : null;
}
export function validateImport(definition: ImportDefinition, headers: string[], values: unknown[][]): ImportPreview {
  const keys = headers.map((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase());
  const issues: ImportIssue[] = [];
  const allowed = new Set(definition.columns.map((column) => column.key));
  keys.forEach((key, index) => { if (!key || !allowed.has(key)) issues.push({row:1,field:headers[index],message:"Unrecognized column. Use the downloaded template."}); if (keys.indexOf(key) !== index) issues.push({row:1,field:key,message:"Duplicate column header."}); });
  for (const column of definition.columns) if (column.required && !keys.includes(column.key)) issues.push({row:1,field:column.key,message:"Required column is missing."});
  const rows: Record<string,string>[] = [];
  const seen = new Map<string,number>();
  const badRows = new Set<number>();
  values.forEach((cells, index) => {
    if (!cells.some((value) => value != null && String(value).trim())) return;
    const rowNumber = index + 2;
    const row: Record<string,string> = {};
    keys.forEach((key, cell) => {
      const value = cells[cell];
      row[key] = value instanceof Date ? `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}` : String(value ?? "").trim();
    });
    const fail = (field:string,message:string) => { issues.push({row:rowNumber,field,message}); badRows.add(rowNumber); };
    for (const column of definition.columns) {
      const value = row[column.key] ?? "";
      if (!value) { if (column.required) fail(column.key,"This value is required."); continue; }
      if (/^[=+@-]/.test(value) && !(column.key === "phone_number" && /^\+?[\d ()-]+$/.test(value)) && !(column.type === "number" && Number.isFinite(Number(value)))) { fail(column.key,"Formula-like values are not accepted. Use plain text or values."); continue; }
      if (column.type === "email") { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(column.key,"Enter a valid email address."); else row[column.key] = value.toLowerCase(); }
      if (column.type === "number") { const number = Number(value); if (!Number.isFinite(number) || (column.min != null && number < column.min) || (column.max != null && number > column.max)) fail(column.key,`Enter a number${column.min != null ? ` from ${column.min}` : ""}${column.max != null ? ` to ${column.max}` : ""}.`); }
      if (column.type === "date") { const date = normalizedDate(value); if (!date) fail(column.key,"Use a real date in YYYY-MM-DD or DD/MM/YYYY format."); else row[column.key] = date; }
      if (column.type === "boolean") { if (!/^(true|false)$/i.test(value)) fail(column.key,"Use true or false."); else row[column.key] = value.toLowerCase(); }
    }
    if (row.end_date && row.start_date && row.end_date < row.start_date) fail("end_date","End date must be on or after the start date.");
    if (definition.id === "ratings") {
      if (!row.submission_id && !((row.email || row.employee_id) && /^\d{4}-(0[1-9]|1[0-2])$/.test(row.month ?? ""))) fail("submission_id","Provide a submission ID, or employee ID/email plus month (YYYY-MM).");
      if (!row.score && !row.review_status) fail("score","Provide a score or review status to update.");
      if (row.review_status && !["DRAFT","SUBMITTED","NEEDS_REVIEW","MANAGER_SUBMITTED","NEEDS_MANAGER_REVIEW","APPROVED"].includes(row.review_status.toUpperCase())) fail("review_status","Unrecognized review status.");
    }
    if (row.status && !["INVITED","ONBOARDING","ACTIVE","SERVING_NOTICE","INACTIVE","OFFBOARDED","DELETED"].includes(row.status.toUpperCase())) fail("status","Unrecognized employee status.");
    const key = definition.key.map((key) => (row[key] ?? "").toLowerCase()).join("|");
    if (seen.has(key)) fail(definition.key.join(", "),`Duplicate key; also present on row ${seen.get(key)}.`); else seen.set(key,rowNumber);
    rows.push(row);
  });
  if (rows.length === 0) issues.push({row:1,field:"file",message:"Add at least one data row beneath the headers."});
  if (rows.length > 5000) issues.push({row:1,field:"file",message:"Import at most 5,000 rows at a time."});
  return {rows,issues,validCount:issues.some((issue)=>issue.row===1)?0:rows.length-badRows.size};
}
export function csvCell(value: unknown, protectFormula = true) {
  let text = String(value ?? "");
  if (protectFormula && /^[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"','""')}"`;
}
export function importCsv(definition: ImportDefinition, rows: Record<string,string>[]) {
  return [definition.columns.map((column)=>csvCell(column.key)).join(","),...rows.map((row)=>definition.columns.map((column)=>csvCell(row[column.key], false)).join(","))].join("\r\n");
}
