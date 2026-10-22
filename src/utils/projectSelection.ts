/** Preserve the complete detail-dialog contract when a project is opened from the collection. */
export function projectSelection(row: Record<string, unknown>, projectType: string) {
  const code=String(row.project_code??row.projectCode??"").trim();
  const rawIds=Array.isArray(row.opportunity_ids)?row.opportunity_ids:Array.isArray(row.opportunityIds)?row.opportunityIds:[];
  return {
    code,
    name:String(row.project_name??row.projectName??code).trim()||code,
    clientExternalId:String(row.client_external_id??row.clientExternalId??"").trim()||null,
    clientName:String(row.client_name??row.clientName??"").trim()||null,
    projectType,
    startDate:String(row.start_date??row.startDate??"").trim()||null,
    endDate:String(row.end_date??row.endDate??"").trim()||null,
    opportunityIds:rawIds.map(id=>String(id??"").trim()).filter(Boolean),
  };
}
