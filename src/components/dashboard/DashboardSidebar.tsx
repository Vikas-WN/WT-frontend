"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WebTrakBrand } from "@/components/shared/WebTrakBrand";
import { dashboardHref } from "@/constants/routes";
import { learningSubNav, LEARNING_BASE } from "@/constants/learningNav";
import type { NavItem, AccordionSectionId } from "@/constants/dashboardNavigation";
import { SidebarIcon } from "@/constants/sidebarIcons";
import { AccountMenu } from "@/components/dashboard/AccountMenu";
import {
  SIDEBAR_CHILD_ICON_WRAP,
  SIDEBAR_COLLAPSE_TOGGLE_CLASS,
  SIDEBAR_FLYOUT_CLASS,
  SIDEBAR_FLYOUT_TITLE_CLASS,
  SIDEBAR_FOOTER_CLASS,
  SIDEBAR_GROUP_STACK_CLASS,
  SIDEBAR_ICON_WRAP,
  SIDEBAR_NAV_CLASS,
  sidebarBrandWrapClass,
  sidebarBrandRowClass,
  sidebarChildBlockClass,
  sidebarChildNavClass,
  sidebarChildrenWrapClass,
  sidebarFooterCardClass,
  sidebarFooterRowClass,
  sidebarNavLabelClass,
  sidebarParentNavClass,
  sidebarShellClass,
  SIDEBAR_BACKDROP_CLASS,
} from "@/components/dashboard/ui/sidebarLayout";

function IconChevronLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SidebarNavGroup({
  className,
  onHoverOpen,
  onHoverClose,
  children,
}: {
  className?: string;
  onHoverOpen?: () => void;
  onHoverClose?: () => void;
  children: (anchorRef: RefObject<HTMLDivElement | null>) => ReactNode;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={anchorRef}
      className={className}
      onMouseEnter={onHoverOpen}
      onMouseLeave={onHoverClose}
    >
      {children(anchorRef)}
    </div>
  );
}

function SidebarFlyout({
  title,
  open,
  anchorRef,
  onClose,
  onHoverOpen,
  onHoverClose,
  children,
}: {
  title: string;
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onHoverOpen?: () => void;
  onHoverClose?: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setCoords(null);
      return;
    }
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelHeight = panelRef.current?.offsetHeight ?? 240;
      const maxTop = Math.max(8, window.innerHeight - panelHeight - 8);
      setCoords({
        top: Math.min(Math.max(8, rect.top), maxTop),
        left: rect.right + 10,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, open, onClose]);

  if (!mounted || !open || !coords) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={cn(
        SIDEBAR_FLYOUT_CLASS,
        "fixed z-[80] ml-0 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1 duration-150"
      )}
      style={{ top: coords.top, left: coords.left }}
      role="menu"
      aria-label={title}
      onMouseEnter={onHoverOpen}
      onMouseLeave={onHoverClose}
    >
      <p className={SIDEBAR_FLYOUT_TITLE_CLASS}>{title}</p>
      <div className="max-h-[min(70vh,420px)] space-y-0.5 overflow-y-auto">{children}</div>
    </div>,
    document.body
  );
}

type DashboardSidebarProps = {
  visibleNavigation: NavItem[];
  activeSection: string;
  expandedSection: AccordionSectionId | null;
  toggleExpandedSection: (section: AccordionSectionId) => void;
  isLearningRoute: boolean;
  isNavChildActive: (childId: string) => boolean;
  mobileNavOpen: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  closeMobileNav: () => void;
  user: { name?: string | null; email?: string | null } | null;
  profile: { name?: string | null } | null | undefined;
  sidebarDisplayName: string;
  canAccessProfile: boolean;
  isOffboarded: boolean;
  onLogout: () => void | Promise<void>;
};

