"use client";

import { useSyncExternalStore } from "react";

import { Companion } from "@/components/mascot/Companion";
import { COMPANIONS, companionById } from "@/constants/companions";
import { PET_COPY, PET_NAME } from "@/constants/petCopy";
import { useAuth } from "@/context/AuthContext";
import { useActiveSeason } from "@/hooks/seasonal/useActiveSeason";
import type { SeasonalThemeId } from "@/types/seasonal";
import { useKnotPet } from "@/hooks/pet/useKnotPet";
import { usePetCharacter, usePetEnabled } from "@/lib/petPreference";
import { cn } from "@/lib/utils";

const SIZE_DESKTOP = 68;
const SIZE_PHONE = 58;
function subscribeViewport(update: () => void) {
  window.addEventListener("resize", update);
  return () => window.removeEventListener("resize", update);
}
function readPetSize() { return window.innerWidth < 640 ? SIZE_PHONE : SIZE_DESKTOP; }
function serverPetSize() { return 0; }

function Pet({ size, firstName, season, onHide }: { size: number; firstName: string | null; season: SeasonalThemeId | null; onHide: () => void }) {
  // The refs are taken out of the hook's result first so the rest (plain state and handlers) can be read freely during render.
  const [character, selectCharacter] = usePetCharacter();
  const definition = companionById(character);
  const { rootRef, innerRef, ...pet } = useKnotPet({ size, firstName, season, character });


  return (
    <>
    <div
      ref={rootRef}
      className="wt-pet fixed left-0 top-0 z-[45] touch-none select-none"
      style={{ width: size, height: size, cursor: "grab" }}
      role="button"
      tabIndex={0}
      aria-label={`${definition.name}, your desk companion. Enter to play, Shift F10 for options.`}
      {...pet.handlers}
    >
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
        <Companion character={character} mood={pet.mood} size={size} animate={pet.mood !== "held"} costume={pet.costume} action={pet.action} />
      </div>

      {pet.menuOpen ? (
        <div
          className={cn("absolute bottom-full z-10 mb-2 w-60 overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 p-1 text-sm shadow-[var(--wt-shadow-lg)]", pet.align === "left" ? "left-0" : "right-0")}
          role="group" aria-label="Companion options"
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(event) => { if (event.key === "Escape") pet.setMenuOpen(false); event.stopPropagation(); }}
        >
          <p className="px-3 py-2 text-xs font-semibold text-wt-text-muted">{definition.name}</p>
          <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-wt-text hover:bg-wt-surface-2" onClick={pet.play}>{definition.action}</button>
          <label className="block border-y border-wt-border px-3 py-2 text-xs text-wt-text-muted">Switch companion
            <select aria-label="Switch companion" value={character} onChange={(event) => { selectCharacter(companionById(event.target.value).id); pet.setMenuOpen(false); }} className="mt-2 h-10 w-full rounded-lg border border-wt-border bg-wt-surface-1 px-2 text-sm text-wt-text">{COMPANIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          </label>
          <button
            type="button"
            className="block w-full rounded-xl px-3 py-2 text-left text-wt-text hover:bg-wt-surface-2"
            onClick={pet.asleep ? () => { pet.setMenuOpen(false); pet.wake(); } : pet.nap}
          >
            {pet.asleep ? PET_COPY.menuWake : PET_COPY.menuNap}
          </button>
          <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-wt-text hover:bg-wt-surface-2" onClick={onHide}>
            Hide {definition.name}
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
  const size = useSyncExternalStore(subscribeViewport, readPetSize, serverPetSize);
  if (!size || !enabled) return null;
  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] || null;
  return <Pet key={size} size={size} firstName={firstName} season={season} onHide={() => setEnabled(false)} />;
}

export { Pet as KnotPetView, PET_NAME };
