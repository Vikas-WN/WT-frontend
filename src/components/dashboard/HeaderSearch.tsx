"use client";

import { Search } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useCommandPalette } from "@/components/dashboard/CommandPalette";
import { modKeyLabel } from "@/lib/keyboard";

/** The header's search box: a button that opens the command palette (⌘K), looking like the field in the redesign. */
export function HeaderSearch() {
  const { open } = useCommandPalette();
  // "Ctrl" during SSR/hydration, then the real platform label — no setState-in-effect, no hydration mismatch.
  const mod = useSyncExternalStore(
    () => () => {},
    () => modKeyLabel(),
    () => "Ctrl"
  );
  const shortcut = mod === "⌘" ? "⌘K" : `${mod}+K`;
  return (
    <>
      <button
        type="button"
        onClick={open}
        className="hidden h-10 w-[19rem] items-center gap-2.5 rounded-xl border border-wt-border bg-wt-surface-2 px-3 text-left text-sm text-wt-text-muted transition-colors hover:bg-wt-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)] md:flex lg:w-[22rem]"
        aria-label="Search or jump to"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">Search or jump to…</span>
        <kbd className="shrink-0 rounded-md border border-wt-border bg-wt-surface-1 px-1.5 py-0.5 font-sans text-[11px] text-wt-text-faint">{shortcut}</kbd>
      </button>
      <button
        type="button"
        onClick={open}
        className="flex size-10 items-center justify-center rounded-xl border border-wt-border bg-wt-surface-1 text-wt-text-muted hover:bg-wt-surface-2 md:hidden"
        aria-label="Search"
      >
        <Search className="size-[18px]" aria-hidden />
      </button>
    </>
  );
}
