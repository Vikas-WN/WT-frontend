"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { hrmsService, type NotificationItem } from "@/services/hrms.service";
import {
  formatNotificationTimestamp,
  notificationIsRead,
  notificationMessage,
  notificationRowId,
  notificationTitle,
  parseNotificationItems,
} from "@/utils/notifications";
import {
  notificationCategoryLabel,
  resolveNotificationHref,
} from "@/utils/notificationNavigation";
import {
  dashboardNavigation,
  filterVisibleNavigation,
  dashboardPageTitle,
  getDashboardSectionLabel,
} from "@/constants/dashboardNavigation";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { cleanEmployeeName } from "@/utils/employeeDirectory";
import { shouldSkipSelfProfileFetch } from "@/utils/selfProfile";
import { selfProfileQueryKey } from "@/hooks/useSelfProfile";
import { dashboardHref, DASHBOARD_ROUTES, isDashboardNavChildActive } from "@/constants/routes";
import { learningSubNav } from "@/constants/learningNav";
import { useDashboardNav } from "@/components/dashboard/DashboardNavContext";

import { applyResolvedTheme, readStoredTheme } from "@/utils/dashboard/theme";
import { readSidebarCollapsed, writeSidebarCollapsed } from "@/utils/dashboard/sidebarPrefs";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { LogoutConfirmDialog } from "@/components/auth/LogoutConfirmDialog";
import { WebTrakBrand } from "@/components/shared/WebTrakBrand";
import {
  DASHBOARD_HEADER_CLASS,
  DASHBOARD_HEADER_MENU_BUTTON_CLASS,
} from "@/components/dashboard/ui/sidebarLayout";

const HEADER_ICON_BUTTON_CLASS =
  "flex size-10 cursor-pointer items-center justify-center rounded-xl border border-wt-border bg-wt-surface-1 text-wt-text transition-[background-color,border-color] duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:bg-wt-surface-2 dark:border-wt-border dark:bg-wt-surface-2 dark:hover:bg-wt-surface-3";

