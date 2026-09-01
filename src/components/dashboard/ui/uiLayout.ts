/** Shared layout class names for sections, forms, and detail tables. */

import { cn } from "@/lib/utils";

/** Generous page rhythm — avoids cramped stacks. */
export const PAGE_STACK_CLASS = "space-y-8";
export const SECTION_STACK_CLASS = PAGE_STACK_CLASS;
export const SECTION_HEADER_CLASS =
  "mb-5 border-b border-wt-border pb-4 dark:border-wt-border/80";
export const SECTION_TITLE_CLASS =
  "text-lg font-semibold tracking-tight text-wt-text";
export const SECTION_DESCRIPTION_CLASS =
  "mt-1.5 text-sm leading-relaxed text-wt-text-muted";

/** Primary content card used on tabbed pages (Leave, Timelog, etc.). */
export const CONTENT_CARD_CLASS = cn(
  "wt-surface-card overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 shadow-[var(--wt-shadow-sm)]",
  "transition-[box-shadow,transform,border-color] duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
  "hover:-translate-y-0.5 hover:shadow-[var(--wt-shadow-md)] dark:border-wt-border dark:bg-wt-surface-1 dark:shadow-none dark:hover:translate-y-0 dark:hover:shadow-none"
);

/** Nested panel inside a content card — clear structure on pitch-black. */
export const INNER_PANEL_CLASS = cn(
  "rounded-xl border border-wt-border bg-wt-surface-2/60 p-5 sm:p-6",
  "dark:border-wt-border dark:bg-wt-surface-2"
);

/** Selected table row — brand-tinted, works in light and dark. */
export const TABLE_ROW_SELECTED_CLASS =
  "bg-[color-mix(in_srgb,var(--wt-brand)_10%,transparent)] dark:bg-[color-mix(in_srgb,var(--wt-brand)_18%,transparent)]";

/** Info / notice banner — brand soft, not sky one-off. */
export const INFO_BANNER_CLASS =
  "rounded-xl border border-[color-mix(in_srgb,var(--wt-brand)_22%,transparent)] bg-[var(--wt-brand-soft)] px-5 py-4 text-sm text-wt-text";

export const INFO_BANNER_TITLE_CLASS = "font-medium text-wt-text";
export const INFO_BANNER_BODY_CLASS = "mt-1.5 leading-relaxed text-wt-text-muted";

/** Default max height for scrollable data tables. */
export const DEFAULT_TABLE_MAX_HEIGHT = "max-h-[min(65vh,560px)]";

/** Card shell zones — shared horizontal padding with matched vertical rhythm. */
export const CARD_HEADER_CLASS = "px-5 py-5 sm:px-8 sm:py-6";
export const CARD_TOOLBAR_CLASS = "px-5 py-5 sm:px-8 sm:py-6";
export const CARD_CONTENT_CLASS = "p-5 sm:p-8";
export const CARD_CONTENT_BELOW_TOOLBAR_CLASS = "px-5 pb-5 pt-0 sm:px-8 sm:pb-8";
export const CARD_FOOTER_CLASS = "px-5 py-5 sm:px-8 sm:py-6";
export const CARD_STACK_CLASS = "space-y-8";
export const CARD_TOOLBAR_INNER_CLASS =
  "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between";
export const CARD_CONTENT_STACK_CLASS = "space-y-7";

/** Dense management list cards — slightly tighter than page cards, still breathable. */
export const CARD_HEADER_COMPACT_CLASS = "px-5 py-4 sm:px-6";
export const CARD_TOOLBAR_COMPACT_CLASS = "px-5 py-4 sm:px-6";
export const CARD_CONTENT_COMPACT_CLASS = "px-5 pb-5 pt-0 sm:px-6 sm:pb-5";
export const CARD_TOOLBAR_INNER_COMPACT_CLASS =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";
export const CARD_CONTENT_STACK_COMPACT_CLASS = "space-y-4";
export const CARD_FORM_GRID_CLASS = "grid gap-5 sm:grid-cols-2";
export const CARD_FORM_ACTIONS_CLASS = "flex flex-wrap gap-3 pt-6";
export const FORM_FIELD_CLASS = "flex flex-col gap-2";
export const FIELD_LABEL_CLASS = "text-sm font-medium leading-none text-wt-text";
/** Shared height/padding for text inputs and selects in forms. */
export const FORM_CONTROL_CLASS = cn(
  "h-11 w-full min-w-0 rounded-xl border border-wt-border bg-wt-surface-1 px-3.5 py-2 text-sm text-wt-text",
  "transition-[border-color,box-shadow,background-color] duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
  "outline-none placeholder:text-wt-text-faint",
  "focus-visible:border-[var(--wt-brand)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)]",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "dark:border-wt-border-md dark:bg-wt-surface-2"
);
export const FORM_CONTROL_WITH_CHEVRON_CLASS = cn(FORM_CONTROL_CLASS, "pr-10");

