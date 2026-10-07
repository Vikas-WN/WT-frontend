"use client";

import { Award, Check, FolderKanban, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { MAX_PROJECTS, type ReviewContext } from "@/components/dashboard/pulse/employee/review/reviewModel";
import type { ReviewFormApi } from "@/components/dashboard/pulse/employee/review/useReviewForm";
import { PULSE_COPY } from "@/constants/pulseCopy";
import { cn } from "@/lib/utils";

const CARD = "rounded-2xl border border-wt-border bg-wt-surface-1 p-5 sm:p-6";

function Tile({
  selected,
  disabled,
  onClick,
  title,
  meta,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.99] motion-reduce:transition-none",
        selected
          ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)]"
          : "border-wt-border bg-wt-surface-1 hover:border-[var(--wt-brand)]/40 hover:bg-wt-surface-2/60",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border",
          selected ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "border-wt-border-md bg-wt-surface-1"
        )}
      >
        {selected ? <Check className="size-3.5" aria-hidden /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-wt-text">{title}</span>
        {meta ? <span className="mt-0.5 block truncate text-xs text-wt-text-faint">{meta}</span> : null}
      </span>
    </button>
  );
}

/** Step 1 — what the month was about: projects worked on, certifications
 *  earned and recognitions received. Both cards sit side by side. */
export function WorkStep({
  api,
  ctx,
  projectsLoading,
}: {
  api: ReviewFormApi;
  ctx: ReviewContext;
  projectsLoading: boolean;
}) {
  const { form, actions } = api;
  const selected = form.project_codes.filter((c) => ctx.projectRows.some((p) => p.code === c));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={CARD}>
        <header className="mb-4 flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
            <FolderKanban className="size-4.5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-wt-text">Projects you worked on</h3>
            <p className="text-xs text-wt-text-muted">
              Pick 1 to {MAX_PROJECTS} · {selected.length}/{MAX_PROJECTS} chosen
            </p>
            <p className="mt-0.5 text-xs text-wt-text-muted">
              {ctx.reviewerOptions !== null
                ? PULSE_COPY.reviewerIntro
                : "Your review goes to the managers of the projects you pick, all at once."}
            </p>
          </div>
        </header>
        {projectsLoading ? (
          <SectionLoading label="" />
        ) : ctx.projectRows.length === 0 ? (
          <EmptyState title="No active projects" description="You're not on a project right now — nothing to pick here." />
        ) : (
          <div className="space-y-2">
            {ctx.projectRows.map((p) => (
              <Tile
                key={p.code}
                selected={selected.includes(p.code)}
                disabled={!selected.includes(p.code) && selected.length >= MAX_PROJECTS}
                onClick={() => actions.toggleProject(p.code)}
                title={p.name}
                meta={p.managers.length ? `Reviewed by ${p.managers.map((m) => m.name).join(", ")}` : PULSE_COPY.noProjectManager}
              />
            ))}
          </div>
        )}
      </section>

      <section className={CARD}>
        <header className="mb-4 flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
            <Award className="size-4.5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-wt-text">Certifications &amp; recognition</h3>
            <p className="text-xs text-wt-text-muted">Optional — they add bonus points to your score.</p>
          </div>
        </header>
        {ctx.certRows.length === 0 ? (
          <p className="text-sm text-wt-text-muted">No certifications in the catalog yet.</p>
        ) : (
          <div className="space-y-2">
            {ctx.certRows.map((c) => {
              const claim = form.certifications.find((x) => x.certification_id === c.id);
              return (
                <div key={c.id} className="space-y-1.5">
                  <Tile selected={Boolean(claim)} onClick={() => actions.toggleCertification(c.id)} title={c.name} />
                  {claim ? (
                    <input
                      type="text"
                      value={claim.proof}
                      onChange={(e) => actions.setCertificationProof(c.id, e.target.value)}
                      placeholder="Proof — a link or note (optional)"
                      aria-label={`Proof for ${c.name}`}
                      className="w-full rounded-xl border border-wt-border bg-wt-surface-2/50 px-3.5 py-2 text-sm text-wt-text placeholder:text-wt-text-faint focus:border-[var(--wt-brand)]/60 focus:bg-wt-surface-1 focus:outline-none focus:ring-2 focus:ring-[var(--wt-brand)]/25"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-wt-border bg-wt-surface-2/50 px-3.5 py-3">
          <Sparkles className="size-4 text-amber-500" aria-hidden />
          <label className="text-sm font-medium text-wt-text" htmlFor="recognitions-count">
            Recognitions received
          </label>
          <input
            id="recognitions-count"
            type="number"
            min={0}
            value={form.recognitions_count}
            onChange={(e) => actions.patch({ recognitions_count: Math.max(0, Number(e.target.value) || 0) })}
            className="ml-auto w-20 rounded-lg border border-wt-border bg-wt-surface-1 px-2 py-1 text-right text-sm text-wt-text"
          />
        </div>
      </section>
    </div>
  );
}
