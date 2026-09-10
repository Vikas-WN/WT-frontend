"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { normalizeRoles } from "@/utils/roles";
import { isEditableTarget, isModKey, modKeyLabel } from "@/lib/keyboard";

type ShortcutContextValue = { openShortcuts: () => void };
const ShortcutContext = createContext<ShortcutContextValue>({ openShortcuts: () => {} });
export function useKeyboardShortcuts() {
  return useContext(ShortcutContext);
}

type Shortcut = {
  /** Display tokens, e.g. ["G", "then", "H"] or ["⌘", "K"]. */
  display: string[];
  /** Second key of a `g …` navigation shortcut (lowercase), if any. */
  goKey?: string;
  label: string;
  href?: string;
  group: "Go to" | "Actions";
  show: (roles: string[]) => boolean;
};

function buildShortcuts(mod: string): Shortcut[] {
  const everyone = () => true;
  const hrAdmin = (r: string[]) => r.includes("ROLE_HR") || r.includes("ROLE_ADMIN");
  const approver = (r: string[]) =>
    r.includes("ROLE_MANAGER") ||
    r.includes("ROLE_DM") ||
    r.includes("ROLE_HR") ||
    r.includes("ROLE_ADMIN");

  return [
    { display: [mod, "K"], label: "Search people, projects & pages", group: "Actions", show: everyone },
    { display: ["?"], label: "Show this shortcuts panel", group: "Actions", show: everyone },
    { display: ["G", "then", "H"], goKey: "h", label: "Home", href: DASHBOARD_ROUTES.home, group: "Go to", show: everyone },
    { display: ["G", "then", "L"], goKey: "l", label: "Leave Requests", href: DASHBOARD_ROUTES.leave, group: "Go to", show: everyone },
    { display: ["G", "then", "T"], goKey: "t", label: "Time Logs", href: DASHBOARD_ROUTES.timelog, group: "Go to", show: everyone },
    { display: ["G", "then", "W"], goKey: "w", label: "Who's Out", href: DASHBOARD_ROUTES["whos-out"], group: "Go to", show: everyone },
    { display: ["G", "then", "P"], goKey: "p", label: "My Allocations", href: DASHBOARD_ROUTES["my-allocations"], group: "Go to", show: everyone },
    {
      display: ["G", "then", "A"],
      goKey: "a",
      label: "Team Leave Requests",
      href: DASHBOARD_ROUTES["leave-team"],
      group: "Go to",
      show: approver,
    },
    {
      display: ["G", "then", "D"],
      goKey: "d",
      label: "Employee Directory",
      href: DASHBOARD_ROUTES["employee-directory"],
      group: "Go to",
      show: hrAdmin,
    },
    {
      display: ["G", "then", "R"],
      goKey: "r",
      label: "Reports",
      href: DASHBOARD_ROUTES["reports-workforce"],
      group: "Go to",
      show: hrAdmin,
    },
    {
      display: ["G", "then", "C"],
      goKey: "c",
      label: "Clients",
      href: DASHBOARD_ROUTES.clients,
      group: "Go to",
      show: hrAdmin,
    },
  ];
}

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const roles = useMemo(() => normalizeRoles(user?.roles ?? []), [user?.roles]);
  const mod = modKeyLabel();

  const [sheetOpen, setSheetOpen] = useState(false);
  const gPendingRef = useRef(false);
  const gTimerRef = useRef<number | null>(null);

  const shortcuts = useMemo(() => buildShortcuts(mod), [mod]);
  const visible = useMemo(
    () => shortcuts.filter((s) => s.show(roles)),
    [shortcuts, roles]
  );

  const openShortcuts = useCallback(() => setSheetOpen(true), []);

  const goByKey = useCallback(
    (key: string) => {
      const hit = visible.find((s) => s.goKey === key);
      if (hit?.href) router.push(hit.href);
    },
    [visible, router]
  );

  useEffect(() => {
    const clearG = () => {
      gPendingRef.current = false;
      if (gTimerRef.current) window.clearTimeout(gTimerRef.current);
      gTimerRef.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // ⌘/Ctrl+K is owned by the command palette; don't double-handle.
      if (isModKey(e) && e.key.toLowerCase() === "k") return;
      if (e.altKey || e.ctrlKey || e.metaKey) {
        clearG();
        return;
      }
      if (isEditableTarget(e.target)) return;

      if (gPendingRef.current) {
        const key = e.key.toLowerCase();
        clearG();
        if (/^[a-z]$/.test(key)) {
          e.preventDefault();
          goByKey(key);
        }
        return;
      }

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setSheetOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && sheetOpen) {
        setSheetOpen(false);
        return;
      }
      if (e.key.toLowerCase() === "g") {
        gPendingRef.current = true;
        if (gTimerRef.current) window.clearTimeout(gTimerRef.current);
        gTimerRef.current = window.setTimeout(clearG, 1200);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearG();
    };
  }, [goByKey, sheetOpen]);

  const grouped = useMemo(() => {
    const groups: Record<string, Shortcut[]> = {};
    for (const s of visible) (groups[s.group] ??= []).push(s);
    return groups;
  }, [visible]);

  const sheet =
    sheetOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="wt-modal-overlay fixed inset-0 z-[220] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px] sm:pt-[12vh]"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSheetOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Keyboard shortcuts"
              className="w-full max-w-md overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 shadow-2xl dark:border-wt-border-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-wt-border px-4 py-3">
                <h2 className="text-sm font-semibold text-wt-text">Keyboard shortcuts</h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="rounded-md p-1 text-wt-text-faint hover:bg-wt-surface-2 hover:text-wt-text"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
                {Object.entries(grouped).map(([group, list]) => (
                  <div key={group}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
                      {group}
                    </p>
                    <ul className="space-y-1">
                      {list.map((s) => (
                        <li
                          key={s.label}
                          className="flex items-center justify-between gap-3 py-1"
                        >
                          <span className="text-sm text-wt-text">{s.label}</span>
                          <span className="flex shrink-0 items-center gap-1">
                            {s.display.map((token, i) =>
                              token === "then" ? (
                                <span key={i} className="text-[11px] text-wt-text-faint">
                                  then
                                </span>
                              ) : (
                                <kbd
                                  key={i}
                                  className="rounded border border-wt-border bg-wt-surface-2 px-1.5 py-0.5 font-sans text-[11px] text-wt-text-muted"
                                >
                                  {token}
                                </kbd>
                              )
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <p className="pt-1 text-[11px] text-wt-text-faint">
                  Shortcuts are off while you&apos;re typing in a field.
                </p>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <ShortcutContext.Provider value={{ openShortcuts }}>
      {children}
      {sheet}
    </ShortcutContext.Provider>
  );
}
