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
import { Search, Users, FolderKanban, Building2, ArrowRight, X } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { hrmsService, type SearchHit } from "@/services/hrms.service";
import {
  dashboardNavigation,
  filterVisibleNavigation,
  type NavItem,
} from "@/constants/dashboardNavigation";
import {
  dashboardHref,
  employeeDirectoryProfilePath,
  DASHBOARD_ROUTES,
} from "@/constants/routes";
import { cn } from "@/lib/utils";

type PageHit = { id: string; label: string; href: string };
type PaletteItem =
  | { key: string; type: "page"; page: PageHit }
  | { key: string; type: "hit"; hit: SearchHit };

type CommandPaletteContextValue = { open: () => void; close: () => void };

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  }
  return ctx;
}

function flattenPages(items: NavItem[]): PageHit[] {
  const out: PageHit[] = [];
  const seen = new Set<string>();
  const push = (id: string, label: string) => {
    const href = dashboardHref(id);
    if (!href || seen.has(id)) return;
    seen.add(id);
    out.push({ id, label, href });
  };
  for (const item of items) {
    if (item.kind === "link") push(item.id, item.label);
    else for (const child of item.children) push(child.id, child.label);
  }
  return out;
}

function hrefForHit(hit: SearchHit): string {
  if (hit.kind === "employee") return employeeDirectoryProfilePath(hit.ref);
  if (hit.kind === "project") {
    return `${DASHBOARD_ROUTES.allocation}?project=${encodeURIComponent(hit.ref)}`;
  }
  return `${DASHBOARD_ROUTES.clients}?client=${encodeURIComponent(hit.ref)}`;
}

