"use client";

import Link from "next/link";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { SIDEBAR_BACKDROP_CLASS } from "@/components/dashboard/ui/sidebarLayout";
import { APP_NAV_FOOTER, APP_NAVIGATION, type AppNavEntry } from "@/constants/sidebarNavigation";
import { dashboardHref } from "@/constants/routes";
import type { NavItem } from "@/constants/dashboardNavigation";
import type { SidebarBadges } from "@/hooks/navigation/useSidebarBadges";
import { cn } from "@/lib/utils";

const BADGE_CLASS: Record<keyof SidebarBadges, string> = {
  requests: "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]",
  learning: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  compliance: "bg-amber-500/14 text-amber-800 dark:text-amber-300",
};

/** Every page id the signed-in role may open, from the role-filtered navigation the rest of the app already computes. */
function visibleIds(navigation: NavItem[]): Set<string> {
  const ids = new Set<string>();
  for (const item of navigation) {
    ids.add(item.id);
    if (item.kind === "group" || item.kind === "expandable") for (const child of item.children) ids.add(child.id);
  }
  return ids;
}

function EntryLink({
  entry,
  href,
  active,
  badge,
  onNavigate,
  trailing,
}: {
  entry: Pick<AppNavEntry, "label" | "icon">;
  href: string;
  active: boolean;
  badge?: ReactNode;
  onNavigate: () => void;
  trailing?: ReactNode;
}) {
  const Icon = entry.icon;
  return (
    <Link
      prefetch={false}
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-xl px-2.5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
        active
          ? "border border-[var(--wt-sidebar-border)] bg-[var(--wt-sidebar-active-bg)] font-semibold text-[var(--wt-sidebar-text)] shadow-[var(--wt-shadow-sm)]"
          : "border border-transparent text-[var(--wt-sidebar-text)] hover:bg-[var(--wt-sidebar-hover-bg)]"
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active ? "text-[var(--wt-brand)]" : "text-[var(--wt-sidebar-text-muted)]")} strokeWidth={1.75} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      {badge}
      {trailing}
    </Link>
  );
}

function Badge({ kind, value }: { kind: keyof SidebarBadges; value: number }) {
  return (
    <span className={cn("grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[12px] font-semibold tabular-nums", BADGE_CLASS[kind])} aria-label={`${value} pending`}>
      {value > 999 ? "999+" : value}
    </span>
  );
}

interface Props {
  visibleNavigation: NavItem[];
  activeSection: string;
  isLearningRoute: boolean;
  isNavChildActive: (navId: string) => boolean;
  badges: SidebarBadges;
  mobileNavOpen: boolean;
  closeMobileNav: () => void;
  user: { name?: string | null; email?: string | null } | null;
  profile: { name?: string | null } | null | undefined;
  displayName: string;
  roleLabel: string;
  canAccessProfile: boolean;
  isOffboarded: boolean;
  onLogout: () => void | Promise<void>;
  /** Shown above the account card (the role switcher for people who can act as another role). */
  accountSlot?: ReactNode;
}

