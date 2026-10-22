"use client";

import Link from "next/link";
import { useSidebarCollapsed } from "@/lib/sidebarPreference";
import { X, PanelLeftClose, PanelLeftOpen, UserRound, UsersRound, FolderKanban, GraduationCap, Building2, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect, useSyncExternalStore, type ReactNode } from "react";

import { AccountMenu } from "@/components/dashboard/AccountMenu";
import { SIDEBAR_BACKDROP_CLASS } from "@/components/dashboard/ui/sidebarLayout";
import { APP_NAV_FOOTER, APP_NAVIGATION, type AppNavEntry } from "@/constants/sidebarNavigation";
import { dashboardHref } from "@/constants/routes";
import type { NavItem } from "@/constants/dashboardNavigation";
import type { SidebarBadges } from "@/hooks/navigation/useSidebarBadges";
import { cn } from "@/lib/utils";

function subscribeDesktop(update: () => void) {
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
}
function readDesktop() { return window.matchMedia("(min-width: 1024px)").matches; }

const SECTION_ICONS = { me: UserRound, team: UsersRound, work: FolderKanban, grow: GraduationCap, workplace: Building2, admin: ShieldCheck };

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
      aria-label={entry.label}
      title={entry.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
        active
          ? "bg-[var(--wt-sidebar-active-bg)] font-semibold text-[var(--wt-sidebar-active-text)]"
          : "text-[var(--wt-sidebar-text-muted)] hover:bg-[var(--wt-sidebar-hover-bg)] hover:text-[var(--wt-sidebar-text)]"
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-[var(--wt-sidebar-active-text)]" : "text-[var(--wt-sidebar-text-faint)]")} strokeWidth={1.75} aria-hidden />
      <span data-nav-label className="min-w-0 flex-1 truncate">{entry.label}</span>
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

/** Brand-navy navigation with collapsible groups, role-filtered links and a pinned account menu. */
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
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const isDesktop = useSyncExternalStore(subscribeDesktop, readDesktop, () => true);
  const asideRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!isDesktop && mobileNavOpen) asideRef.current?.querySelector<HTMLButtonElement>("[data-close-nav]")?.focus();
  }, [isDesktop, mobileNavOpen]);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => { navRef.current?.scrollTo({ top: 0, behavior: "instant" }); }, [collapsed]);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
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
        ref={asideRef}
        inert={!isDesktop && !mobileNavOpen}
        aria-hidden={!isDesktop && !mobileNavOpen ? true : undefined}
        role={!isDesktop && mobileNavOpen ? "dialog" : undefined}
        aria-modal={!isDesktop && mobileNavOpen ? true : undefined}
        aria-label="Workspace navigation"
        onKeyDown={(event) => {
          if (isDesktop || !mobileNavOpen || event.key !== "Tab") return;
          const controls = Array.from(asideRef.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input,select,[tabindex="0"]') ?? []).filter((element) => element.getClientRects().length > 0);
          const first = controls[0]; const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        data-collapsed={collapsed}
        className={cn(
          "wt-appsidebar z-40 flex h-dvh w-[16rem] shrink-0 flex-col border-r border-[var(--wt-sidebar-border)] bg-[var(--wt-sidebar-bg)] transition-[width,transform] duration-200 ease-out",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[min(88vw,300px)]",
          mobileNavOpen ? "max-lg:translate-x-0 max-lg:shadow-[0_24px_64px_rgba(0,0,0,0.3)]" : "max-lg:pointer-events-none max-lg:-translate-x-full"
        )}
      >
        <div className="wt-sidebar-brand flex items-center gap-3 border-b border-[var(--wt-sidebar-border)] px-5 py-6">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--wt-sidebar-border)] bg-white" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element -- a 25px static mark; next/image adds nothing */}
            <img src="/webtrak-logo.png" alt="" className="h-[18px] w-auto" />
          </span>
          <span data-nav-label className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[17px] font-semibold tracking-[-0.01em] text-[var(--wt-sidebar-text)]">WebTrak</span>
            <span className="block truncate text-[11.5px] text-[var(--wt-sidebar-text-faint)]">WebKnot Technologies</span>
          </span>
          <button data-close-nav type="button" onClick={closeMobileNav} aria-label="Close navigation" className="ml-auto grid size-9 shrink-0 place-items-center rounded-lg text-[var(--wt-sidebar-text)] hover:bg-[var(--wt-sidebar-hover-bg)] lg:hidden"><X className="size-5" /></button>
        </div>

        <button type="button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} className="mx-4 mt-3 hidden h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--wt-sidebar-border)] text-xs text-[var(--wt-sidebar-text-muted)] hover:bg-[var(--wt-sidebar-hover-bg)] lg:flex">
          {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" /><span>Collapse navigation</span></>}
        </button>
        <nav ref={navRef} className="wt-sidebar-nav min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3" aria-label="Main navigation">
          {APP_NAVIGATION.map((section) => {
            const entries = section.entries.filter(isAllowed);
            if (entries.length === 0) return null;
            const SectionIcon = SECTION_ICONS[section.id as keyof typeof SECTION_ICONS] ?? FolderKanban;
            const sectionCount = entries.reduce((total, entry) => total + (entry.badge ? badges[entry.badge] ?? 0 : 0), 0);
            const sectionActive = entries.some((entry) => activeFor(entry) || entry.children?.some((child) => activeSection === child.navId));
            return (
              <div key={section.id} className={cn("wt-nav-section", section.label ? "mt-5" : "mt-1")}>
                {section.label ? (
                  <button type="button" aria-expanded={!(isDesktop && collapsed) && !collapsedSections[section.id]} aria-controls={`navigation-${section.id}`} aria-label={`${section.label} navigation`} onClick={() => { if (isDesktop && collapsed) { setCollapsed(false); setCollapsedSections(Object.fromEntries(APP_NAVIGATION.map((group) => [group.id, group.id !== section.id]))); } else setCollapsedSections((previous) => ({ ...previous, [section.id]: !previous[section.id] })); }} title={`${section.label} navigation`} data-section-active={sectionActive} className="wt-nav-group mb-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--wt-sidebar-text-faint)] transition-colors hover:text-[var(--wt-sidebar-text)]">
                    <SectionIcon className="size-3.5 shrink-0" aria-hidden /><span data-nav-label className="flex-1 text-left">{section.label}</span>{sectionCount > 0 ? <span className="wt-section-badge" aria-label={`${sectionCount} unresolved items`}>{sectionCount > 99 ? "99+" : sectionCount}</span> : null}
                  </button>
                ) : null}
                <div id={`navigation-${section.id}`} hidden={Boolean(collapsedSections[section.id]) && !(isDesktop && collapsed)} className={cn("space-y-1", section.label && "wt-nav-section-items")}>
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
                            onClick={() => { if (collapsed) setCollapsed(false); setReportsOpen((v) => !v); }}
                            aria-expanded={open}
                            aria-label="Reports"
                            title="Reports"
                            className={cn(
                              "flex h-10 w-full items-center gap-2.5 rounded-lg border px-2.5 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
                              reportActive && !open
                                ? "border-transparent bg-[var(--wt-sidebar-active-bg)] text-[var(--wt-brand)]"
                                : "border-transparent hover:bg-[var(--wt-sidebar-hover-bg)]"
                            )}
                          >
                            <Icon className={cn("size-4 shrink-0", reportActive ? "text-[var(--wt-brand)]" : "text-[var(--wt-sidebar-text-faint)]")} strokeWidth={1.75} aria-hidden />
                            <span data-nav-label className="min-w-0 flex-1 truncate text-[var(--wt-sidebar-text-muted)]">{entry.label}</span>
                          </button>
                          {open ? (
                            <div className="wt-report-children ml-[1.35rem] mt-0.5 space-y-0.5 border-l border-[var(--wt-sidebar-border)] pl-2.5">
                              {children.map((child) => {
                                const active = activeSection === child.navId;
                                return (
                                  <Link
                                    prefetch={false}
                                    key={child.navId}
                                    href={dashboardHref(child.navId)}
                                    aria-current={active ? "page" : undefined}
                                    onClick={closeMobileNav}
                                    className={cn(
                                      "block rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors",
                                      active ? "bg-[var(--wt-sidebar-active-bg)] font-semibold text-[var(--wt-sidebar-active-text)]" : "text-[var(--wt-sidebar-text-muted)] hover:bg-[var(--wt-sidebar-hover-bg)] hover:text-[var(--wt-sidebar-text)]"
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
          <div className="space-y-1">
            {APP_NAV_FOOTER.filter(isAllowed).map((entry) => (
              <EntryLink key={entry.navId} entry={entry} href={dashboardHref(entry.navId)} active={!isLearningRoute && isNavChildActive(entry.navId)} onNavigate={closeMobileNav} />
            ))}
          </div>
          <div className="wt-sidebar-role">{accountSlot}</div>
          <div className="rounded-xl border border-[var(--wt-sidebar-border)] bg-[var(--wt-sidebar-hover-bg)] p-1 shadow-[var(--wt-shadow-sm)]">
            <AccountMenu
              collapsed={collapsed}
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