/** Toolbar / list filter selects — aligned with SearchInput and wt surfaces. */
export const TOOLBAR_SELECT_TRIGGER_CLASS = cn(
  "h-11 w-full min-w-0 rounded-xl border border-wt-border bg-wt-surface-1 px-3.5 text-sm font-normal text-wt-text",
  "transition-[background-color,border-color,box-shadow] duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
  "hover:bg-wt-surface-2 focus-visible:border-[var(--wt-brand)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "data-placeholder:text-wt-text-muted dark:border-wt-border-md dark:bg-wt-surface-2 dark:hover:bg-wt-surface-3"
);

export const TOOLBAR_SELECT_TRIGGER_COMPACT_CLASS = cn(
  TOOLBAR_SELECT_TRIGGER_CLASS,
  "h-10 rounded-xl text-sm"
);

/** In-table compact selects (e.g. portal role). */
export const TABLE_INLINE_SELECT_TRIGGER_CLASS = cn(
  TOOLBAR_SELECT_TRIGGER_COMPACT_CLASS,
  // This class lands on the trigger's outer wrapper, not the inner <input>; the input
  // keeps its own px-3.5 from FORM_CONTROL_CLASS unless zeroed here, which otherwise
  // stacks on top of this px-2.5 and doubles the left inset.
  "h-9 min-h-9 px-2.5 text-xs shadow-none hover:bg-wt-surface-2/80 [&>input]:pl-0"
);

export const DETAIL_LABEL_CELL_CLASS =
  "w-[34%] min-w-[9.5rem] whitespace-nowrap align-top px-3 py-3.5 text-sm text-wt-text-muted";
export const DETAIL_VALUE_CELL_CLASS =
  "align-top px-3 py-3.5 text-sm text-wt-text";

/** Inline text links — brand-colored, never indigo/blue one-offs. */
export const LINK_CLASS =
  "font-medium text-[var(--wt-brand)] underline-offset-2 transition-colors hover:underline hover:text-[var(--wt-brand-hover)]";

/** Brand focus ring for native inputs/selects that bypass shared Field wrappers. */
export const BRAND_FOCUS_RING_CLASS =
  "outline-none focus:border-[var(--wt-brand)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)]";

/** Native <select> / one-off controls — matches FORM_CONTROL look. */
export const NATIVE_CONTROL_CLASS = cn(
  "h-11 w-full min-w-0 rounded-xl border border-wt-border bg-wt-surface-1 px-3.5 text-sm text-wt-text",
  "transition-[border-color,box-shadow,background-color] duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
  BRAND_FOCUS_RING_CLASS,
  "disabled:cursor-not-allowed disabled:opacity-50",
  "dark:border-wt-border-md dark:bg-wt-surface-2"
);

/** Dialog / modal shell — shared by WtFormDialog and hand-rolled overlays. */
export const MODAL_OVERLAY_CLASS = cn(
  // Scroll the overlay itself so tall dialogs are never clipped at the top.
  "fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain",
  "bg-black/55 p-4 backdrop-blur-[2px] dark:bg-black/75"
);
export const MODAL_PANEL_CLASS = cn(
  // my-auto centers when short; min-h-0 + overflow-hidden lets the body scroll when tall.
  "relative my-auto flex max-h-[min(90dvh,880px)] w-full min-h-0 flex-col overflow-hidden",
  "rounded-2xl border border-wt-border bg-wt-surface-1 shadow-xl",
  "dark:border-wt-border-md dark:bg-wt-surface-1 dark:shadow-none"
);
export const MODAL_HEADER_CLASS =
  "shrink-0 border-b border-wt-border px-5 py-5 sm:px-7 dark:border-wt-border/80";
// `relative` makes the body the containing block for absolute-positioned
// dropdowns portaled into it; overflow clips them above the footer.
export const MODAL_BODY_CLASS =
  "relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-5 sm:px-7";
export const MODAL_FOOTER_CLASS =
  "relative z-10 flex shrink-0 justify-end gap-3 border-t border-wt-border bg-wt-surface-1 px-5 py-5 sm:px-7 dark:border-wt-border/80";

/** Filter / toolbar strip inside a content card. */
export const FILTER_BAR_CLASS = cn(
  "rounded-xl border border-wt-border bg-wt-surface-2/50 p-4 sm:p-5",
  "dark:border-wt-border dark:bg-wt-surface-2"
);