function HitIcon({ kind }: { kind: SearchHit["kind"] }) {
  const cls = "size-4 shrink-0 text-wt-text-muted";
  if (kind === "employee") return <Users className={cls} aria-hidden />;
  if (kind === "project") return <FolderKanban className={cls} aria-hidden />;
  return <Building2 className={cls} aria-hidden />;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const userRoles = useMemo(() => user?.roles ?? [], [user?.roles]);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fetched, setFetched] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reqSeq = useRef(0);

  const pages = useMemo(() => {
    const roles = userRoles.map((r) => r.toUpperCase());
    return flattenPages(
      filterVisibleNavigation(dashboardNavigation, userRoles, {
        hasHrAccess: roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN"),
        hasAccountManagerAccess: roles.includes("ROLE_AM"),
        showExitSurveyNav: true,
      })
    );
  }, [userRoles]);

  const open = useCallback(() => {
    setQuery("");
    setFetched([]);
    setStatus("idle");
    setActiveIndex(0);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  // Cmd/Ctrl+K toggles the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => {
          if (!v) {
            setQuery("");
            setFetched([]);
            setStatus("idle");
            setActiveIndex(0);
          }
          return !v;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  // Debounced remote search. State is only touched inside the async callback,
  // so nothing runs synchronously in the effect body.
  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (q.length < 2) return;
    const seq = ++reqSeq.current;
    const t = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await hrmsService.globalSearch(q);
        if (seq !== reqSeq.current) return;
        const data = res?.data;
        setFetched([
          ...(data?.employees ?? []),
          ...(data?.projects ?? []),
          ...(data?.clients ?? []),
        ]);
        setStatus("done");
      } catch {
        if (seq !== reqSeq.current) return;
        setFetched([]);
        setStatus("error");
      }
    }, 200);
    return () => window.clearTimeout(t);
  }, [query, isOpen]);

  const q = query.trim();

  const pagesShown = useMemo(() => {
    const needle = q.toLowerCase();
    if (!needle) return pages.slice(0, 8);
    return pages.filter((p) => p.label.toLowerCase().includes(needle)).slice(0, 6);
  }, [pages, q]);

  const results = useMemo(
    () => (q.length >= 2 ? fetched : []),
    [q, fetched]
  );

  const items: PaletteItem[] = useMemo(
    () => [
      ...pagesShown.map((page) => ({ key: `page-${page.id}`, type: "page" as const, page })),
      ...results.map((hit) => ({ key: `${hit.kind}-${hit.id}`, type: "hit" as const, hit })),
    ],
    [pagesShown, results]
  );

  const active = items.length ? Math.min(activeIndex, items.length - 1) : 0;

  const go = useCallback(
    (item: PaletteItem) => {
      const href = item.type === "page" ? item.page.href : hrefForHit(item.hit);
      setIsOpen(false);
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(Math.min(active + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(Math.max(active - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[active];
      if (item) go(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const message =
    q.length === 1
      ? "Keep typing…"
      : status === "loading" && !results.length
        ? "Searching…"
        : status === "error"
          ? "Couldn't run the search. Check your connection and try again."
          : q.length >= 2 && status === "done" && results.length === 0
            ? `No people, projects or clients match "${q}".`
            : q.length === 0 && pagesShown.length === 0
              ? "Search people, projects and clients."
              : null;

  const firstResultIndex = pagesShown.length;

  const palette =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className={cn(
              "wt-modal-overlay fixed inset-0 z-[210] flex items-start justify-center overflow-y-auto",
              "bg-black/50 p-4 backdrop-blur-[2px] sm:pt-[10vh]"
            )}
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Search WebTrak"
              className={cn(
                "flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 shadow-2xl dark:border-wt-border-md",
                "max-sm:h-[100dvh] max-sm:max-w-none max-sm:rounded-none max-sm:border-0"
              )}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={onKeyDown}
            >
              <div className="flex items-center gap-2.5 border-b border-wt-border px-4 py-3">
                <Search className="size-4 shrink-0 text-wt-text-muted" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder="Search people, projects, clients…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-wt-text outline-none placeholder:text-wt-text-faint"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1 text-wt-text-faint transition-colors hover:bg-wt-surface-2 hover:text-wt-text"
                  aria-label="Close search"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div
                ref={listRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
              >
                {pagesShown.length > 0 ? (
                  <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
                    Pages
                  </p>
                ) : null}

                {items.map((item, idx) => {
                  const isActive = idx === active;
                  if (item.type === "page") {
                    return (
                      <button
                        key={item.key}
                        type="button"
                        data-idx={idx}
                        onMouseMove={() => setActiveIndex(idx)}
                        onClick={() => go(item)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm",
                          isActive
                            ? "bg-[var(--wt-brand-soft)] text-wt-text"
                            : "text-wt-text-muted"
                        )}
                      >
                        <ArrowRight
                          className="size-4 shrink-0 text-wt-text-faint"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">{item.page.label}</span>
                      </button>
                    );
                  }
                  return (
                    <div key={item.key}>
                      {idx === firstResultIndex ? (
                        <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
                          Results
                        </p>
                      ) : null}
                      <button
                        type="button"
                        data-idx={idx}
                        onMouseMove={() => setActiveIndex(idx)}
                        onClick={() => go(item)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left",
                          isActive ? "bg-[var(--wt-brand-soft)]" : ""
                        )}
                      >
                        <HitIcon kind={item.hit.kind} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-wt-text">
                            {item.hit.title}
                          </span>
                          {item.hit.subtitle ? (
                            <span className="block truncate text-xs text-wt-text-muted">
                              {item.hit.subtitle}
                            </span>
                          ) : null}
                        </span>
                        {item.hit.badge ? (
                          <span className="shrink-0 rounded-md bg-wt-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-wt-text-muted">
                            {item.hit.badge}
                          </span>
                        ) : null}
                      </button>
                    </div>
                  );
                })}

                {message ? (
                  <p className="px-3 py-8 text-center text-sm text-wt-text-muted">
                    {message}
                  </p>
                ) : null}
              </div>

              <div className="hidden items-center gap-3 border-t border-wt-border px-4 py-2 text-[11px] text-wt-text-faint sm:flex">
                <span>
                  <kbd className="rounded bg-wt-surface-2 px-1">↑</kbd>{" "}
                  <kbd className="rounded bg-wt-surface-2 px-1">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="rounded bg-wt-surface-2 px-1">↵</kbd> open
                </span>
                <span>
                  <kbd className="rounded bg-wt-surface-2 px-1">esc</kbd> close
                </span>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <CommandPaletteContext.Provider value={{ open, close }}>
      {children}
      {palette}
    </CommandPaletteContext.Provider>
  );
}
