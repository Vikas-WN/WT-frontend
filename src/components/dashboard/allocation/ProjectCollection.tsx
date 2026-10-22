"use client";
import { ArrowUpRight, CalendarDays, FolderKanban } from "lucide-react";
import { projectTypeCodeFromRow, formatProjectTypeCode } from "@/utils/projectTypes";
import { formatApiDateDisplay, parseApiDate } from "@/utils/apiDate";
import type { ProjectCollectionProps } from "@/types/projectCollection";

/** Project identities and timelines, rather than a spreadsheet of repeated actions. */
export function ProjectCollection({rows,typeLabels,onSelect}: ProjectCollectionProps) {
  return <div className="wt-project-collection">{rows.map((row,index)=>{
    const code=String(row.project_code??row.projectCode??"").trim();
    const name=String(row.project_name??row.projectName??code).trim();
    const end=String(row.end_date??row.endDate??"");
    const endDate=parseApiDate(end);
    const today=new Date();today.setHours(0,0,0,0);
    const ended=endDate?endDate<today:false;
    const start=String(row.start_date??row.startDate??"");
    const client=String(row.client_name??row.clientName??"").trim();
    const opportunities=Array.isArray(row.opportunities)?row.opportunities as Record<string,unknown>[]:[];
    return <button key={code||index} type="button" disabled={!code} onClick={()=>onSelect(row)} className="wt-project-card group">
      <div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-wt-brand-soft text-wt-brand"><FolderKanban className="size-5"/></span><span className={ended?"wt-project-status":"wt-project-status wt-project-active"}>{ended?"Ended":"Active"}</span></div>
      <div className="min-w-0"><p className="mb-1 text-[11px] text-wt-text-muted">{code}</p><h3 className="line-clamp-2 text-[15px] font-semibold text-wt-text">{name||"Untitled project"}</h3><p className="mt-1.5 text-xs text-wt-text-muted">{client||formatProjectTypeCode(projectTypeCodeFromRow(row),typeLabels)}</p></div>
      {opportunities.length?<div className="flex flex-wrap gap-1.5">{opportunities.slice(0,2).map((item,i)=><span key={i} className="max-w-full truncate rounded-md bg-wt-surface-2 px-2 py-1 text-[10px] text-wt-text-muted">{String(item.opp_name??item.oppName??item.opp_id??item.oppId??"Opportunity")}</span>)}{opportunities.length>2?<span className="py-1 text-[10px] text-wt-text-muted">+{opportunities.length-2} more</span>:null}</div>:null}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-wt-border pt-4 text-xs text-wt-text-muted"><span className="flex flex-wrap items-center gap-2"><CalendarDays className="size-3.5"/>{start?formatApiDateDisplay(start):"No start date"}{end?` – ${formatApiDateDisplay(end)}`:""}</span><ArrowUpRight className="size-4 shrink-0 text-wt-brand transition-transform group-hover:-translate-y-0.5"/></div>
    </button>;
  })}</div>;
}
