"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/dashboard/ui/ModalPortal";
import { MODAL_OVERLAY_CLASS } from "@/components/dashboard/ui/uiLayout";
import type { ReleaseNote } from "@/constants/releaseNotes";
import { WHATS_NEW_COPY } from "@/constants/whatsNew";
import { cn } from "@/lib/utils";
import { formatReleaseDate } from "@/utils/whatsNew";

/** The announcement: what changed in the update(s) the user hasn't seen yet. */
export function WhatsNewDialog({
  releases,
  isPreview = false,
  onClose,
}: {
  releases: readonly ReleaseNote[];
  isPreview?: boolean;
  onClose: () => void;
}) {
  const primary = useRef<HTMLButtonElement>(null);
  // Focus lands on the button that dismisses it, so Enter closes it and keyboard users aren't
  // left on whatever page control was focused underneath.
  useEffect(() => {
    primary.current?.focus();
  }, []);

  const several = releases.length > 1;
  return (
    <ModalPortal onEscape={onClose}>
      <div
        className={cn(MODAL_OVERLAY_CLASS, "z-[300]")}
        role="presentation"
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="whats-new-title"
          className="flex max-h-[min(40rem,88vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-wt-border px-6 py-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="whats-new-title" className="text-lg font-semibold text-wt-text">
                {WHATS_NEW_COPY.title}
              </h2>
              {isPreview ? <p className="text-xs text-amber-700 dark:text-amber-400">{WHATS_NEW_COPY.previewNotice}</p> : null}
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto px-6 py-5">
            {releases.map((release) => (
              <section key={release.id} aria-label={release.title}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-sm font-semibold text-wt-text">{release.title}</h3>
                  {several || release.releasedOn ? (
                    <span className="text-xs text-wt-text-muted">{formatReleaseDate(release.releasedOn)}</span>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-3.5">
                  {release.highlights.map((highlight) => (
                    <li key={highlight.title} className="flex gap-3">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[var(--wt-brand)]" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-wider text-wt-text-muted uppercase">{highlight.area}</p>
                        <p className="text-sm font-medium text-wt-text">{highlight.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-wt-text-muted">{highlight.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-wt-border px-6 py-4">
            <p className="text-xs text-wt-text-muted">{WHATS_NEW_COPY.footnote}</p>
            <Button ref={primary} type="button" variant="brand" className="min-w-[7rem] shrink-0" onClick={onClose}>
              {WHATS_NEW_COPY.dismiss}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
