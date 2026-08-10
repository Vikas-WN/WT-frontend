import { cn } from "@/lib/utils";

/** Sidebar shell — fixed viewport height; nav scrolls inside. */
export const SIDEBAR_SHELL_BASE =
  "wt-sidebar z-40 flex h-dvh max-h-dvh shrink-0 flex-col border-r border-wt-border bg-wt-surface-1 transition-[width,transform,padding] duration-[var(--wt-duration)] ease-[var(--wt-ease)] max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[min(88vw,288px)] lg:min-w-0 lg:translate-x-0 dark:bg-black dark:shadow-none lg:shadow-none max-lg:shadow-xl";

/** @deprecated Use sidebarShellClass */
export const SIDEBAR_SHELL_CLASS = cn(SIDEBAR_SHELL_BASE, "w-[min(88vw,280px)] p-4 lg:w-[264px] lg:px-4 lg:py-5");

export function sidebarShellClass(mobileOpen: boolean, collapsed: boolean) {
  return cn(
    SIDEBAR_SHELL_BASE,
    "overflow-x-hidden",
    collapsed ? "lg:overflow-visible" : "overflow-y-hidden",
    "p-4",
    sidebarShellStateClass(mobileOpen),
    collapsed ? "lg:w-20 lg:px-2 lg:py-3" : "lg:w-[272px] lg:px-4 lg:py-5"
  );
}

export function sidebarShellStateClass(mobileOpen: boolean) {
  return mobileOpen
    ? "max-lg:translate-x-0"
    : "max-lg:pointer-events-none max-lg:-translate-x-full";
}

export const SIDEBAR_BACKDROP_CLASS =
  "fixed inset-0 z-30 bg-black/70 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden";

export const SIDEBAR_BRAND_WRAP_CLASS =
  "mb-4 shrink-0 border-b border-wt-border/80 pb-4";

export function sidebarBrandWrapClass(collapsed: boolean) {
  return cn(
    SIDEBAR_BRAND_WRAP_CLASS,
    collapsed && "lg:mb-3 lg:border-b-0 lg:pb-0"
  );
}

export const SIDEBAR_BRAND_ROW_CLASS = "flex items-center gap-2";

export function sidebarBrandRowClass(collapsed: boolean) {
  return cn(
    SIDEBAR_BRAND_ROW_CLASS,
    collapsed && "lg:justify-center"
  );
}

export const SIDEBAR_COLLAPSE_TOGGLE_CLASS =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-wt-border bg-wt-surface-2 text-wt-text-muted transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--wt-brand)_30%,var(--wt-border))] hover:bg-wt-surface-3 hover:text-wt-text hover:shadow-sm active:translate-y-0 max-lg:hidden";

export const SIDEBAR_NAV_CLASS =
  "wt-sidebar-nav min-h-0 min-w-0 flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto px-0.5";

export const SIDEBAR_GROUP_STACK_CLASS = "space-y-1";

export function sidebarChildrenWrapClass(collapsed: boolean) {
  return cn(
    "ml-2.5 min-w-0 space-y-0.5 border-l border-wt-border/70 py-0.5 pl-2.5",
    collapsed && "lg:hidden"
  );
}

export const SIDEBAR_FLYOUT_CLASS =
  "absolute left-full top-0 z-[60] ml-2.5 w-60 rounded-xl border border-wt-border bg-wt-surface-1 p-2 shadow-2xl ring-1 ring-black/10";

export const SIDEBAR_FLYOUT_TITLE_CLASS =
  "border-b border-wt-border px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-wt-text-muted";

export const SIDEBAR_FOOTER_CLASS = "mt-2 shrink-0";

export function sidebarFooterCardClass(collapsed: boolean) {
  return cn(
    "rounded-xl border border-wt-border bg-wt-surface-2 p-1 dark:bg-wt-surface-2",
    collapsed && "lg:border-0 lg:bg-transparent lg:p-0"
  );
}

export const SIDEBAR_PARENT_TEXT = "text-sm leading-snug";

export const SIDEBAR_CHILD_TEXT = "text-xs leading-snug";

