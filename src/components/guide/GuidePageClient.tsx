"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileDown, Search } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { Button } from "@/components/ui/button";
import { GuideFigure } from "@/components/guide/GuideFigure";
import {
  filterChaptersByAudience,
  filterChaptersForRoles,
  guideAudienceLabel,
  GUIDE_CHAPTERS,
  type GuideExportAudience,
} from "@/content/guide/guideContent";
import { cn } from "@/lib/utils";

const AUDIENCE_FILTERS: Array<{ id: GuideExportAudience; label: string }> = [
  { id: "all", label: "All visible" },
  { id: "hr", label: "HR handbook" },
  { id: "manager", label: "Manager handbook" },
];

function exportPdf(audience: GuideExportAudience) {
  document.body.classList.add("guide-printing");
  document.body.dataset.guideExport = audience;
  window.print();
}

export function GuidePageClient() {
  const { hasHrAccess, hasManagerAccess } = useDashboardAccess();
  const [query, setQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<GuideExportAudience>("all");
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  const roleVisible = useMemo(
    () =>
      filterChaptersForRoles(GUIDE_CHAPTERS, {
        hasHrAccess,
        hasManagerAccess,
      }),
    [hasHrAccess, hasManagerAccess]
  );

  const visibleChapters = useMemo(
    () => filterChaptersByAudience(roleVisible, audienceFilter),
    [roleVisible, audienceFilter]
  );

  const filteredChapters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleChapters;
    return visibleChapters.filter((chapter) => {
      const haystack = [
        chapter.title,
        chapter.summary,
        guideAudienceLabel(chapter.audience),
        ...chapter.steps.map((s) => `${s.title} ${s.body} ${s.tip ?? ""}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, visibleChapters]);

  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove("guide-printing");
      delete document.body.dataset.guideExport;
    };
    window.addEventListener("afterprint", cleanup);
    return () => {
      window.removeEventListener("afterprint", cleanup);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!filteredChapters.length) {
      setActiveChapterId(null);
      return;
    }
    if (!activeChapterId || !filteredChapters.some((c) => c.id === activeChapterId)) {
      setActiveChapterId(filteredChapters[0].id);
    }
  }, [filteredChapters, activeChapterId]);

  return (
    <DashboardPageShell>
      <div className="relative z-[1] mx-auto max-w-6xl guide-screen-root">
        <header className="mb-6 space-y-3 print:hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--wt-brand)]">
                WebTrak handbook
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-wt-text sm:text-3xl">
                HR & Manager Guide
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-wt-text-muted">
                Step-by-step instructions for HR and people managers. Use Export PDF to save
                the current view — choose &ldquo;Save as PDF&rdquo; in the print dialog.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => exportPdf(audienceFilter)}
              >
                <FileDown className="size-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {AUDIENCE_FILTERS.map((filter) => {
              const disabled =
                filter.id === "hr" && !hasHrAccess
                  ? true
                  : filter.id === "manager" && !hasManagerAccess;
              if (disabled) return null;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setAudienceFilter(filter.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    audienceFilter === filter.id
                      ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
                      : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:text-wt-text"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guide…"
              className="h-10 w-full rounded-lg border border-wt-border bg-wt-surface-1 pl-9 pr-3 text-sm outline-none focus:border-[var(--wt-brand)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--wt-brand)_20%,transparent)]"
            />
          </div>
        </header>

        <div className="guide-print-cover hidden print:block">
          <h1 className="text-3xl font-bold text-wt-text">WebTrak HR & Manager Guide</h1>
          <p className="mt-2 text-sm text-wt-text-muted">
            Generated from the in-app handbook. Audience filter: {audienceFilter}.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <nav
            aria-label="Guide contents"
            className="guide-toc shrink-0 lg:sticky lg:top-6 lg:w-56 print:hidden"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-wt-text-muted">
              Contents
            </p>
            <ul className="max-h-[min(70vh,560px)] space-y-0.5 overflow-y-auto rounded-xl border border-wt-border bg-wt-surface-1 p-2">
              {filteredChapters.map((chapter) => (
                <li key={chapter.id}>
                  <a
                    href={`#guide-${chapter.id}`}
                    onClick={() => setActiveChapterId(chapter.id)}
                    className={cn(
                      "block rounded-lg px-2.5 py-2 text-left text-xs leading-snug transition-colors",
                      activeChapterId === chapter.id
                        ? "bg-[var(--wt-brand-soft)] font-medium text-[var(--wt-brand)]"
                        : "text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text"
                    )}
                  >
                    <span className="block">{chapter.title}</span>
                    <span className="mt-0.5 block text-[10px] opacity-70">
                      {guideAudienceLabel(chapter.audience)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div data-guide-print-root className="min-w-0 flex-1 space-y-8">
            {filteredChapters.length === 0 ? (
              <p className="rounded-xl border border-wt-border bg-wt-surface-1 p-6 text-sm text-wt-text-muted">
                No chapters match your search. Try a different keyword or audience filter.
              </p>
            ) : (
              filteredChapters.map((chapter) => (
                <article
                  key={chapter.id}
                  id={`guide-${chapter.id}`}
                  data-guide-chapter
                  data-audience={chapter.audience}
                  className="guide-chapter scroll-mt-24 rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm sm:p-6 print:break-before-page print:rounded-none print:border-0 print:shadow-none"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full border border-wt-border bg-wt-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-wt-text-muted">
                        {guideAudienceLabel(chapter.audience)}
                      </span>
                      <h2 className="mt-2 text-xl font-semibold text-wt-text">{chapter.title}</h2>
                      <p className="mt-1 text-sm text-wt-text-muted">{chapter.summary}</p>
                    </div>
                    {chapter.relatedHref ? (
                      <Link
                        href={chapter.relatedHref}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--wt-brand)] hover:underline print:hidden"
                      >
                        Open in WebTrak
                        <ExternalLink className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>

                  {chapter.figureId ? <GuideFigure figureId={chapter.figureId} /> : null}

                  <ol className="mt-4 space-y-4">
                    {chapter.steps.map((step, index) => (
                      <li key={step.title} className="flex gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--wt-brand-soft)] text-xs font-semibold tabular-nums text-[var(--wt-brand)]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-wt-text">{step.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-wt-text-muted">
                            {step.body}
                          </p>
                          {step.tip ? (
                            <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                              Tip: {step.tip}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardPageShell>
  );
}
