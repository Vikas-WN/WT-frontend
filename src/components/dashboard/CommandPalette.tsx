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
import { UserAvatar } from "@/components/dashboard/ui/profile";
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

const NOOP_PALETTE: CommandPaletteContextValue = { open: () => {}, close: () => {} };

const CommandPaletteContext = createContext<CommandPaletteContextValue>(NOOP_PALETTE);

/** Returns a no-op palette controller when no provider is mounted, so any
 *  screen that renders the dashboard chrome (e.g. /guide) still works. */
export function useCommandPalette(): CommandPaletteContextValue {
  return useContext(CommandPaletteContext);
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

const HIT_TILE: Record<SearchHit["kind"], string> = {
  employee: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300",
  project: "bg-amber-500/12 text-amber-600 dark:text-amber-300",
  client: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
};

function HitIcon({ kind }: { kind: SearchHit["kind"] }) {
  const Icon = kind === "employee" ? Users : kind === "project" ? FolderKanban : Building2;
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        HIT_TILE[kind]
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

const GROUP_LABEL: Record<SearchHit["kind"], string> = {
  employee: "People",
  project: "Projects",
  client: "Clients",
};

/** Split "… · Skills: Python, Django" into a plain lead + skill chips. */
function splitSubtitle(subtitle: string | null | undefined): {
  lead: string;
  skills: string[];
} {
  if (!subtitle) return { lead: "", skills: [] };
  const marker = subtitle.indexOf("Skills: ");
  if (marker === -1) return { lead: subtitle, skills: [] };
  const lead = subtitle.slice(0, marker).replace(/\s*·\s*$/, "").trim();
  const skills = subtitle
    .slice(marker + "Skills: ".length)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { lead, skills };
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
            ? `Nothing matches "${q}" — try a name, skill, phone number, project or client.`
            : q.length === 0 && pagesShown.length === 0
              ? "Search anyone by name, skill or phone — plus projects and clients."
              : null;

  const firstResultIndex = pagesShown.length;

  const palette =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className={cn(
              "wt-modal-overlay fixed inset-0 z-[210] flex items-start justify-center overflow-y-auto",
              "bg-black/50 p-4 backdrop-blur-sm sm:pt-[10vh]"
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
                "flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.4)] ring-1 ring-black/5 dark:border-wt-border-md dark:ring-white/5",
                "max-sm:h-[100dvh] max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:ring-0"
              )}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={onKeyDown}
            >
              <div className="flex items-center gap-2.5 border-b border-wt-border px-4 py-3.5">
                <Search className="size-[18px] shrink-0 text-wt-text-muted" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder="Search anyone by name, skill, phone — plus projects & clients…"
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-wt-text outline-none placeholder:text-wt-text-faint"
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
                  <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-wt-text-faint">
                    Jump to
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
                          "group/row flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-[var(--wt-brand-soft)] text-wt-text"
                            : "text-wt-text-muted hover:bg-wt-surface-2/60"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg bg-wt-surface-2 text-wt-text-faint",
                            isActive && "bg-white/60 text-[var(--wt-brand)] dark:bg-white/10"
                          )}
                        >
                          <ArrowRight className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {item.page.label}
                        </span>
                        {isActive ? (
                          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-wt-text-faint">
                            Enter
                          </span>
                        ) : null}
                      </button>
                    );
                  }
                  const ri = idx - firstResultIndex;
                  const showHeader = ri === 0 || results[ri - 1]?.kind !== item.hit.kind;
                  const groupCount = results.filter(
                    (r) => r.kind === item.hit.kind
                  ).length;
                  const { lead, skills } = splitSubtitle(item.hit.subtitle);
                  return (
                    <div key={item.key}>
                      {showHeader ? (
                        <p className="flex items-center gap-1.5 px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-wt-text-faint">
                          {GROUP_LABEL[item.hit.kind]}
                          <span className="rounded-full bg-wt-surface-2 px-1.5 text-[10px] font-medium text-wt-text-muted">
                            {groupCount}
                          </span>
                        </p>
                      ) : null}
                      <button
                        type="button"
                        data-idx={idx}
                        onMouseMove={() => setActiveIndex(idx)}
                        onClick={() => go(item)}
                        className={cn(
                          "group/row flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                          isActive
                            ? "bg-[var(--wt-brand-soft)]"
                            : "hover:bg-wt-surface-2/60"
                        )}
                      >
                        {item.hit.kind === "employee" ? (
                          <UserAvatar
                            size="md"
                            fallbackName={item.hit.title}
                            profile={{
                              name: item.hit.title,
                              emp_id: item.hit.ref,
                              profile_photo: item.hit.image ?? undefined,
                            }}
                          />
                        ) : (
                          <HitIcon kind={item.hit.kind} />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-wt-text">
                            {item.hit.title}
                          </span>
                          {lead ? (
                            <span className="block truncate text-xs text-wt-text-muted">
                              {lead}
                            </span>
                          ) : null}
                          {skills.length > 0 ? (
                            <span className="mt-1 flex flex-wrap gap-1">
                              {skills.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-md bg-indigo-500/12 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-300"
                                >
                                  {s}
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </span>
                        {item.hit.badge ? (
                          <span className="shrink-0 rounded-md bg-wt-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-wt-text-muted">
                            {item.hit.badge}
                          </span>
                        ) : null}
                        <ArrowRight
                          className={cn(
                            "size-4 shrink-0 text-wt-text-faint transition-opacity",
                            isActive ? "opacity-100" : "opacity-0"
                          )}
                          aria-hidden
                        />
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
                <span className="ml-auto">
                  <kbd className="rounded bg-wt-surface-2 px-1">?</kbd> all shortcuts
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