/** The redesigned sidebar: a light, sectioned list (Me / Team / Work / Grow / Workplace / Admin) with counts, and the account card pinned at the foot. */
export function AppSidebar({
  visibleNavigation,
  activeSection,
  isLearningRoute,
  isNavChildActive,
  badges,
  mobileNavOpen,
  closeMobileNav,
  user,
  profile,
  displayName,
  roleLabel,
  canAccessProfile,
  isOffboarded,
  onLogout,
  accountSlot,
}: Props) {
  // UI state: whether the Reports sub-list is open (it is also open whenever one of its pages is).
  const [reportsOpen, setReportsOpen] = useState(false);
  const allowed = visibleIds(visibleNavigation);
  const isAllowed = (entry: AppNavEntry) => (entry.alwaysVisible ? canAccessProfile || entry.navId !== "profile" : allowed.has(entry.navId));

  const activeFor = (entry: AppNavEntry) => {
    if (entry.navId === "learning") return isLearningRoute;
    if (entry.navId === "profile") return activeSection === "profile";
    return !isLearningRoute && isNavChildActive(entry.navId);
  };

  return (
    <>
      {mobileNavOpen ? <button type="button" className={SIDEBAR_BACKDROP_CLASS} aria-label="Close navigation" onClick={closeMobileNav} /> : null}
      <aside
        className={cn(
          "wt-appsidebar z-40 flex h-dvh w-[15.5rem] shrink-0 flex-col border-r border-[var(--wt-sidebar-border)] bg-[var(--wt-sidebar-bg)] transition-transform duration-200 ease-out",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[min(88vw,300px)]",
          mobileNavOpen ? "max-lg:translate-x-0 max-lg:shadow-[0_24px_64px_rgba(0,0,0,0.3)]" : "max-lg:pointer-events-none max-lg:-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-4 pb-3 pt-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--wt-sidebar-border)] bg-white" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element -- a 25px static mark; next/image adds nothing */}
            <img src="/webtrak-logo.png" alt="" className="h-[22px] w-auto" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[15px] font-semibold text-[var(--wt-sidebar-text)]">WebTrak</span>
            <span className="block truncate text-[12.5px] text-[var(--wt-sidebar-text-muted)]">WebKnot Technologies</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-[var(--wt-sidebar-text-faint)]" aria-hidden />
        </div>

        <nav className="wt-sidebar-nav min-h-0 flex-1 overflow-y-auto px-3 pb-2" aria-label="Main navigation">
          {APP_NAVIGATION.map((section) => {
            const entries = section.entries.filter(isAllowed);
            if (entries.length === 0) return null;
            return (
              <div key={section.id} className={section.label ? "mt-4" : "mt-1"}>
                {section.label ? <p className="px-2.5 pb-1.5 text-[12.5px] font-medium text-[var(--wt-sidebar-text-faint)]">{section.label}</p> : null}
                <div className="space-y-0.5">
                  {entries.map((entry) => {
                    if (entry.children) {
                      const children = entry.children.filter((c) => allowed.has(c.navId));
                      if (children.length === 0) return null;
                      const reportActive = activeSection.startsWith("reports-");
                      const open = reportsOpen || reportActive;
                      const Icon = entry.icon;
                      return (
                        <div key={entry.navId}>
                          <button
                            type="button"
                            onClick={() => setReportsOpen((v) => !v)}
                            aria-expanded={open}
                            className={cn(
                              "flex h-9 w-full items-center gap-3 rounded-xl border px-2.5 text-left text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
                              reportActive && !open
                                ? "border-[var(--wt-sidebar-border)] bg-[var(--wt-sidebar-active-bg)] shadow-[var(--wt-shadow-sm)]"
                                : "border-transparent hover:bg-[var(--wt-sidebar-hover-bg)]"
                            )}
                          >
                            <Icon className={cn("size-[18px] shrink-0", reportActive ? "text-[var(--wt-brand)]" : "text-[var(--wt-sidebar-text-muted)]")} strokeWidth={1.75} aria-hidden />
                            <span className="min-w-0 flex-1 truncate text-[var(--wt-sidebar-text)]">{entry.label}</span>
                            <ChevronDown className={cn("size-4 text-[var(--wt-sidebar-text-faint)] transition-transform", open && "rotate-180")} aria-hidden />
                          </button>
                          {open ? (
                            <div className="ml-[1.35rem] mt-0.5 space-y-0.5 border-l border-[var(--wt-sidebar-border)] pl-2.5">
                              {children.map((child) => {
                                const active = activeSection === child.navId;
                                return (
                                  <Link
                                    prefetch={false}
                                    key={child.navId}
                                    href={dashboardHref(child.navId)}
                                    onClick={closeMobileNav}
                                    className={cn(
                                      "block rounded-lg px-2.5 py-1.5 text-[13px] transition-colors",
                                      active ? "bg-[var(--wt-sidebar-active-bg)] font-semibold text-[var(--wt-brand)] shadow-[var(--wt-shadow-sm)]" : "text-[var(--wt-sidebar-text-muted)] hover:bg-[var(--wt-sidebar-hover-bg)] hover:text-[var(--wt-sidebar-text)]"
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    }
                    const count = entry.badge ? badges[entry.badge] : null;
                    return (
                      <EntryLink
                        key={entry.navId}
                        entry={entry}
                        href={dashboardHref(entry.navId)}
                        active={activeFor(entry)}
                        onNavigate={closeMobileNav}
                        badge={entry.badge && count ? <Badge kind={entry.badge} value={count} /> : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-[var(--wt-sidebar-border)] px-3 pb-3 pt-2.5">
          <div className="space-y-0.5">
            {APP_NAV_FOOTER.filter(isAllowed).map((entry) => (
              <EntryLink key={entry.navId} entry={entry} href={dashboardHref(entry.navId)} active={!isLearningRoute && isNavChildActive(entry.navId)} onNavigate={closeMobileNav} />
            ))}
          </div>
          {accountSlot}
          <div className="rounded-xl border border-[var(--wt-sidebar-border)] bg-[var(--wt-sidebar-active-bg)] p-1 shadow-[var(--wt-shadow-sm)]">
            <AccountMenu
              profile={profile}
              user={user}
              displayName={displayName}
              roleLabel={roleLabel}
              canAccessProfile={canAccessProfile}
              isOffboarded={isOffboarded}
              onLogout={onLogout}
              onNavigate={closeMobileNav}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
