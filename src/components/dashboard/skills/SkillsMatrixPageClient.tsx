"use client";

import { useState, type FormEvent } from "react";
import { LayoutGrid, Search, Sparkles, Users } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { UserAvatar } from "@/components/dashboard/ui/profile";
import { Button } from "@/components/ui/button";
import { RATING_CELL_CLASS, SKILLS_COPY } from "@/constants/skillsMatrix";
import { useSkillsSearch } from "@/hooks/skills/useSkillsSearch";
import { cn } from "@/lib/utils";
import type { SkillsInterpretation, SkillsPerson } from "@/types/skillsMatrix";

type View = "cards" | "matrix";

function UnderstoodAs({ read }: { read: SkillsInterpretation }) {
  const chips: string[] = [
    ...read.skills.map((s) => s),
    ...(read.min_rating ? [`rated ${read.min_rating}+`] : []),
    ...(read.availability ? [`${read.min_free_percent ?? 50}%+ free ${read.availability}`] : []),
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-wt-text-muted">
      <span className="font-medium">{SKILLS_COPY.understoodAs}:</span>
      {chips.length === 0 ? (
        <span>{SKILLS_COPY.noSkills}</span>
      ) : (
        chips.map((chip) => (
          <span key={chip} className="rounded-full border border-[var(--wt-brand)]/25 bg-[var(--wt-brand-soft)] px-2.5 py-1 font-semibold text-[var(--wt-brand)]">
            {chip}
          </span>
        ))
      )}
    </div>
  );
}

function RatingPip({ rating, label }: { rating: number | null; label: string }) {
  return (
    <span
      title={rating ? `${label}: ${rating}/5` : `${label}: not listed`}
      className={cn(
        "inline-flex min-w-7 items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        rating ? RATING_CELL_CLASS[rating] : "border border-dashed border-wt-border text-wt-text-faint"
      )}
    >
      {rating ?? "–"}
    </span>
  );
}

function FreeBadge({ person }: { person: SkillsPerson }) {
  if (person.free_percent == null) return null;
  const tone =
    person.free_percent >= 100
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}>{person.free_label}</span>;
}