export function DashboardSidebar({
  visibleNavigation,
  activeSection,
  expandedSection,
  toggleExpandedSection,
  isLearningRoute,
  isNavChildActive,
  mobileNavOpen,
  collapsed,
  onToggleCollapsed,
  closeMobileNav,
  user,
  profile,
  sidebarDisplayName,
  canAccessProfile,
  isOffboarded,
  onLogout,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [flyoutId, setFlyoutId] = useState<AccordionSectionId | null>(null);
  const showCollapsed = collapsed && !mobileNavOpen;
  const flyoutCloseTimer = useRef<number | null>(null);

  const clearFlyoutTimer = useCallback(() => {
    if (flyoutCloseTimer.current != null) {
      window.clearTimeout(flyoutCloseTimer.current);
      flyoutCloseTimer.current = null;
    }
  }, []);

  const closeFlyout = useCallback(() => {
    clearFlyoutTimer();
    setFlyoutId(null);
  }, [clearFlyoutTimer]);

  const openFlyout = useCallback(
    (id: AccordionSectionId) => {
      clearFlyoutTimer();
      setFlyoutId(id);
    },
    [clearFlyoutTimer]
  );

  const scheduleCloseFlyout = useCallback(() => {
    clearFlyoutTimer();
    flyoutCloseTimer.current = window.setTimeout(() => {
      setFlyoutId(null);
      flyoutCloseTimer.current = null;
    }, 160);
  }, [clearFlyoutTimer]);

  useEffect(() => {
    setFlyoutId(null);
  }, [pathname, collapsed]);

  useEffect(() => () => clearFlyoutTimer(), [clearFlyoutTimer]);

  const handleGroupToggle = (id: AccordionSectionId) => {
    if (showCollapsed) {
      setFlyoutId((current) => (current === id ? null : id));
      return;
    }
    toggleExpandedSection(id);
  };

  const renderFlyoutChild = (child: { id: string; label: string }, active: boolean) => (
    <Link
      prefetch={false}
      key={child.id}
      href={dashboardHref(child.id)}
      onClick={() => {
        closeFlyout();
        closeMobileNav();
      }}
      className={sidebarChildBlockClass(active)}
      role="menuitem"
    >
      {child.label}
    </Link>
  );

  return (
    <>
      {mobileNavOpen ? (
        <button
          type="button"
          className={SIDEBAR_BACKDROP_CLASS}
          aria-label="Close navigation"
          onClick={closeMobileNav}
        />
      ) : null}
      <aside className={cn(sidebarShellClass(mobileNavOpen, collapsed), "max-lg:w-[min(88vw,280px)]")}>
        <div className={sidebarBrandWrapClass(showCollapsed)}>
          <div className={sidebarBrandRowClass(showCollapsed)}>
            {showCollapsed ? (
              <div className="flex w-full flex-col items-center gap-2 lg:gap-2.5">
                <WebTrakBrand variant="sidebar" compact className="w-full" />
                <button
                  type="button"
                  className={SIDEBAR_COLLAPSE_TOGGLE_CLASS}
                  onClick={onToggleCollapsed}
                  aria-label="Expand sidebar"
                  aria-expanded={false}
                >
                  <IconChevronRight className="size-4" />
                </button>
              </div>
            ) : (
              <>
                <WebTrakBrand variant="sidebar" className="min-w-0 flex-1" />
                <button
                  type="button"
                  className={SIDEBAR_COLLAPSE_TOGGLE_CLASS}
                  onClick={onToggleCollapsed}
                  aria-label="Collapse sidebar"
                  aria-expanded
                >
                  <IconChevronLeft className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <nav
          className={cn(SIDEBAR_NAV_CLASS, showCollapsed && "lg:overflow-visible")}
          aria-label="Main navigation"
        >
          {visibleNavigation.map((item) => {
            if (item.kind === "group") {
              const isExpanded = expandedSection === item.id;
              const groupActive = item.children.some((child) => isNavChildActive(child.id));
              return (
                <SidebarNavGroup
                  key={item.id}
                  className={cn(SIDEBAR_GROUP_STACK_CLASS, "relative")}
                  onHoverOpen={showCollapsed ? () => openFlyout(item.id) : undefined}
                  onHoverClose={showCollapsed ? scheduleCloseFlyout : undefined}
                >
                  {(anchorRef) => (
                    <>
                      <button
                        type="button"
                        title={showCollapsed ? item.label : undefined}
                        className={sidebarParentNavClass(!isLearningRoute && groupActive, {
                          collapsed: showCollapsed,
                          extra: "cursor-pointer justify-start",
                        })}
                        onClick={() => handleGroupToggle(item.id)}
                        aria-expanded={showCollapsed ? flyoutId === item.id : isExpanded}
                      >
                        <SidebarIcon name={item.icon} className={SIDEBAR_ICON_WRAP} />
                        <span className={sidebarNavLabelClass(showCollapsed)}>{item.label}</span>
                        {!showCollapsed ? (
                          <SidebarIcon
                            name={isExpanded ? "chevronDown" : "chevronRight"}
                            className={cn(SIDEBAR_ICON_WRAP, "ml-auto opacity-45")}
                          />
                        ) : null}
                      </button>
                      {showCollapsed ? (
                        <SidebarFlyout
                          title={item.label}
                          open={flyoutId === item.id}
                          anchorRef={anchorRef}
                          onClose={closeFlyout}
                          onHoverOpen={() => openFlyout(item.id)}
                          onHoverClose={scheduleCloseFlyout}
                        >
                          {item.children.map((child) =>
                            renderFlyoutChild(child, !isLearningRoute && isNavChildActive(child.id))
                          )}
                        </SidebarFlyout>
                      ) : isExpanded ? (
                        <div className={sidebarChildrenWrapClass(showCollapsed)}>
                          {item.children.map((child) => (
                            <Link
                              prefetch={false}
                              key={child.id}
                              href={dashboardHref(child.id)}
                              onClick={closeMobileNav}
                              className={sidebarChildNavClass(!isLearningRoute && isNavChildActive(child.id), {
                                collapsed: showCollapsed,
                              })}
                            >
                              <SidebarIcon name={child.icon} className={SIDEBAR_CHILD_ICON_WRAP} />
                              <span className={sidebarNavLabelClass(showCollapsed)}>{child.label}</span>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </SidebarNavGroup>
              );
            }

            if (item.kind === "expandable" && item.id === "reports") {
              const children = item.children;
              const isExpanded = expandedSection === "reports";
              const groupActive = activeSection.startsWith("reports-");
              return (
                <SidebarNavGroup
                  key={item.id}
                  className={cn(SIDEBAR_GROUP_STACK_CLASS, "relative")}
                  onHoverOpen={showCollapsed ? () => openFlyout("reports") : undefined}
                  onHoverClose={showCollapsed ? scheduleCloseFlyout : undefined}
                >
                  {(anchorRef) => (
                    <>
                      <button
                        type="button"
                        title={showCollapsed ? item.label : undefined}
                        className={sidebarParentNavClass(!isLearningRoute && groupActive, {
                          collapsed: showCollapsed,
                          extra: "cursor-pointer justify-start",
                        })}
                        onClick={() => handleGroupToggle("reports")}
                        aria-expanded={showCollapsed ? flyoutId === "reports" : isExpanded}
                      >
                        <SidebarIcon name={item.icon} className={SIDEBAR_ICON_WRAP} />
                        <span className={sidebarNavLabelClass(showCollapsed)}>{item.label}</span>
                        {!showCollapsed ? (
                          <SidebarIcon
                            name={isExpanded ? "chevronDown" : "chevronRight"}
                            className={cn(SIDEBAR_ICON_WRAP, "ml-auto opacity-45")}
                          />
                        ) : null}
                      </button>
                      {showCollapsed ? (
                        <SidebarFlyout
                          title={item.label}
                          open={flyoutId === "reports"}
                          anchorRef={anchorRef}
                          onClose={closeFlyout}
                          onHoverOpen={() => openFlyout("reports")}
                          onHoverClose={scheduleCloseFlyout}
                        >
                          {children.map((child) =>
                            renderFlyoutChild(child, !isLearningRoute && activeSection === child.id)
                          )}
                        </SidebarFlyout>
                      ) : isExpanded ? (
                        <div className={sidebarChildrenWrapClass(showCollapsed)}>
                          {children.map((child) => (
                            <Link
                              prefetch={false}
                              key={child.id}
                              href={dashboardHref(child.id)}
                              onClick={closeMobileNav}
                              className={sidebarChildBlockClass(!isLearningRoute && activeSection === child.id)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </SidebarNavGroup>
              );
            }

            if (item.kind === "expandable" && item.id === "learning") {
              const isExpanded = expandedSection === "learning";
              return (
                <SidebarNavGroup
                  key={item.id}
                  className={cn(SIDEBAR_GROUP_STACK_CLASS, "relative")}
                  onHoverOpen={showCollapsed ? () => openFlyout("learning") : undefined}
                  onHoverClose={showCollapsed ? scheduleCloseFlyout : undefined}
                >
                  {(anchorRef) => (
                    <>
                      <button
                        type="button"
                        title={showCollapsed ? item.label : undefined}
                        className={sidebarParentNavClass(isLearningRoute, {
                          collapsed: showCollapsed,
                          extra: "cursor-pointer justify-start",
                        })}
                        onClick={() => handleGroupToggle("learning")}
                        aria-expanded={showCollapsed ? flyoutId === "learning" : isExpanded}
                      >
                        <SidebarIcon name={item.icon} className={SIDEBAR_ICON_WRAP} />
                        <span className={sidebarNavLabelClass(showCollapsed)}>{item.label}</span>
                        {!showCollapsed ? (
                          <SidebarIcon
                            name={isExpanded ? "chevronDown" : "chevronRight"}
                            className={cn(SIDEBAR_ICON_WRAP, "ml-auto opacity-45")}
                          />
                        ) : null}
                      </button>
                      {showCollapsed ? (
                        <SidebarFlyout
                          title={item.label}
                          open={flyoutId === "learning"}
                          anchorRef={anchorRef}
                          onClose={closeFlyout}
                          onHoverOpen={() => openFlyout("learning")}
                          onHoverClose={scheduleCloseFlyout}
                        >
                          {learningSubNav.map((link) => {
                            const active =
                              pathname === link.href ||
                              (link.href === LEARNING_BASE
                                ? pathname === LEARNING_BASE ||
                                  pathname === `${LEARNING_BASE}/` ||
                                  pathname.startsWith(`${LEARNING_BASE}/trainings`)
                                : pathname.startsWith(`${link.href}/`) || pathname.startsWith(link.href));
                            return (
                              <Link
                                prefetch={false}
                                key={link.href}
                                href={link.href}
                                onClick={() => {
                                  closeFlyout();
                                  closeMobileNav();
                                }}
                                className={sidebarChildBlockClass(active)}
                                role="menuitem"
                              >
                                {link.label}
                              </Link>
                            );
                          })}
                        </SidebarFlyout>
                      ) : isExpanded ? (
                        <div className={sidebarChildrenWrapClass(showCollapsed)}>
                          {learningSubNav.map((link) => {
                            const active =
                              pathname === link.href ||
                              (link.href === LEARNING_BASE
                                ? pathname === LEARNING_BASE ||
                                  pathname === `${LEARNING_BASE}/` ||
                                  pathname.startsWith(`${LEARNING_BASE}/trainings`)
                                : pathname.startsWith(`${link.href}/`) || pathname.startsWith(link.href));
                            return (
                              <Link
                                prefetch={false}
                                key={link.href}
                                href={link.href}
                                onClick={closeMobileNav}
                                className={sidebarChildBlockClass(active)}
                              >
                                {link.label}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </>
                  )}
                </SidebarNavGroup>
              );
            }

            if (item.kind === "link") {
              return (
                <Link
                  prefetch={false}
                  key={item.id}
                  href={dashboardHref(item.id)}
                  title={showCollapsed ? item.label : undefined}
                  onClick={closeMobileNav}
                  className={sidebarParentNavClass(!isLearningRoute && activeSection === item.id, {
                    collapsed: showCollapsed,
                  })}
                >
                  <SidebarIcon name={item.icon} className={SIDEBAR_ICON_WRAP} />
                  <span className={sidebarNavLabelClass(showCollapsed)}>{item.label}</span>
                </Link>
              );
            }

            return null;
          })}
        </nav>

        {user ? (
          <div className={SIDEBAR_FOOTER_CLASS}>
            <div className={cn(sidebarFooterCardClass(showCollapsed), "wt-account-footer")}>
              <div className={sidebarFooterRowClass(showCollapsed)}>
                <AccountMenu
                  profile={profile}
                  user={user}
                  displayName={sidebarDisplayName}
                  canAccessProfile={canAccessProfile}
                  isOffboarded={isOffboarded}
                  collapsed={showCollapsed}
                  placement="sidebar"
                  onLogout={onLogout}
                  onNavigate={closeMobileNav}
                />
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
