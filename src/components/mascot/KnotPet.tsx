"use client";

import { useEffect, useState } from "react";

import { Knot } from "@/components/mascot/Knot";
import { PET_COPY, PET_NAME } from "@/constants/petCopy";
import { useAuth } from "@/context/AuthContext";
import { useActiveSeason } from "@/hooks/seasonal/useActiveSeason";
import type { SeasonalThemeId } from "@/types/seasonal";
import { useKnotPet } from "@/hooks/pet/useKnotPet";
import { usePetEnabled } from "@/lib/petPreference";
import { cn } from "@/lib/utils";

const SIZE_DESKTOP = 72;
const SIZE_PHONE = 58;

function Pet({ size, firstName, season, onHide }: { size: number; firstName: string | null; season: SeasonalThemeId | null; onHide: () => void }) {
  // The refs are taken out of the hook's result first so the rest (plain state and handlers) can be read freely during render.
  const { rootRef, innerRef, ...pet } = useKnotPet({ size, firstName, season });
  const bubbleSide =
    pet.align === "left" ? "left-0 items-start" : pet.align === "right" ? "right-0 items-end" : "left-1/2 -translate-x-1/2 items-center";

  return (
    <>
    <div
      ref={rootRef}
      className="wt-pet fixed left-0 top-0 z-[45] touch-none select-none"
      style={{ width: size, height: size, cursor: "grab" }}
      role="button"
      tabIndex={0}
      aria-label={PET_COPY.ariaLabel}
      {...pet.handlers}
    >
      {pet.bubble ? (
        <div className={cn("pointer-events-none absolute bottom-full mb-1 flex w-max max-w-[15rem] flex-col", bubbleSide)} role="status">
          <span className="wt-pet-bubble rounded-2xl border border-wt-border bg-wt-surface-1 px-3 py-1.5 text-xs font-medium text-wt-text shadow-[var(--wt-shadow-md)]">
            {pet.bubble}
          </span>
        </div>
      ) : null}

      {pet.hearts.map((id, i) => (
        <span
          key={id}
          aria-hidden
          className="wt-pet-heart pointer-events-none absolute text-base"
          style={{ left: size * (0.2 + ((i * 37) % 60) / 100), top: size * 0.1 }}
        >
          ❤
        </span>
      ))}

      <div ref={innerRef} className="wt-pet-inner h-full w-full" style={{ transformOrigin: "50% 100%" }}>
        <Knot mood={pet.mood} size={size} animate={pet.mood !== "held"} costume={pet.costume} action={pet.action} />
      </div>

      {pet.menuOpen ? (
        <div
          className={cn("absolute bottom-full z-10 mb-2 w-48 overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 p-1 text-sm shadow-[var(--wt-shadow-lg)]", pet.align === "left" ? "left-0" : "right-0")}
          role="menu"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button type="button" role="menuitem" className="block w-full rounded-xl px-3 py-2 text-left text-wt-text hover:bg-wt-surface-2" onClick={pet.talk}>
            {PET_COPY.menuTalk}
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full rounded-xl px-3 py-2 text-left text-wt-text hover:bg-wt-surface-2"
            onClick={pet.asleep ? () => { pet.setMenuOpen(false); pet.wake(); } : pet.nap}
          >
            {pet.asleep ? PET_COPY.menuWake : PET_COPY.menuNap}
          </button>
          <button type="button" role="menuitem" className="block w-full rounded-xl px-3 py-2 text-left text-wt-text hover:bg-wt-surface-2" onClick={onHide}>
            {PET_COPY.menuHide}
            <span className="block text-[11px] font-normal text-wt-text-faint">{PET_COPY.menuHideHint}</span>
          </button>
        </div>
      ) : null}
    </div>
    {pet.diya ? (
        <div
          aria-hidden
          className="wt-pet-diya pointer-events-none fixed z-[44]"
          style={{ left: pet.diya.x, bottom: 12 }}
        >
          <svg width="44" height="36" viewBox="0 0 84 64">
            <ellipse className="wt-deco-glow" cx="42" cy="28" rx="34" ry="24" fill="#fbbf24" opacity=".35" />
            <path className="wt-deco-flame" d="M42 4 C 33 18 32 27 42 33 C 52 27 51 18 42 4 Z" fill="#f97316" />
            <path className="wt-deco-flame" d="M42 14 C 38 21 38 27 42 30 C 46 27 46 21 42 14 Z" fill="#fde68a" />
            <path d="M8 36 C 10 54 26 60 42 60 C 58 60 74 54 76 36 C 62 42 22 42 8 36 Z" fill="#c2410c" />
            <path d="M8 36 C 22 42 62 42 76 36 C 70 31 14 31 8 36 Z" fill="#ea580c" />
          </svg>
        </div>
      ) : null}

    </>
  );
}

/** Knot, the desk pet: wanders along the bottom of the window, follows your cursor with its eyes, can be dragged, thrown, poked,
 *  petted and double-clicked, naps when you are away and cheers when you approve something. Hide it from its right-click menu. */
export function KnotPet() {
  const { user } = useAuth();
  const [enabled, setEnabled] = usePetEnabled();
  const season = useActiveSeason();
  // UI state: render only after mount — the pet is positioned from the real window size, which the server does not know.
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState(SIZE_DESKTOP);

  // Side effect: read the window size, and follow it when the phone is turned.
  useEffect(() => {
    const update = () => setSize(window.innerWidth < 640 ? SIZE_PHONE : SIZE_DESKTOP);
    update();
    setMounted(true);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!mounted || !enabled) return null;
  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] || null;
  return <Pet key={size} size={size} firstName={firstName} season={season} onHide={() => setEnabled(false)} />;
}

export { Pet as KnotPetView, PET_NAME };
