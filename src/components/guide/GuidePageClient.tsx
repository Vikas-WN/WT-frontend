"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, FileDown, Loader2, Search } from "lucide-react";
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
  type GuideAudience,
  type GuideChapter,
  type GuideHandbookKind,
} from "@/content/guide/guideContent";
import { exportGuidePdf } from "@/utils/guide/exportGuidePdf";
import { cn } from "@/lib/utils";

const HANDBOOK_FILTER_LABELS: Record<GuideHandbookKind, string> = {
  employee: "Employee",
  hr: "HR",
  manager: "Manager",
};

const AUDIENCE_GROUP_ORDER: GuideAudience[] = ["shared", "hr", "manager"];

function groupHeading(audience: GuideAudience, handbook: GuideHandbookKind): string {
  if (audience === "shared") return handbook === "employee" ? "Basics" : "For everyone";
  if (audience === "hr") return "HR workflows";
  return "Manager workflows";
}

export function GuidePageClient() {
  const { hasHrAccess, hasManagerAccess, hasDmAccess } = useDashboardAccess();

  const primaryHandbook = useMemo(
    () => resolvePrimaryHandbook({ hasHrAccess, hasManagerAccess, hasDmAccess }),
    [hasHrAccess, hasManagerAccess, hasDmAccess]
  );

  const handbookFilters = useMemo(
    () => availableHandbookFilters({ hasHrAccess, hasManagerAccess, hasDmAccess }),
    [hasHrAccess, hasManagerAccess, hasDmAccess]
  );

  // Nullable override so we never need an effect to "reset" the view when the
  // resolved primary handbook arrives after role data loads.
  const [handbookOverride, setHandbookOverride] = useState<GuideHandbookKind | null>(null);
  const handbookView =
    handbookOverride && handbookFilters.includes(handbookOverride)
      ? handbookOverride
      : primaryHandbook;

  const [query, setQuery] = useState("");
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const roleVisible = useMemo(
    () =>
      filterChaptersForRoles(GUIDE_CHAPTERS, { hasHrAccess, hasManagerAccess, hasDmAccess }),
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

  const groupedChapters = useMemo(() => {
    return AUDIENCE_GROUP_ORDER.map((audience) => ({
      audience,
      chapters: filteredChapters.filter((c) => c.audience === audience),
    })).filter((group) => group.chapters.length > 0);
  }, [filteredChapters]);

  // Active chapter for the contents rail. Derived so an empty / changed result
  // set never needs a state-sync effect.
  const activeChapter =
    (activeChapterId && filteredChapters.some((c) => c.id === activeChapterId)
      ? activeChapterId
      : filteredChapters[0]?.id) ?? null;

  // Scroll spy: highlight the chapter nearest the top of the reading column.
  const contentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("[data-guide-chapter]")
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveChapterId(visible[0].target.getAttribute("data-guide-chapter"));
        }
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [filteredChapters]);

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

  const totalCount = filteredChapters.length;

  return (
    <main className="wt-page-enter mx-auto w-full max-w-[1200px] px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
      <header className="border-b border-wt-border pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--wt-brand)]">
              WebTrak Handbook
            </p>
            <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-wt-text sm:text-[2rem]">
              {meta.pageTitle}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-wt-text-muted">
              {meta.subtitle}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 self-start sm:self-auto"
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the handbook…"
              aria-label="Search the handbook"
              className="h-10 w-full rounded-lg border border-wt-border bg-wt-surface-1 pl-9 pr-3 text-sm text-wt-text outline-none transition-colors placeholder:text-wt-text-muted focus:border-[var(--wt-brand)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--wt-brand)_20%,transparent)]"
            />
          </div>

          {handbookFilters.length > 0 ? (
            <div className="inline-flex rounded-lg border border-wt-border bg-wt-surface-1 p-0.5">
              {handbookFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setHandbookOverride(filter)}
                  className={cn(
                    "rounded-[7px] px-3 py-1.5 text-xs font-medium transition-colors",
                    handbookView === filter
                      ? "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
                      : "text-wt-text-muted hover:text-wt-text"
                  )}
                >
                  {HANDBOOK_FILTER_LABELS[filter]} handbook
                </button>
              ))}
            </div>
          ) : null}

          <span className="text-xs text-wt-text-muted sm:ml-auto">
            {totalCount} {totalCount === 1 ? "article" : "articles"}
          </span>
        </div>
      </header>

      <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:gap-16">
        <nav
          aria-label="Handbook contents"
          className="lg:sticky lg:top-6 lg:h-[calc(100dvh-7rem)] lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:pb-10"
        >
          {groupedChapters.length === 0 ? (
            <p className="text-xs text-wt-text-muted">No matches.</p>
          ) : (
            <div className="space-y-6">
              {groupedChapters.map((group) => (
                <div key={group.audience}>
                  <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-wt-text-muted">
                    {groupHeading(group.audience, handbookView)}
                  </p>
                  <ul className="space-y-0.5">
                    {group.chapters.map((chapter) => {
                      const active = activeChapter === chapter.id;
                      return (
                        <li key={chapter.id}>
                          <a
                            href={`#guide-${chapter.id}`}
                            onClick={() => setActiveChapterId(chapter.id)}
                            aria-current={active ? "true" : undefined}
                            className={cn(
                              "block border-l-2 py-1.5 pl-3 pr-2 text-[13px] leading-snug transition-colors",
                              active
                                ? "border-[var(--wt-brand)] font-medium text-wt-text"
                                : "border-transparent text-wt-text-muted hover:border-wt-border hover:text-wt-text"
                            )}
                          >
                            {chapter.title}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </nav>

        <div ref={contentRef} className="min-w-0 flex-1 lg:max-w-[46rem]">
          {filteredChapters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-wt-border bg-wt-surface-1 px-6 py-14 text-center">
              <p className="text-sm font-medium text-wt-text">No articles match “{query}”.</p>
              <p className="mt-1 text-sm text-wt-text-muted">
                Try a different term, or clear the search to browse everything.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => setQuery("")}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredChapters.map((chapter) => (
                <GuideChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  handbookView={handbookView}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function GuideChapterCard({
  chapter,
  handbookView,
}: {
  chapter: GuideChapter;
  handbookView: GuideHandbookKind;
}) {
  return (
    <article
      id={`guide-${chapter.id}`}
      data-guide-chapter={chapter.id}
      className="scroll-mt-24 rounded-xl border border-wt-border bg-wt-surface-1 p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-wt-border bg-wt-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-wt-text-muted">
          {guideAudienceLabel(chapter.audience, handbookView)}
        </span>
        {chapter.relatedHref ? (
          <Link
            href={chapter.relatedHref}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--wt-brand)] hover:underline"
          >
            Open in WebTrak
            <ArrowUpRight className="size-3.5" />
          </Link>
        ) : null}
      </div>

      <h2 className="mt-3 text-lg font-semibold tracking-tight text-wt-text sm:text-xl">
        {chapter.title}
      </h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-wt-text-muted">
        {chapter.summary}
      </p>

      {chapter.figureId ? (
        <div className="mt-5">
          <GuideFigure figureId={chapter.figureId} />
        </div>
      ) : null}

      <ol className="mt-6 space-y-5">
        {chapter.steps.map((step, index) => (
          <li key={step.title} className="flex gap-3.5">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--wt-brand-soft)] text-[11px] font-semibold tabular-nums text-[var(--wt-brand)]">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold text-wt-text">{step.title}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-wt-text-muted">
                {step.body}
              </p>
              {step.tip ? (
                <p className="mt-2.5 border-l-2 border-[color-mix(in_srgb,var(--wt-brand)_45%,transparent)] bg-wt-surface-2 py-1.5 pl-3 pr-3 text-[13px] leading-relaxed text-wt-text-muted">
                  <span className="font-semibold text-[var(--wt-brand)]">Tip</span>{" "}
                  {step.tip}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
