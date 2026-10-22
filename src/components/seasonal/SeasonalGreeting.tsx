"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SEASONAL_COPY } from "@/constants/seasonal";
import { useActiveSeason } from "@/hooks/seasonal/useActiveSeason";
import { SeasonalArtwork } from "./SeasonalDecor";
import { burstSparks, throwPowder } from "@/lib/fireworks";
import { emitPetEvent } from "@/lib/petEvents";
import { Button } from "@/components/ui/button";

const ACTIONS = { DIWALI: "Light a diya", HOLI: "Play with colour", CHRISTMAS: "Spread some cheer", CRICKET: "Cheer for the team" };
export function SeasonalGreeting() {
  const theme = useActiveSeason();
  const [celebrated, setCelebrated] = useState(false);
  if (!theme) return null;
  const copy = SEASONAL_COPY[theme];
  return (
    <section className="wt-festival-card flex flex-wrap items-center gap-5 overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 px-5 py-5 sm:px-7" data-festival={theme.toLowerCase()} aria-label={copy.label}>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-wt-text-faint">A moment together</p>
        <h2 className="mt-2 font-[family-name:var(--font-brand)] text-xl font-semibold tracking-tight text-wt-text">{copy.greeting}</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-wt-text-muted">{copy.blurb}</p>
        <Button className="mt-4" variant="outline" onClick={(event) => {
          setCelebrated(true);
          emitPetEvent("success");
          if (!document.documentElement.classList.contains("wt-reduce-motion")) {
            const rect = event.currentTarget.getBoundingClientRect();
            const options = { x: rect.left + rect.width / 2, y: rect.top, count: 35 };
            if (theme === "HOLI") throwPowder(options); else burstSparks(options);
          }
        }}><Sparkles className="size-4" />{ACTIONS[theme]}</Button>
        <span className="sr-only" role="status">{celebrated ? "A little celebration, just for you." : ""}</span>
      </div>
      <div className="hidden text-[var(--wt-season-tint,var(--wt-brand))] sm:block"><SeasonalArtwork season={theme} /></div>
    </section>
  );
}
