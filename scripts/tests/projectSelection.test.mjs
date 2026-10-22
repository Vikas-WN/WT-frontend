import assert from "node:assert/strict";
import { test } from "node:test";
import { projectSelection } from "../../src/utils/projectSelection.ts";

test("project cards preserve client, dates and opportunity identifiers for the detail dialog",()=>{
  const selected=projectSelection({projectCode:"P-1",projectName:"Customer platform",clientExternalId:"C-1",clientName:"Northstar",startDate:"01/10/2026",endDate:"31/03/2027",opportunityIds:[" A ","",3]},"Billable");
  assert.deepEqual(selected,{code:"P-1",name:"Customer platform",clientExternalId:"C-1",clientName:"Northstar",projectType:"Billable",startDate:"01/10/2026",endDate:"31/03/2027",opportunityIds:["A","3"]});
});
test("server-style project records and absent optional fields remain valid",()=>{
  const selected=projectSelection({project_code:"P-2",opportunity_ids:["OP-2"]},"Internal");
  assert.equal(selected.code,"P-2");assert.equal(selected.name,"P-2");assert.equal(selected.clientName,null);assert.equal(selected.startDate,null);assert.deepEqual(selected.opportunityIds,["OP-2"]);
});