function IconMenu({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function IconBell({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconMoon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function IconSun({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function extractRoleFromNotificationMessage(message: string): string {
  const pipeMatch = message.match(/\|\s*([^|]+?)\s+submitted/i);
  if (pipeMatch?.[1]) return pipeMatch[1].trim();
  const roleWordMatch = message.match(/\b(HR|Manager|Employee|Emp|Admin|Finance)\b/i);
  return roleWordMatch?.[1] ? roleWordMatch[1].trim() : "—";
}

export function DashboardChrome({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    activeSection,
    expandedSection,
    toggleExpandedSection,
  } = useDashboardNav();

  const userRoles = user?.roles ?? [];
  const hasHrAccess = userRoles.includes("ROLE_HR") || userRoles.includes("ROLE_ADMIN");
  const hasManagerAccess = userRoles.includes("ROLE_MANAGER");
  const hasDmAccess = userRoles.includes("ROLE_DM");
  const hasAccountManagerAccess = userRoles.includes("ROLE_AM");
  const canAccessProfile = Boolean(user) && !shouldSkipSelfProfileFetch(userRoles);
  const isEmployeeDirectoryRoute = pathname.startsWith("/dashboard/employee-directory");
  const isEmployeeOnboardingRoute =
    pathname === DASHBOARD_ROUTES.employee ||
    pathname.startsWith(`${DASHBOARD_ROUTES.employee}/`);
  const isEmployeeProfileRoute = Boolean(pathname.match(/^\/dashboard\/employee-directory\/[^/]+$/));
  const isHrPortalUser =
    (userRoles.includes("ROLE_HR") || userRoles.includes("ROLE_ADMIN")) &&
    !userRoles.includes("ROLE_EMPLOYEE");
  const { isOffboarded, isServingNotice, requiresExitSurvey, profile } = useDashboardAccess();

  const navChildActiveOptions = useMemo(
    () => ({ hasHrAccess, hasManagerAccess, hasDmAccess }),
    [hasDmAccess, hasHrAccess, hasManagerAccess]
  );

  const isNavChildActive = useCallback(
    (childId: string) =>
      isDashboardNavChildActive(childId, activeSection, pathname, navChildActiveOptions),
    [activeSection, navChildActiveOptions, pathname]
  );

  const visibleNavigation = useMemo(() => {
    return filterVisibleNavigation(dashboardNavigation, userRoles, {
      hasHrAccess,
      hasAccountManagerAccess,
      showExitSurveyNav: requiresExitSurvey,
    });
  }, [userRoles, hasHrAccess, hasAccountManagerAccess, requiresExitSurvey]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(readStoredTheme);
  const [actionLoading, setActionLoading] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const notificationsPanelRef = useRef<HTMLDetailsElement>(null);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((current) => {
      const next = !current;
      writeSidebarCollapsed(next);
      return next;
    });
  }, []);

  const requestLogout = useCallback(() => {
    setLogoutConfirmOpen(true);
  }, []);

  const cancelLogout = useCallback(() => {
    if (logoutLoading) return;
    setLogoutConfirmOpen(false);
  }, [logoutLoading]);

  const confirmLogout = useCallback(async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await logout();
    } finally {
      setLogoutLoading(false);
      setLogoutConfirmOpen(false);
    }
  }, [logout, logoutLoading]);

  useEffect(() => {
    setSidebarCollapsed(readSidebarCollapsed());
  }, []);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationsPanelRef.current?.contains(target)) return;

      if (notificationsPanelRef.current?.open) {
        notificationsPanelRef.current.open = false;
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    applyResolvedTheme(theme);
    try {
      window.localStorage.setItem("wt-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const res = await hrmsService.getNotifications({ page: "0", size: "20" });
      const items = parseNotificationItems(res.data ?? res);
      setNotifications(items);
      if (
        items.some(
          (row) =>
            String(row.type ?? "").toUpperCase() === "EXIT_INTERVIEW_REMINDER" &&
            !notificationIsRead(row)
        )
      ) {
        void queryClient.invalidateQueries({ queryKey: selfProfileQueryKey(user?.email) });
      }
    } catch (error) {
      setNotifications([]);
      setNotificationsError(
        error instanceof Error ? error.message : "Could not load notifications."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, [queryClient, user?.email]);

  const handleNotificationClick = useCallback(
    async (row: NotificationItem) => {
      const href = resolveNotificationHref(row, { userRoles });
      if (!href) return;

      const id = notificationRowId(row);
      if (id && !notificationIsRead(row)) {
        try {
          await hrmsService.markNotificationRead(id);
          setNotifications((current) =>
            current.map((item) =>
              notificationRowId(item) === id ? { ...item, is_read: true } : item
            )
          );
        } catch {
          /* Navigate even if mark-read fails */
        }
      }

      if (notificationsPanelRef.current) {
        notificationsPanelRef.current.open = false;
      }
      router.push(href);
    },
    [router, userRoles]
  );

  useEffect(() => {
    void loadNotifications();
    // Soft poll — avoid competing with page data fetches on every focus.
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 120_000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadNotifications]);

  const runAction = useCallback(async (label: string, fn: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await fn();
    } finally {
      setActionLoading(false);
    }
  }, []);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((row) => !notificationIsRead(row)).length,
    [notifications]
  );

  const isLearningRoute = pathname.startsWith("/dashboard/learning-development");

  const pageTitle = useMemo(() => {
    if (isOffboarded && !isLearningRoute) {
      return "You Are Offboarded";
    }
    if (isLearningRoute) {
      return "Learning & Development";
    }
    if (pathname.includes("/dashboard/leave/team")) {
      return getDashboardSectionLabel("leave-team") ?? "Leave Requests";
    }
    return dashboardPageTitle(activeSection);
  }, [
    activeSection,
    hasDmAccess,
    hasHrAccess,
    hasManagerAccess,
    isLearningRoute,
    isNavChildActive,
    isOffboarded,
    pathname,
  ]);

  const learningSectionTitle = useMemo(() => {
    const hit = learningSubNav.find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`));
    return hit?.label ?? "Learning & Development";
  }, [pathname]);

  const sidebarDisplayName = useMemo(() => {
    if (profile && typeof profile === "object") {
      const fromProfile = cleanEmployeeName(profile as Record<string, unknown>).trim();
      if (fromProfile) return fromProfile;
    }
    const name = String(profile?.name ?? user?.name ?? user?.email ?? "").trim();
    return name || "Profile";
  }, [profile, user?.email, user?.name]);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    setMobileNavOpen(false);
    if (notificationsPanelRef.current?.open) {
      notificationsPanelRef.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  return (
    <div className="flex h-dvh overflow-hidden text-wt-text">
      <DashboardSidebar
        visibleNavigation={visibleNavigation}
        activeSection={activeSection}
        expandedSection={expandedSection}
        toggleExpandedSection={toggleExpandedSection}
        isLearningRoute={isLearningRoute}
        isNavChildActive={isNavChildActive}
        mobileNavOpen={mobileNavOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        closeMobileNav={closeMobileNav}
        user={user}
        profile={profile}
        sidebarDisplayName={sidebarDisplayName}
        canAccessProfile={canAccessProfile}
        isOffboarded={isOffboarded}
        onLogout={requestLogout}
      />

      <LogoutConfirmDialog
        open={logoutConfirmOpen}
        loading={logoutLoading}
        onCancel={cancelLogout}
        onConfirm={() => void confirmLogout()}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-wt-page-bg dark:bg-black">
        <header className={DASHBOARD_HEADER_CLASS}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className={DASHBOARD_HEADER_MENU_BUTTON_CLASS}
              aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              <IconMenu />
            </button>
            <WebTrakBrand variant="header" compact className="shrink-0 lg:hidden" />
            <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight text-wt-text sm:text-[1.35rem]">
              {pageTitle}
            </h2>
            {isEmployeeDirectoryRoute && !isLearningRoute && !isEmployeeOnboardingRoute ? (
              <nav
                className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-wt-text-muted"
                aria-label="Breadcrumb"
              >
                <Link prefetch={false} href="/dashboard" className="hover:text-wt-text transition">
                  Dashboard
                </Link>
                <span aria-hidden>/</span>
                {isEmployeeProfileRoute ? (
                  <>
                    <Link
                      prefetch={false}
                      href={DASHBOARD_ROUTES["employee-directory"]}
                      className="hover:text-wt-text transition"
                    >
                      Employee Directory
                    </Link>
                    <span aria-hidden>/</span>
                    <span className="text-wt-text">Employee Profile</span>
                  </>
                ) : (
                  <span className="text-wt-text">Employee Directory</span>
                )}
              </nav>
            ) : isLearningRoute ? (
              <p className="text-xs text-wt-text-muted">{learningSectionTitle}</p>
            ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <details
              ref={notificationsPanelRef}
              className="group relative"
              onToggle={(e) => {
                const el = e.currentTarget as HTMLDetailsElement;
                if (el.open) {
                  void loadNotifications().catch(() => setNotifications([]));
                }
              }}
            >
              <summary className={`relative cursor-pointer list-none ${HEADER_ICON_BUTTON_CLASS} [&::-webkit-details-marker]:hidden`}>
                <IconBell className="text-wt-text-muted" />
                {unreadNotificationCount ? (
                  <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                ) : null}
              </summary>
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[380px] bg-white dark:bg-wt-surface-1 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-wt-border-md p-2">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-wt-border/80 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-wt-text text-base">Notifications</h3>
                  <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-40" onClick={() =>
                      runAction("Mark all notifications read", async () => {
                        try {
                          await hrmsService.markAllNotificationsRead();
                        } catch {
                          /* Silently ignore — non-critical action */
                        }
                        await loadNotifications();
                      })
                    }
                    disabled={actionLoading || !notifications.length}
                  >
                    Read All
                  </button>
                </div>
                <div className="max-h-[320px] overflow-auto">
                  {notificationsLoading && !notifications.length ? (
                    <p className="text-sm text-slate-400 dark:text-wt-text-muted px-3 py-4 text-center">Loading notifications…</p>
                  ) : notificationsError ? (
                    <p className="text-sm text-rose-500 px-3 py-4 text-center">{notificationsError}</p>
                  ) : notifications.length ? (
                    notifications.map((row, idx) => {
                      const id = notificationRowId(row);
                      const isRead = notificationIsRead(row);
                      const title = notificationTitle(row);
                      const message = notificationMessage(row);
                      const createdAt = formatNotificationTimestamp(row.created_at);
                      const categoryLabel = notificationCategoryLabel(row);
                      const roleLabel =
                        categoryLabel !== "—"
                          ? categoryLabel
                          : extractRoleFromNotificationMessage(message);
                      const href = resolveNotificationHref(row, { userRoles });
                      const isNavigable = Boolean(href);

                      const badgeClass =
                        /leave|wfh/i.test(roleLabel)
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                          : /time.?log/i.test(roleLabel)
                            ? "bg-blue-50 text-blue-700 dark:bg-[color-mix(in_srgb,var(--wt-brand)_28%,transparent)] dark:text-[#b8c7e8]"
                            : /exit|survey/i.test(roleLabel)
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
                              : "bg-slate-50 text-slate-600 dark:bg-wt-surface-3 dark:text-wt-text-muted";

                      return (
                        <div
                          key={id || `notification-${idx}`}
                          role={isNavigable ? "button" : undefined}
                          tabIndex={isNavigable ? 0 : undefined}
                          onClick={() => {
                            if (isNavigable) void handleNotificationClick(row);
                          }}
                          onKeyDown={(event) => {
                            if (!isNavigable) return;
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              void handleNotificationClick(row);
                            }
                          }}
                          className={cn(
                            "p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-wt-surface-2 transition-all duration-150 group cursor-pointer border-b border-slate-50 dark:border-wt-border last:border-0",
                            isNavigable && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:focus-visible:ring-wt-brand"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                                  {roleLabel}
                                </span>
                                {createdAt ? (
                                  <span className="text-xs text-slate-400 dark:text-wt-text-muted ml-auto">{createdAt}</span>
                                ) : null}
                              </div>
                              {title && title !== message ? (
                                <p className="font-medium text-slate-800 dark:text-wt-text text-sm mt-1">{title}</p>
                              ) : null}
                              <p className="text-xs text-slate-500 dark:text-wt-text-muted line-clamp-2 mt-0.5 leading-relaxed">{message}</p>
                            </div>
                            {!isRead && id ? (
                              <button
                                type="button"
                                className="shrink-0 mt-1 size-6 rounded-full flex items-center justify-center text-slate-300 dark:text-wt-text-faint hover:text-blue-600 dark:hover:text-wt-brand hover:bg-blue-50 dark:hover:bg-wt-surface-2 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-0"
                                disabled={actionLoading}
                                 onClick={(event) => {
                                   event.stopPropagation();
                                   runAction("Mark notification read", async () => {
                                     try {
                                       await hrmsService.markNotificationRead(id);
                                     } catch {
                                       /* Silently ignore — non-critical action */
                                     }
                                     await loadNotifications();
                                   });
                                 }}
                                title="Mark as read"
                              >
                                <IconCheck className="size-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-wt-text-muted px-3 py-4 text-center">No notifications.</p>
                  )}
                </div>
              </div>
            </details>
            <button
              type="button"
              className={HEADER_ICON_BUTTON_CLASS}
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch To Light Mode" : "Switch To Dark Mode"}
            >
              {theme === "dark" ? (
                <IconSun className="text-wt-text-muted" />
              ) : (
                <IconMoon className="text-wt-text-muted" />
              )}
            </button>
          </div>
        </header>

        <div className="wt-page-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
