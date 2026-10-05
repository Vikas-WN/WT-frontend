import { cn } from "@/lib/utils";

/** Sidebar shell — fixed viewport height; nav scrolls inside. Deliberately
 *  dark regardless of the app theme (see --wt-sidebar-* tokens). */
export const SIDEBAR_SHELL_BASE =
  "wt-sidebar wt-mobile-drawer z-40 flex h-dvh max-h-dvh shrink-0 flex-col border-r border-[var(--wt-sidebar-border)] bg-[var(--wt-sidebar-bg)] transition-[width,transform,padding] duration-[var(--wt-duration)] ease-[var(--wt-ease)] max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[min(88vw,288px)] lg:min-w-0 lg:translate-x-0 max-lg:shadow-[0_24px_64px_rgba(0,0,0,0.45)]";

/** @deprecated Use sidebarShellClass */
export const SIDEBAR_SHELL_CLASS = cn(
  SIDEBAR_SHELL_BASE,
  "w-[min(88vw,280px)] p-3 lg:w-[260px] lg:px-3 lg:py-4"
);

export function sidebarShellClass(mobileOpen: boolean, collapsed: boolean) {
  return cn(
    SIDEBAR_SHELL_BASE,
    "overflow-x-hidden",
    collapsed ? "lg:overflow-visible" : "overflow-y-hidden",
    "p-3",
    sidebarShellStateClass(mobileOpen),
    collapsed ? "lg:w-[4.5rem] lg:px-2 lg:py-3" : "lg:w-[260px] lg:px-3 lg:py-4"
  );
}

export function sidebarShellStateClass(mobileOpen: boolean) {
  return mobileOpen
    ? "max-lg:translate-x-0"
    : "max-lg:pointer-events-none max-lg:-translate-x-full";
}

export const SIDEBAR_BACKDROP_CLASS =
  "fixed inset-0 z-30 bg-black/55 backdrop-blur-[3px] transition-opacity duration-200 lg:hidden";

export const SIDEBAR_BRAND_WRAP_CLASS =
  "mb-3 shrink-0 border-b border-[var(--wt-sidebar-border)] px-1 pb-3.5";

export function sidebarBrandWrapClass(collapsed: boolean) {
  return cn(SIDEBAR_BRAND_WRAP_CLASS, collapsed && "lg:mb-2 lg:px-0 lg:pb-2.5");
}

export const SIDEBAR_BRAND_ROW_CLASS = "flex items-center gap-2";

export function sidebarBrandRowClass(collapsed: boolean) {
  return cn(
    SIDEBAR_BRAND_ROW_CLASS,
    collapsed ? "lg:justify-center" : "lg:justify-between"
  );
}

export const SIDEBAR_COLLAPSE_TOGGLE_CLASS =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent text-[var(--wt-sidebar-text-muted)] transition-colors duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:border-[var(--wt-sidebar-border)] hover:bg-[var(--wt-sidebar-hover-bg)] hover:text-[var(--wt-sidebar-text)] max-lg:hidden";

export const SIDEBAR_NAV_CLASS =
  "wt-sidebar-nav min-h-0 min-w-0 flex-1 space-y-1 [@media(max-height:820px)]:space-y-0.5 overflow-x-hidden overflow-y-auto px-0.5 pb-2 pt-1";

export const SIDEBAR_GROUP_STACK_CLASS = "space-y-0.5";

export function sidebarChildrenWrapClass(collapsed: boolean) {
  return cn(
    "ml-3.5 min-w-0 space-y-0.5 border-l border-[var(--wt-sidebar-border)] py-1 pl-2.5",
    collapsed && "lg:hidden"
  );
}

export const SIDEBAR_FLYOUT_CLASS =
  "absolute left-full top-0 z-[60] ml-2 w-60 rounded-xl border border-[var(--wt-sidebar-border)] bg-[var(--wt-sidebar-surface-2)] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl";

export const SIDEBAR_FLYOUT_TITLE_CLASS =
  "px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--wt-sidebar-text-faint)]";

export const SIDEBAR_FOOTER_CLASS = "mt-2 shrink-0 border-t border-[var(--wt-sidebar-border)] pt-2.5";

export function sidebarFooterCardClass(collapsed: boolean) {
  return cn(
    "rounded-xl bg-[var(--wt-sidebar-hover-bg)] p-1",
    collapsed && "lg:bg-transparent lg:p-0"
  );
}

export const SIDEBAR_PARENT_TEXT = "text-[13px] font-medium leading-snug tracking-[-0.01em]";

export const SIDEBAR_CHILD_TEXT = "text-[12.5px] leading-snug tracking-[-0.01em]";

export function sidebarNavLabelClass(collapsed: boolean) {
  return cn(
    SIDEBAR_NAV_LABEL,
    collapsed &&
      "lg:pointer-events-none lg:absolute lg:-m-px lg:h-px lg:w-px lg:overflow-hidden lg:whitespace-nowrap lg:border-0 lg:p-0"
  );
}

export const SIDEBAR_NAV_LABEL = "min-w-0 flex-1 text-left";

export const SIDEBAR_ICON_WRAP = "size-[18px] shrink-0 text-current opacity-80";

export const SIDEBAR_CHILD_ICON_WRAP = "size-3.5 shrink-0 text-current opacity-75";

export const SIDEBAR_COMPACT_MARK_CLASS =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--wt-brand)] text-[11px] font-bold tracking-tight text-white";