function PeopleCards({ people, columns }: { people: SkillsPerson[]; columns: string[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {people.map((p) => (
        <li key={p.user_id} className="rounded-2xl border border-wt-border bg-wt-surface-1 p-4 transition-shadow hover:shadow-[var(--wt-shadow-md)]">
          <div className="flex items-start gap-3">
            <UserAvatar profile={{ name: p.name, emp_id: p.emp_id, email: p.email }} fallbackName={p.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-wt-text">{p.name}</p>
              <p className="truncate text-xs text-wt-text-muted">{[p.designation, p.department, p.emp_id].filter(Boolean).join(" · ")}</p>
            </div>
            <FreeBadge person={p} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {columns.map((col, i) => (
              <span key={col} className="inline-flex items-center gap-1.5 rounded-lg bg-wt-surface-2/70 py-1 pl-2.5 pr-1 text-xs text-wt-text">
                {col}
                <RatingPip rating={p.ratings[i] ?? null} label={col} />
              </span>
            ))}
          </div>
          {p.projects.length > 0 ? (
            <p className="mt-3 truncate text-xs text-wt-text-faint">On: {p.projects.join(", ")}</p>
          ) : (
            <p className="mt-3 text-xs text-wt-text-faint">Not on a client project</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function MatrixTable({ people, columns }: { people: SkillsPerson[]; columns: string[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-wt-border bg-wt-surface-1">
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-wt-border bg-wt-surface-2/60 text-left text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
            <th className="sticky left-0 bg-wt-surface-2/90 px-4 py-2.5 backdrop-blur">Employee</th>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2.5 text-center">
                {c}
              </th>
            ))}
            <th className="px-4 py-2.5 text-right">Availability</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-wt-border">
          {people.map((p) => (
            <tr key={p.user_id} className="hover:bg-wt-surface-2/40">
              <td className="sticky left-0 bg-wt-surface-1 px-4 py-2.5">
                <p className="font-medium text-wt-text">{p.name}</p>
                <p className="text-xs text-wt-text-muted">{p.department ?? p.emp_id}</p>
              </td>
              {columns.map((c, i) => (
                <td key={c} className="px-3 py-2.5 text-center">
                  <RatingPip rating={p.ratings[i] ?? null} label={c} />
                </td>
              ))}
              <td className="px-4 py-2.5 text-right">
                {p.free_percent == null ? <span className="text-xs text-wt-text-faint">—</span> : <FreeBadge person={p} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Skills matrix: ask a staffing question in plain English, see who matches (and how free they are), or the whole grid. */
export function SkillsMatrixPageClient() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("cards");
  const { data, isLoading, isError, isFetching } = useSkillsSearch(query);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setQuery(draft.trim());
  };
  const ask = (text: string) => {
    setDraft(text);
    setQuery(text);
  };

  return (
    <DashboardPageShell className="wt-detail-page">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="relative overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 p-5 sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_120%_at_0%_0%,color-mix(in_srgb,var(--wt-brand)_9%,transparent),transparent_60%)]"
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-brand)]">
              <Sparkles className="size-3.5" aria-hidden /> {SKILLS_COPY.title}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-wt-text-muted">{SKILLS_COPY.subtitle}</p>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row" role="search">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-wt-text-faint" aria-hidden />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={SKILLS_COPY.placeholder}
                  aria-label="Staffing question"
                  className="h-12 w-full rounded-2xl border border-wt-border bg-wt-surface-1 pl-10 pr-4 text-sm text-wt-text placeholder:text-wt-text-faint focus:border-[var(--wt-brand)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--wt-brand)]/25"
                />
              </div>
              <Button type="submit" variant="brand" size="lg" className="h-12 px-6">
                {SKILLS_COPY.search}
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {SKILLS_COPY.examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => ask(example)}
                  className="rounded-full border border-wt-border bg-wt-surface-1 px-3 py-1 text-xs text-wt-text-muted transition-colors hover:border-[var(--wt-brand)]/40 hover:text-wt-text"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isLoading ? (
          <SectionLoading label="" />
        ) : isError || !data ? (
          <EmptyState title={SKILLS_COPY.errorTitle} description={SKILLS_COPY.errorBody} />
        ) : (
          <div className={cn("space-y-4 transition-opacity", isFetching && "opacity-60")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <UnderstoodAs read={data.interpretation} />
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-wt-text">
                  <Users className="size-4 text-[var(--wt-brand)]" aria-hidden />
                  {data.total} {data.total === 1 ? "person" : "people"}
                </span>
                <div className="inline-flex rounded-xl border border-wt-border bg-wt-surface-1 p-0.5" role="tablist" aria-label="View">
                  {(["cards", "matrix"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="tab"
                      aria-selected={view === v}
                      onClick={() => setView(v)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[0.65rem] px-3 py-1.5 text-xs font-semibold transition-colors",
                        view === v ? "bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "text-wt-text-muted hover:text-wt-text"
                      )}
                    >
                      {v === "matrix" ? <LayoutGrid className="size-3.5" aria-hidden /> : <Users className="size-3.5" aria-hidden />}
                      {v === "cards" ? SKILLS_COPY.cards : SKILLS_COPY.matrix}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {data.people.length === 0 ? (
              <EmptyState title={SKILLS_COPY.emptyTitle} description={SKILLS_COPY.emptyBody} />
            ) : view === "cards" ? (
              <PeopleCards people={data.people} columns={data.columns} />
            ) : (
              <MatrixTable people={data.people} columns={data.columns} />
            )}

            {data.suggestions.length > 0 ? (
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-wt-text-faint">{SKILLS_COPY.popular}</p>
                <div className="flex flex-wrap gap-2">
                  {data.suggestions.map((s) => (
                    <button
                      key={s.skill}
                      type="button"
                      onClick={() => ask(s.skill)}
                      className="rounded-full border border-wt-border bg-wt-surface-1 px-3 py-1 text-xs text-wt-text-muted transition-colors hover:border-[var(--wt-brand)]/40 hover:text-wt-text"
                    >
                      {s.skill} <span className="tabular-nums text-wt-text-faint">{s.people}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </DashboardPageShell>
  );
}
