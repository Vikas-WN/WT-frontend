import Link from "next/link";
import { ArrowUpRight, BookOpen, CalendarDays, CheckCheck, Clock3, FolderKanban, UserPlus, UsersRound, BarChart3 } from "lucide-react";
import { DASHBOARD_ROUTES } from "@/constants/routes";

export type WorkspaceMode = "employee" | "manager" | "admin";
const PATHS = {
  employee: [
    { id: "timelog", title: "Your working week", detail: "Keep your time up to date", icon: Clock3 },
    { id: "leave", title: "Make time for yourself", detail: "Plan leave and check your balance", icon: CalendarDays },
    { id: "learning", title: "Keep growing", detail: "Pick up where you left off", icon: BookOpen },
  ],
  manager: [
    { id: "leave-team", title: "Decisions that need you", detail: "Review your team's requests", icon: CheckCheck },
    { id: "timelog-team", title: "Your team's week", detail: "See time and delivery together", icon: Clock3 },
    { id: "allocation", title: "People and projects", detail: "Plan capacity with confidence", icon: FolderKanban },
  ],
  admin: [
    { id: "employee-directory", title: "Your people", detail: "One place for the whole organization", icon: UsersRound },
    { id: "employee", title: "Welcome someone new", detail: "Manage the joining experience", icon: UserPlus },
    { id: "reports-workforce", title: "The bigger picture", detail: "Explore workforce insights", icon: BarChart3 },
  ],
};
export function WorkspacePaths({ mode }: { mode: WorkspaceMode }) {
  return (
    <section aria-label={`${mode} workspace shortcuts`} className="wt-workspace-paths">
      {PATHS[mode].map(({ id, title, detail, icon: Icon }) => (
        <Link key={id} href={DASHBOARD_ROUTES[id]} className="wt-workspace-path group">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-wt-brand-soft text-wt-brand"><Icon className="size-5" aria-hidden /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-wt-text">{title}</span><span className="mt-1 block text-xs leading-relaxed text-wt-text-muted">{detail}</span></span>
          <ArrowUpRight className="size-4 shrink-0 text-wt-text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      ))}
    </section>
  );
}