/** Header surface only — `.wt-app-header` owns env(safe-area-inset-top). */
export const DASHBOARD_HEADER_CLASS =
  "wt-app-header z-20 shrink-0 border-b border-wt-border bg-wt-surface-1/90 dark:bg-black/90 dark:backdrop-blur-xl backdrop-blur-xl transition-[background-color,border-color] duration-[var(--wt-duration)] ease-[var(--wt-ease)]";

/** Inner bar — design padding and flex row. Never put py-* on the surface. */
export const DASHBOARD_HEADER_BAR_CLASS =
  "flex items-center justify-between gap-2 px-3 py-3.5 sm:gap-4 sm:px-7 sm:py-4";

export const DASHBOARD_HEADER_MENU_BUTTON_CLASS =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-wt-border bg-wt-surface-2 text-wt-text shadow-sm transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:bg-wt-surface-3 hover:-translate-y-px lg:hidden";

const SIDEBAR_PARENT_BASE =
  "wt-sidebar-nav-item relative flex h-auto min-h-10 w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium whitespace-normal transition-[background-color,color,box-shadow] duration-[var(--wt-duration)] ease-[var(--wt-ease)]";

const SIDEBAR_CHILD_BASE =
  "wt-sidebar-nav-item relative flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 whitespace-normal transition-[background-color,color] duration-[var(--wt-duration)] ease-[var(--wt-ease)]";

const SIDEBAR_ACTIVE_CLASS =
  "bg-[var(--wt-sidebar-active-bg)] font-semibold text-[var(--wt-sidebar-text)] before:absolute before:left-0 before:top-1/2 before:h-[1.15rem] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-[var(--wt-brand)] [&_svg]:text-[color-mix(in_srgb,var(--wt-brand)_55%,white)] [&_svg]:opacity-100";

const SIDEBAR_ACTIVE_COLLAPSED_CLASS =
  "lg:bg-[var(--wt-sidebar-active-bg-collapsed)] lg:text-[var(--wt-sidebar-text)] lg:before:hidden lg:ring-1 lg:ring-[color-mix(in_srgb,var(--wt-brand)_45%,transparent)]";

const SIDEBAR_IDLE_CLASS =
  "text-[var(--wt-sidebar-text-muted)] hover:bg-[var(--wt-sidebar-hover-bg)] hover:text-[var(--wt-sidebar-text)]";

function sidebarCollapsedItemClass(collapsed: boolean) {
  return collapsed
    ? "lg:mx-auto lg:h-10 lg:w-10 lg:min-h-10 lg:justify-center lg:gap-0 lg:px-0 lg:py-0 [@media(max-height:820px)]:lg:h-9 [@media(max-height:820px)]:lg:min-h-9 [@media(max-height:820px)]:lg:w-9"
    : undefined;
}

export function sidebarParentNavClass(active: boolean, options?: { extra?: string; collapsed?: boolean }) {
  const collapsed = Boolean(options?.collapsed);
  return cn(
    SIDEBAR_PARENT_BASE,
    SIDEBAR_PARENT_TEXT,
    active ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_IDLE_CLASS,
    active && collapsed && SIDEBAR_ACTIVE_COLLAPSED_CLASS,
    sidebarCollapsedItemClass(collapsed),
    options?.extra
  );
}

export function sidebarChildNavClass(active: boolean, options?: { extra?: string; collapsed?: boolean }) {
  const collapsed = Boolean(options?.collapsed);
  return cn(
    SIDEBAR_CHILD_BASE,
    SIDEBAR_CHILD_TEXT,
    active ? cn(SIDEBAR_ACTIVE_CLASS, "font-medium") : SIDEBAR_IDLE_CLASS,
    active && collapsed && SIDEBAR_ACTIVE_COLLAPSED_CLASS,
    sidebarCollapsedItemClass(collapsed),
    options?.extra
  );
}

export function sidebarChildBlockClass(active: boolean, extra?: string) {
  return cn(
    "wt-sidebar-nav-item block w-full min-w-0 rounded-md px-2.5 py-2 text-left transition-[background-color,color] duration-150 ease-out",
    SIDEBAR_CHILD_TEXT,
    active ? cn(SIDEBAR_ACTIVE_CLASS, "font-medium") : SIDEBAR_IDLE_CLASS,
    extra
  );
}

export function sidebarProfileLinkClass(active: boolean, collapsed = false) {
  return cn(
    "flex min-w-0 items-center rounded-lg transition-colors duration-150 ease-out",
    collapsed ? "lg:mx-auto lg:size-8 lg:justify-center lg:p-0" : "min-w-0 flex-1 gap-2 px-2 py-1.5",
    active
      ? "bg-wt-surface-3 text-wt-text"
      : "text-wt-text-muted hover:bg-wt-surface-3/70 hover:text-wt-text"
  );
}

export function sidebarLogoutButtonClass(collapsed = false) {
  return cn(
    "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-wt-border bg-wt-surface-1 text-wt-text-muted transition-colors duration-150 ease-out hover:bg-wt-surface-3 hover:text-wt-text",
    collapsed && "lg:mx-auto lg:size-8"
  );
}

export function sidebarFooterRowClass(collapsed: boolean) {
  return cn(
    "flex items-center gap-1.5",
    collapsed && "lg:flex-col lg:items-center lg:gap-2"
  );
}

/** @deprecated Use sidebarParentNavClass */
export const SIDEBAR_NAV_ROW = SIDEBAR_PARENT_BASE;

/** @deprecated Use sidebarChildNavClass */
export const SIDEBAR_CHILD_ROW = SIDEBAR_CHILD_BASE;

/** @deprecated Use sidebarChildBlockClass */
export const SIDEBAR_CHILD_BLOCK =
  "block w-full min-w-0 rounded-lg px-2.5 py-2 text-left whitespace-normal";
