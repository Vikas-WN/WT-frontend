import Link from "next/link";
import { ArrowUpRight, Users, FolderKanban, CalendarDays, Laptop, GraduationCap, BookOpen, Megaphone, Settings2, ShieldCheck, FileText, DoorOpen } from "lucide-react";
import { DASHBOARD_ROUTES } from "@/constants/routes";
const MODULES = [
  {id:"employee-directory",label:"Employee records",detail:"Profiles, employment status, user types and portal roles",icon:Users},
  {id:"employee",label:"Onboarding",detail:"Invite employees and manage joining information",icon:Users},
  {id:"offboarding",label:"Offboarding",detail:"Exit dates, separation records and lifecycle checks",icon:DoorOpen},
  {id:"allocation",label:"Projects & allocations",detail:"Assignments, capacity and project dates",icon:FolderKanban},
  {id:"clients",label:"Clients",detail:"Client accounts and project relationships",icon:FolderKanban},
  {id:"leave-team",label:"Leave & balances",detail:"Review requests and correct employee balances",icon:CalendarDays},
  {id:"timelog-team",label:"Team time",detail:"Inspect and manage time records within your access",icon:CalendarDays},
  {id:"assets",label:"Assets",detail:"Inventory, assignments, returns and condition",icon:Laptop},
  {id:"holiday-calendars",label:"Holiday calendars",detail:"Calendars, dates and employee assignments",icon:CalendarDays},
  {id:"learning",label:"Learning",detail:"Training catalog, enrollment, attendance and scores",icon:GraduationCap},
  {id:"masters",label:"Reviews & master data",detail:"KPIs, values, certifications and review windows",icon:Settings2},
  {id:"policies",label:"Policies",detail:"Create, revise and publish policy documents",icon:BookOpen},
  {id:"announcements",label:"Announcements",detail:"News, polls and publication details",icon:Megaphone},
  {id:"events",label:"Events",detail:"Event details, invitations and responses",icon:CalendarDays},
  {id:"forms",label:"Forms",detail:"Questionnaires, due dates and responses",icon:FileText},
  {id:"compliance",label:"Compliance",detail:"Document gaps and compliance follow-up",icon:ShieldCheck},
  {id:"settings",label:"Organization settings",detail:"Seasonal themes and scoring configuration",icon:Settings2},
  {id:"apps",label:"Apps & integrations",detail:"Manage app access and revoke credentials",icon:Settings2},
];
export function AdminDataHub() {
  return <section className="space-y-4"><div><h2 className="font-[family-name:var(--font-brand)] text-lg font-semibold text-wt-text">Manage your organization</h2><p className="mt-1 text-sm text-wt-text-muted">Open the dedicated editor for each area. Server permissions and workflow rules apply to every change.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{MODULES.map(({id,label,detail,icon:Icon})=><Link key={id} href={DASHBOARD_ROUTES[id]} className="flex items-start gap-3 rounded-xl border border-wt-border bg-wt-surface-1 p-4 transition-colors hover:border-wt-border-md hover:bg-wt-surface-2"><Icon className="mt-0.5 size-5 shrink-0 text-wt-brand" aria-hidden/><span className="flex-1"><span className="block text-sm font-semibold text-wt-text">{label}</span><span className="mt-1 block text-xs leading-relaxed text-wt-text-muted">{detail}</span></span><ArrowUpRight className="size-4 shrink-0 text-wt-text-faint" aria-hidden/></Link>)}</div></section>;
}
