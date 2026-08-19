"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileDown, Loader2, Search } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { Button } from "@/components/ui/button";
import { GuideFigure } from "@/components/guide/GuideFigure";
import {
  availableHandbookFilters,
  filterChaptersForHandbook,
  filterChaptersForRoles,
  guideAudienceLabel,
  GUIDE_CHAPTERS,
  handbookMeta,
  resolvePrimaryHandbook,
  type GuideHandbookKind,
} from "@/content/guide/guideContent";
import { exportGuidePdf } from "@/utils/guide/exportGuidePdf";
import { cn } from "@/lib/utils";

const HANDBOOK_FILTER_LABELS: Record<GuideHandbookKind, string> = {
  employee: "Employee handbook",
  hr: "HR handbook",
  manager: "Manager handbook",
};

export function GuidePageClient() {
  const { hasHrAccess, hasManagerAccess, hasDmAccess } = useDashboardAccess();
  const primaryHandbook = useMemo(
    () =>
      resolvePrimaryHandbook({
        hasHrAccess,
        hasManagerAccess,
        hasDmAccess,
      }),
    [hasHrAccess, hasManagerAccess, hasDmAccess]
  );

  const handbookFilters = useMemo(
    () => availableHandbookFilters({ hasHrAccess, hasManagerAccess, hasDmAccess }),
    [hasHrAccess, hasManagerAccess, hasDmAccess]
  );

  const [handbookView, setHandbookView] = useState<GuideHandbookKind>(primaryHandbook);
  const [query, setQuery] = useState("");
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setHandbookView(primaryHandbook);
  }, [primaryHandbook]);

  const roleVisible = useMemo(
    () =>
      filterChaptersForRoles(GUIDE_CHAPTERS, {
        hasHrAccess,
        hasManagerAccess,
        hasDmAccess,
      }),
    [hasHrAccess, hasManagerAccess, hasDmAccess]
  );

  const handbookChapters = useMemo(
    () => filterChaptersForHandbook(roleVisible, handbookView),
    [roleVisible, handbookView]
  );

  const meta = handbookMeta(handbookView);

  const filteredChapters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return handbookChapters;
    return handbookChapters.filter((chapter) => {
      const haystack = [
        chapter.title,
        chapter.summary,
        guideAudienceLabel(chapter.audience, handbookView),
        ...chapter.steps.map((s) => `${s.title} ${s.body} ${s.tip ?? ""}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, handbookChapters, handbookView]);

  useEffect(() => {
    if (!filteredChapters.length) {
      setActiveChapterId(null);
      return;
    }
    if (!activeChapterId || !filteredChapters.some((c) => c.id === activeChapterId)) {
      setActiveChapterId(filteredChapters[0].id);
    }
  }, [filteredChapters, activeChapterId]);

  async function handleDownloadPdf() {
    const chapters = filterChaptersForHandbook(roleVisible, handbookView);
    if (!chapters.length) return;
    setExporting(true);
    try {
      exportGuidePdf(chapters, handbookView);
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardPageShell>
      <div className="relative z-[1] mx-auto max-w-6xl">
        <header className="mb-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--wt-brand)]">
                WebTrak handbook
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-wt-text sm:text-3xl">
                {meta.pageTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-wt-text-muted">{meta.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="brand"
                size="sm"
                className="gap-1.5"
                disabled={exporting || !handbookChapters.length}
                onClick={() => void handleDownloadPdf()}
              >
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileDown className="size-4" />
                )}
                {meta.downloadLabel}
              </Button>
            </div>
          </div>

          {handbookFilters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {handbookFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setHandbookView(filter)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    handbookView === filter
                      ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
                      : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:text-wt-text"
                  )}
                >
                  {HANDBOOK_FILTER_LABELS[filter]}
                </button>
              ))}
            </div>
          ) : null}

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this handbook…"
              className="h-10 w-full rounded-lg border border-wt-border bg-wt-surface-1 pl-9 pr-3 text-sm outline-none focus:border-[var(--wt-brand)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--wt-brand)_20%,transparent)]"
            />
          </div>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <nav
            aria-label="Guide contents"
            className="shrink-0 lg:sticky lg:top-6 lg:w-56"
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
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 flex-1 space-y-8">
            {filteredChapters.length === 0 ? (
              <p className="rounded-xl border border-wt-border bg-wt-surface-1 p-6 text-sm text-wt-text-muted">
                No chapters match your search.
              </p>
            ) : (
              filteredChapters.map((chapter) => (
                <article
                  key={chapter.id}
                  id={`guide-${chapter.id}`}
                  className="scroll-mt-24 rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full border border-wt-border bg-wt-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-wt-text-muted">
                        {guideAudienceLabel(chapter.audience, handbookView)}
                      </span>
                      <h2 className="mt-2 text-xl font-semibold text-wt-text">{chapter.title}</h2>
                      <p className="mt-1 text-sm text-wt-text-muted">{chapter.summary}</p>
                    </div>
                    {chapter.relatedHref ? (
                      <Link
                        href={chapter.relatedHref}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--wt-brand)] hover:underline"
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
