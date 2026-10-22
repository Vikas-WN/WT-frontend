"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Upload, ArrowRight, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { normalizeRoles } from "@/utils/roles";
import { BULK_IMPORTS, type ImportDefinition } from "@/constants/bulkImports";
import { validateImport, importCsv, csvCell, type ImportPreview } from "@/utils/bulkImportValidation";
import { hrmsService } from "@/services/hrms.service";
import { endpoints } from "@/api/endpoints";
import { apiRecord } from "@/utils/apiCollection";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { AdminDataHub } from "./AdminDataHub";

const TARGETS: Record<string,string> = { people:endpoints.upload.userData,users:endpoints.user.batch,leave:endpoints.upload.leave,allocation:endpoints.upload.allocation,assets:endpoints.assets.importCsv,kpis:endpoints.masters.kpiDefinitionsImportCsv,ratings:endpoints.monthlySubmissions.importCsv,holidays:endpoints.holidayCalendar.importCsv,holidayAssignments:endpoints.holidayCalendar.importAssignmentsCsv };
function download(blob: Blob, name: string) { const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }

export function UploadsPageClient() {
  const {user}=useAuth();
  const roles=normalizeRoles(user?.roles??[]);
  const allowed=roles.includes("ROLE_HR")||roles.includes("ROLE_ADMIN");
  const isAdmin=roles.includes("ROLE_ADMIN");
  const queryClient=useQueryClient();
  const [tab,setTab]=useState<"imports"|"manage">("imports");
  const [definition,setDefinition]=useState(BULK_IMPORTS[0]);
  const [preview,setPreview]=useState<ImportPreview|null>(null);
  const [fileName,setFileName]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [reading,setReading]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const [acknowledged,setAcknowledged]=useState(false);
  const [result,setResult]=useState<Record<string,unknown>|null>(null);
  const [resultMessage,setResultMessage]=useState("");
  const inputRef=useRef<HTMLInputElement>(null);
  const readRevision=useRef(0);
  if(!allowed) return <DashboardPageShell><PageHero title="Organization data" description="HR or Admin access is required to manage organization data."/></DashboardPageShell>;
  const choose=(next:ImportDefinition)=>{readRevision.current+=1;setDefinition(next);setPreview(null);setError("");setResult(null);setResultMessage("");setFileName("");setAcknowledged(false);setReading(false);};
  const template=()=>download(new Blob(["\uFEFF"+importCsv(definition,[])],{type:"text/csv;charset=utf-8"}),`webtrak-${definition.id}-template.csv`);
  const read=async(file:File)=>{
    const revision=++readRevision.current;
    setError("");setPreview(null);setResult(null);setResultMessage("");setAcknowledged(false);setFileName(file.name);
    if(!/\.(csv|xlsx)$/i.test(file.name)){setError("Choose a CSV or XLSX file.");return;}
    if(file.size===0||file.size>5*1024*1024){setError("Choose a non-empty file up to 5 MB.");return;}
    setReading(true);
    try{
      const XLSX=await import("xlsx");
      const workbook=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true,raw:true,sheetRows:5002});
      const sheet=workbook.Sheets[workbook.SheetNames[0]];
      if(!sheet)throw new Error("The file has no worksheet.");
      if(XLSX.utils.decode_range(sheet["!fullref"] || sheet["!ref"] || "A1").e.r > 5000)throw new Error("Import at most 5,000 rows at a time. Split this file before continuing.");
      if(Object.values(sheet).some((cell)=>cell&&typeof cell==="object"&&"f" in cell))throw new Error("Replace spreadsheet formulas with plain values before importing.");
      const matrix=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,defval:"",raw:true});
      const checked=validateImport(definition,(matrix[0]??[]).map(String),matrix.slice(1));
      if(revision===readRevision.current)setPreview(checked);
    }catch(cause){if(revision===readRevision.current)setError(cause instanceof Error?cause.message:"We couldn't read this file. Try a fresh template.");}
    finally{if(revision===readRevision.current)setReading(false);}
  };
  const upload=async()=>{
    if(!allowed||(definition.adminOnly&&!isAdmin)||!preview||preview.issues.length||!preview.rows.length||!acknowledged||busy)return;
    setConfirm(false);setBusy(true);setError("");
    try{
      let file:File;
      if(definition.format==="xlsx"){
        const XLSX=await import("xlsx");
        const matrix:unknown[][]=[definition.columns.map((column)=>column.key),...preview.rows.map((row)=>definition.columns.map((column)=>{
          const value=row[column.key]??"";
          if(value&&column.type==="number")return Number(value);
          if(value&&column.type==="date")return new Date(`${value}T12:00:00`);
          return value;
        }))];
        const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet(matrix,{cellDates:true}),"Import");
        file=new File([XLSX.write(workbook,{type:"array",bookType:"xlsx",cellDates:true})],`webtrak-${definition.id}.xlsx`,{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
      }else file=new File([importCsv(definition,preview.rows)],`webtrak-${definition.id}.csv`,{type:"text/csv"});
      const response=await hrmsService.uploadFile(TARGETS[definition.id],file);
      setResult(apiRecord<Record<string,unknown>>(response)??{});
      setResultMessage(response.message||"Import completed. Review the server result below.");
      setPreview(null);setAcknowledged(false);
      await queryClient.invalidateQueries();
    }catch(cause){setError(toUserFriendlyApiErrorMessage(cause,"The import failed. Review the file and try again."));}
    finally{setBusy(false);}
  };
  return <DashboardPageShell>
    <PageHero title="Organization data" eyebrow="HR / Admin workspace" description="Manage records, prepare a template, and review every import before it reaches your organization."/>
    <div className="flex gap-1 rounded-xl border border-wt-border bg-wt-surface-2 p-1 sm:w-fit" role="group" aria-label="Data workspace"><Button variant={tab==="imports"?"outline":"ghost"} onClick={()=>setTab("imports")}>Bulk imports</Button><Button variant={tab==="manage"?"outline":"ghost"} onClick={()=>setTab("manage")}>Manage data</Button></div>
    {tab==="manage"?<AdminDataHub/>:<div className="grid items-start gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <nav aria-label="Import type" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{BULK_IMPORTS.filter((item)=>!item.adminOnly||isAdmin).map((item)=><button key={item.id} type="button" disabled={busy} onClick={()=>choose(item)} aria-pressed={definition.id===item.id} className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${definition.id===item.id?"border-wt-brand bg-wt-brand-soft text-wt-brand":"border-wt-border bg-wt-surface-1 text-wt-text hover:bg-wt-surface-2"}`}><FileSpreadsheet className="size-4 shrink-0"/><span className="flex-1 font-medium">{item.name}</span>{item.adminOnly?<span className="text-[10px]">Admin</span>:null}</button>)}</nav>
      <section className="min-w-0 space-y-6 rounded-2xl border border-wt-border bg-wt-surface-1 p-5 sm:p-7">
        <header className="flex flex-wrap justify-between gap-4"><div><h2 className="font-[family-name:var(--font-brand)] text-xl font-semibold text-wt-text">{definition.name}</h2><p className="mt-2 text-sm text-wt-text-muted">{definition.description}</p></div><Button variant="outline" onClick={template}><Download className="size-4"/>CSV template</Button></header>
        <p className="rounded-xl border border-wt-border bg-wt-surface-2 p-4 text-sm leading-relaxed text-wt-text-muted">{definition.behavior}</p>
        <div className="grid gap-3 sm:grid-cols-3">{["Download the template","Check your file","Review and import"].map((text,index)=><div key={text} className="flex items-center gap-2 text-xs font-medium text-wt-text-muted"><span className="grid size-6 place-items-center rounded-full bg-wt-brand-soft text-wt-brand">{index+1}</span>{text}</div>)}</div>
        <input ref={inputRef} type="file" accept=".csv,.xlsx" className="sr-only" aria-label="Choose import file" disabled={busy||reading} onChange={(event)=>{const file=event.target.files?.[0];if(file)void read(file);event.target.value="";}}/>
        <button type="button" disabled={busy||reading} onClick={()=>inputRef.current?.click()} onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>{event.preventDefault();const file=event.dataTransfer.files[0];if(file&&!busy&&!reading)void read(file);}} className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-wt-border-md bg-wt-surface-2/50 px-5 py-9 text-center transition-colors hover:border-wt-brand disabled:opacity-50"><Upload className="size-6 text-wt-brand"/><span className="text-sm font-semibold text-wt-text">{reading?"Checking file…":fileName||"Choose a file or drop it here"}</span><span className="text-xs text-wt-text-muted">CSV or XLSX · Up to 5 MB · First worksheet · Up to 5,000 rows</span></button>
        <p className="text-xs leading-relaxed text-wt-text-muted">Templates contain headers only. Required columns are marked below. Dates accept YYYY-MM-DD or DD/MM/YYYY. Files are checked in your browser before upload. Server validation remains authoritative.</p>
        <details className="rounded-xl border border-wt-border p-4"><summary className="cursor-pointer text-sm font-medium text-wt-text">Columns and requirements</summary><dl className="mt-4 grid gap-3 sm:grid-cols-2">{definition.columns.map((column)=><div key={column.key}><dt className="text-xs font-semibold text-wt-text">{column.key}{column.required?" *":""}</dt><dd className="mt-1 text-xs text-wt-text-muted">{column.label} · {column.type??"text"}</dd></div>)}</dl></details>
        {error?<div role="alert" className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300"><AlertCircle className="mt-0.5 size-4 shrink-0"/>{error}</div>:null}
        {preview?<div className="space-y-4" aria-live="polite"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm font-semibold text-wt-text">{preview.rows.length} rows · {preview.validCount} valid · {preview.issues.length} issues</p>{preview.issues.length?<Button variant="outline" size="sm" onClick={()=>download(new Blob([["row,field,message",...preview.issues.map((issue)=>[issue.row,issue.field,issue.message].map((value)=>csvCell(value)).join(","))].join("\r\n")],{type:"text/csv"}),"webtrak-import-errors.csv")}>Download errors</Button>:null}</div>{preview.issues.length?<ul className="max-h-48 space-y-2 overflow-y-auto rounded-xl bg-rose-500/5 p-4 text-xs text-rose-700 dark:text-rose-300">{preview.issues.slice(0,50).map((issue,index)=><li key={index}>Row {issue.row} · {issue.field}: {issue.message}</li>)}{preview.issues.length>50?<li>Download the report for all issues.</li>:null}</ul>:null}<div className="max-h-72 overflow-auto rounded-xl border border-wt-border"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-wt-surface-2"><tr>{definition.columns.map((column)=><th key={column.key} className="whitespace-nowrap px-3 py-3 font-medium text-wt-text-muted">{column.key}</th>)}</tr></thead><tbody>{preview.rows.slice(0,10).map((row,index)=><tr key={index} className="border-t border-wt-border">{definition.columns.map((column)=><td key={column.key} className="max-w-56 truncate whitespace-nowrap px-3 py-3 text-wt-text">{row[column.key]||"—"}</td>)}</tr>)}</tbody></table></div><p className="text-xs text-wt-text-muted">Preview shows the first 10 rows. Every row is checked.</p><label className="flex items-start gap-3 rounded-xl border border-wt-border p-4 text-sm text-wt-text"><input type="checkbox" checked={acknowledged} onChange={(event)=>setAcknowledged(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--wt-brand)]"/>I have reviewed these records and the update behavior, and I am authorized to import this data.</label><Button onClick={()=>setConfirm(true)} disabled={!!preview.issues.length||!preview.rows.length||!acknowledged||busy}>Review import<ArrowRight className="size-4"/></Button></div>:null}
        {busy?<p role="status" className="text-sm text-wt-text-muted">Importing… Keep this page open.</p>:null}
        {result?<div role="status" className="space-y-3 rounded-xl border border-wt-border bg-wt-surface-2 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-wt-text"><CheckCircle2 className="size-4 text-wt-brand"/>{resultMessage}</p><dl className="grid gap-3 sm:grid-cols-3">{Object.entries(result).filter(([,value])=>typeof value==="number").map(([key,value])=><div key={key}><dt className="text-xs text-wt-text-muted">{key.replaceAll("_"," ")}</dt><dd className="mt-1 text-xl font-semibold text-wt-text">{String(value)}</dd></div>)}</dl>{Array.isArray(result.errors)&&result.errors.length?<ul className="max-h-56 space-y-2 overflow-auto text-xs text-rose-700 dark:text-rose-300">{result.errors.map((item,index)=><li key={index}>{typeof item==="string"?item:JSON.stringify(item)}</li>)}</ul>:null}<p className="text-xs leading-relaxed text-wt-text-muted">The server may accept some rows and reject others. Review these results before retrying; do not re-import successful create-only rows.</p></div>:null}
      </section>
    </div>}
    <ConfirmDialog open={confirm} title={`Import ${preview?.rows.length??0} ${definition.name.toLowerCase()} rows?`} description={definition.behavior} confirmLabel="Import reviewed rows" loading={busy} onCancel={()=>setConfirm(false)} onConfirm={()=>void upload()}/>
  </DashboardPageShell>;
}
