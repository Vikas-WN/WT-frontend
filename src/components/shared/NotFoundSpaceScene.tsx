/** Soft looping space scene — rings + upright satellite around a static 404. */
export function NotFoundSpaceScene({ className = "" }: { className?: string }) {
  return (
    <div className={`wt-space ${className}`} aria-hidden="true">
      <div className="wt-space-stage relative mx-auto flex h-[220px] w-full max-w-[340px] items-center justify-center sm:h-[260px]">
        {/* Stars */}
        <span className="wt-space-star wt-space-star--1 absolute left-[8%] top-[18%] size-1 rounded-full bg-[var(--wt-brand)]" />
        <span className="wt-space-star wt-space-star--2 absolute left-[18%] top-[62%] size-1.5 rounded-full bg-[var(--wt-brand)]" />
        <span className="wt-space-star wt-space-star--3 absolute right-[12%] top-[22%] size-1 rounded-full bg-[var(--wt-brand)]" />
        <span className="wt-space-star wt-space-star--4 absolute right-[22%] top-[70%] size-1.5 rounded-full bg-[var(--wt-brand)]" />
        <span className="wt-space-star wt-space-star--5 absolute left-[42%] top-[8%] size-1 rounded-full bg-wt-text-muted" />
        <span className="wt-space-star wt-space-star--6 absolute right-[38%] bottom-[10%] size-1 rounded-full bg-wt-text-muted" />

        {/* Orbit rings */}
        <div className="wt-space-ring wt-space-ring--outer absolute inset-[6%] rounded-full border border-dashed border-[var(--wt-brand)]/25" />
        <div className="wt-space-ring wt-space-ring--inner absolute inset-[18%] rounded-full border border-[var(--wt-brand)]/20" />

        {/* Orbiting satellite (counter-rotated so it stays upright) */}
        <div className="wt-space-orbit absolute inset-0">
          <div className="wt-space-sat absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="wt-space-sat-inner flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--wt-brand)] shadow-[0_0_12px_var(--wt-brand)]" />
              <span className="h-1.5 w-5 rounded-full bg-wt-text/80" />
              <span className="h-3 w-1 rounded-sm bg-wt-text-muted" />
            </div>
          </div>
        </div>

        {/* Static 404 — never rotates */}
        <p className="wt-space-code relative z-10 font-[family-name:var(--font-brand)] text-[clamp(4.75rem,18vw,6.75rem)] font-bold leading-none tracking-[-0.07em] text-[var(--wt-brand)]">
          404
        </p>
      </div>
    </div>
  );
}