export function sidebarNavLabelClass(collapsed: boolean) {
  return cn(
    SIDEBAR_NAV_LABEL,
    collapsed &&
      "lg:pointer-events-none lg:absolute lg:-m-px lg:h-px lg:w-px lg:overflow-hidden lg:whitespace-nowrap lg:border-0 lg:p-0"
  );
}

export const SIDEBAR_NAV_LABEL = "min-w-0 flex-1 text-left";

export const SIDEBAR_ICON_WRAP = "size-[18px] shrink-0 text-current";

export const SIDEBAR_CHILD_ICON_WRAP = "size-4 shrink-0 text-current";

export const SIDEBAR_COMPACT_MARK_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--wt-brand)] text-[11px] font-bold tracking-tight text-white shadow-sm";

export const DASHBOARD_HEADER_CLASS =
  "z-20 flex shrink-0 items-center justify-between gap-3 border-b border-wt-border bg-wt-surface-1/90 px-4 py-3.5 sm:gap-4 sm:px-7 sm:py-4 dark:bg-black/90 dark:backdrop-blur-xl backdrop-blur-xl transition-[background-color,border-color] duration-[var(--wt-duration)] ease-[var(--wt-ease)]";

export const DASHBOARD_HEADER_MENU_BUTTON_CLASS =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-wt-border bg-wt-surface-2 text-wt-text shadow-sm transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:bg-wt-surface-3 hover:-translate-y-px lg:hidden";

const SIDEBAR_PARENT_BASE =
  "wt-sidebar-nav-item relative flex h-auto min-h-10 w-full min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 font-normal whitespace-normal transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:-translate-y-px active:translate-y-0";

const SIDEBAR_CHILD_BASE =
  "wt-sidebar-nav-item relative flex w-full min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 font-normal whitespace-normal transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:-translate-y-px active:translate-y-0";

const SIDEBAR_ACTIVE_CLASS =
  "bg-[var(--wt-brand-soft)] font-medium text-wt-text ring-1 ring-[color-mix(in_srgb,var(--wt-brand)_22%,transparent)] before:absolute before:left-1.5 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[var(--wt-brand)] dark:bg-wt-surface-2 dark:ring-wt-border-md";

const SIDEBAR_ACTIVE_COLLAPSED_CLASS =
  "lg:bg-[var(--wt-brand-soft)] lg:text-wt-text lg:shadow-sm lg:ring-1 lg:ring-[color-mix(in_srgb,var(--wt-brand)_28%,transparent)] lg:before:hidden";

const SIDEBAR_IDLE_CLASS =
  "text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text hover:shadow-sm";

function sidebarCollapsedItemClass(collapsed: boolean) {
  return collapsed
    ? "lg:mx-auto lg:h-10 lg:w-10 lg:min-h-10 lg:justify-center lg:gap-0 lg:px-0 lg:py-0"
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
    "wt-sidebar-nav-item block w-full min-w-0 rounded-lg px-2.5 py-2 text-left transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-sm active:translate-y-0",
    SIDEBAR_CHILD_TEXT,
    active ? cn(SIDEBAR_ACTIVE_CLASS, "font-medium") : SIDEBAR_IDLE_CLASS,
    extra
  );
}

export function sidebarProfileLinkClass(active: boolean, collapsed = false) {
  return cn(
    "flex min-w-0 items-center rounded-lg transition-all duration-150 ease-out",
    collapsed ? "lg:mx-auto lg:size-8 lg:justify-center lg:p-0" : "min-w-0 flex-1 gap-2 px-2 py-1.5",
    active
      ? "bg-wt-surface-3 text-wt-text ring-1 ring-wt-border"
      : "text-wt-text-muted hover:bg-wt-surface-3/70 hover:text-wt-text"
  );
}

export function sidebarLogoutButtonClass(collapsed = false) {
  return cn(
    "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-wt-border bg-wt-surface-1 text-wt-text-muted shadow-sm transition-all duration-150 ease-out hover:bg-wt-surface-3 hover:text-wt-text",
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
