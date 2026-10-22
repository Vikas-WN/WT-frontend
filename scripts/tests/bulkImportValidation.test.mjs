import assert from "node:assert/strict";
import { test } from "node:test";
import { BULK_IMPORTS } from "../../src/constants/bulkImports.ts";
import { validateImport, normalizedDate, importCsv, csvCell } from "../../src/utils/bulkImportValidation.ts";
const schema=(id)=>BULK_IMPORTS.find((item)=>item.id===id);

test("leave and allocation templates preserve the server's positional contract",()=>{
  assert.deepEqual(schema("leave").columns.map((item)=>item.key),["email","name","primary_leave","secondary_leave","carry_forward"]);
  assert.deepEqual(schema("allocation").columns.map((item)=>item.key),["name","email","client","role","allocation_value","start_date","end_date","locked_date","allocation_type","project_code"]);
  assert.equal(schema("users").adminOnly,true);
});
test("dates validate the calendar, including leap years",()=>{
  assert.equal(normalizedDate("29/02/2024"),"2024-02-29");
  assert.equal(normalizedDate("2025-02-29"),null);
  assert.equal(normalizedDate("2026-13-01"),null);
});
test("employee imports retain international phone numbers and normalize emails",()=>{
  const result=validateImport(schema("people"),["email","phone_number"],[["PERSON@EXAMPLE.COM","+91 98765 43210"]]);
  assert.equal(result.issues.length,0);
  assert.equal(result.rows[0].email,"person@example.com");
  assert.equal(result.rows[0].phone_number,"+91 98765 43210");
});
test("unknown headers, duplicate identities and invalid balances block imports",()=>{
  const result=validateImport(schema("leave"),["email","primary_leave","secondary_leave","typo"],[["a@example.com",-1,0,""],["A@example.com",1,0,""]]);
  assert.equal(result.validCount,0);
  assert.ok(result.issues.some((issue)=>issue.field==="typo"));
  assert.ok(result.issues.some((issue)=>issue.message.includes("Duplicate key")));
  assert.ok(result.issues.some((issue)=>issue.field==="primary_leave"));
});
test("formula content and invalid date order cannot reach confirmation",()=>{
  const result=validateImport(schema("allocation"),schema("allocation").columns.map((item)=>item.key),[["=cmd()","a@example.com","","Engineer",.5,"2026-10-22","2026-10-01","","HARD","PROJECT"]]);
  assert.ok(result.issues.some((issue)=>issue.field==="name"));
  assert.ok(result.issues.some((issue)=>issue.field==="end_date"));
});
test("ratings need a target and an actual change",()=>{
  assert.ok(validateImport(schema("ratings"),["email","month","score"],[["a@example.com","2026-15",5]]).issues.length);
  assert.equal(validateImport(schema("ratings"),["email","month","score"],[["a@example.com","2026-10",0]]).issues.length,0);
});
test("transport CSV preserves reviewed values while error exports protect spreadsheet cells",()=>{
  assert.equal(csvCell("=SUM(A1)"),'"\'=SUM(A1)"');
  const result=importCsv(schema("people"),[{email:"a@example.com",name:'Jane, "JJ"',phone_number:"+919876543210"}]);
  assert.ok(result.includes('"+919876543210"'));
  assert.ok(result.includes('"Jane, ""JJ"""'));
  assert.ok(!result.includes("'+91"));
});
test("a blank calendar assignment is an intentional supported reset",()=>{
  assert.equal(validateImport(schema("holidayAssignments"),["email","calendar_code"],[["a@example.com",""]]).issues.length,0);
});
