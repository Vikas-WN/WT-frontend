"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, ShieldCheck, Upload } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { AdminDataHub } from "@/components/dashboard/uploads/AdminDataHub";
import { KpiDefinitionsPanel } from "@/components/dashboard/pulse/KpiDefinitionsPanel";
import { WebknotValuesPanel } from "@/components/dashboard/pulse/WebknotValuesPanel";
import { CertificationsPanel } from "@/components/dashboard/pulse/CertificationsPanel";
import { SubmissionPortalPanel } from "@/components/dashboard/pulse/SubmissionPortalPanel";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { normalizeRoles, formatRoleLabel } from "@/utils/roles";
import { hrmsService } from "@/services/hrms.service";
import { toPagedRows } from "@/utils/apiRows";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { DASHBOARD_ROUTES } from "@/constants/routes";

const TABS = ["Organization", "KPI definitions", "Values", "Certifications", "Review windows", "Access"] as const;
const ADDITIONAL_ROLES = ["ROLE_HR", "ROLE_DM", "ROLE_AM", "ROLE_ADMIN", "ROLE_FINANCE", "ROLE_OFFICE_ADMIN"];

export function MastersPageClient() {
  const { user } = useAuth();
  const roles = normalizeRoles(user?.roles ?? []);
  const allowed = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Organization");
  return <DashboardPageShell>
    <PageHero eyebrow="HR / Admin workspace" title="Data management" description="Keep your organization current, from everyday records to review settings and access."/>
    {allowed ? <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-wt-border bg-wt-surface-2 p-1" role="group" aria-label="Data management area">{TABS.map((item)=><Button key={item} variant={item===tab?"outline":"ghost"} size="sm" aria-pressed={item===tab} className="shrink-0" onClick={()=>setTab(item)}>{item}</Button>)}</div>
        <Link href={DASHBOARD_ROUTES.uploads} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wt-brand px-4 text-sm font-semibold text-white"><Upload className="size-4"/>Bulk imports</Link>
      </div>
      {tab==="Organization"?<><div className="flex gap-3 rounded-2xl border border-wt-border bg-wt-surface-1 p-5"><Database className="size-5 shrink-0 text-wt-brand"/><p className="text-sm leading-relaxed text-wt-text-muted">Use each area’s editor to update records and follow its approval process. Bands and departments currently come from the organization reference service; that service does not expose an editor. Job designations can be added during onboarding.</p></div><AdminDataHub/></>:null}
      {tab==="KPI definitions"?<KpiDefinitionsPanel/>:null}
      {tab==="Values"?<WebknotValuesPanel/>:null}
      {tab==="Certifications"?<CertificationsPanel/>:null}
      {tab==="Review windows"?<SubmissionPortalPanel/>:null}
      {tab==="Access"?<RoleAccess/>:null}
    </>:<p className="text-sm text-wt-text-muted">HR or Admin access is required to manage organization data.</p>}
  </DashboardPageShell>;
}

function RoleAccess() {
  const queryClient = useQueryClient();
  const [email,setEmail]=useState("");
  const [role,setRole]=useState("");
  const [confirm,setConfirm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const people=useQuery({queryKey:["role-assignment-people"],queryFn:async()=>{
    const response=await hrmsService.getOnboardList({page:"0",size:"200"});
    return toPagedRows((response as {data?:unknown}).data??response);
  }});
  const assign=async()=>{
    if(busy||!ADDITIONAL_ROLES.includes(role)||!email.trim())return;
    setBusy(true);setError("");setSuccess("");
    try {
      await hrmsService.assignRole({target_email:email.trim(),role});
      setSuccess(`${formatRoleLabel(role)} access granted to ${email.trim()}.`);
      setEmail("");setRole("");setConfirm(false);
      await queryClient.invalidateQueries({queryKey:["role-assignment-people"]});
    }catch(cause){setError(toUserFriendlyApiErrorMessage(cause,"Access could not be updated."));setConfirm(false);}
    finally{setBusy(false);}
  };
  return <section className="max-w-3xl space-y-6 rounded-2xl border border-wt-border bg-wt-surface-1 p-5 sm:p-7">
    <div className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-wt-brand-soft text-wt-brand"><ShieldCheck className="size-5"/></span><div><h2 className="text-lg font-semibold text-wt-text">Additional portal access</h2><p className="mt-1 text-sm leading-relaxed text-wt-text-muted">Grant an additional role to an existing employee. To replace a portal role or return someone to Employee access, use the Employee Directory.</p></div></div>
    <form onSubmit={(event)=>{event.preventDefault();setError("");setSuccess("");setConfirm(true);}} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-wt-text"><span className="block">Employee work email</span><input type="email" required list="access-employees" autoComplete="off" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="name@company.com" className="min-h-11 w-full rounded-xl border border-wt-border bg-wt-surface-1 px-3"/><datalist id="access-employees">{people.data?.map((person,index)=>person.email?<option key={String(person.email)+index} value={String(person.email)}>{String(person.name??person.email)}</option>:null)}</datalist></label>
      <label className="space-y-2 text-sm font-medium text-wt-text"><span className="block">Additional role</span><select required value={role} onChange={(event)=>setRole(event.target.value)} className="min-h-11 w-full rounded-xl border border-wt-border bg-wt-surface-1 px-3"><option value="">Choose a role</option>{ADDITIONAL_ROLES.map((item)=><option key={item} value={item}>{formatRoleLabel(item)}</option>)}</select></label></div>
      {people.isError?<p className="text-xs text-wt-text-muted">Suggestions are unavailable. Enter the existing employee’s work email directly.</p>:null}
      <p className="text-xs leading-relaxed text-wt-text-muted">This adds permissions. Your current access and the server’s role-assignment rules determine which grants are allowed.</p>
      {error?<p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>:null}{success?<p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>:null}
      <div className="flex flex-wrap items-center gap-4"><Button type="submit" disabled={busy||!email.trim()||!role}>Review access change</Button><Link href={DASHBOARD_ROUTES["employee-directory"]} className="text-sm font-semibold text-wt-brand">Open Employee Directory</Link></div>
    </form>
    <ConfirmDialog open={confirm} title="Grant additional access?" description={`${email.trim()} will receive ${formatRoleLabel(role)} permissions in addition to existing access.`} confirmLabel="Grant access" loading={busy} onCancel={()=>setConfirm(false)} onConfirm={()=>void assign()}/>
  </section>;
}
