"use client";

import type { ComponentType } from "react";

import { Knot, type KnotMood, type KnotCostume, type KnotAction } from "./Knot";
import { Charmander } from "./companion/Charmander";
import { Dhoni } from "./companion/Dhoni";
import { Goku } from "./companion/Goku";
import { GroundShadow } from "./companion/Limbs";
import { Pikachu } from "./companion/Pikachu";
import type { ArtProps } from "./companion/types";
import { Virat } from "./companion/Virat";
import type { CompanionId } from "@/constants/companions";

const ART: Record<Exclude<CompanionId, "knot">, ComponentType<ArtProps>> = {
  virat: Virat,
  dhoni: Dhoni,
  goku: Goku,
  pikachu: Pikachu,
  charmander: Charmander,
};

const HAPPY_MOODS: readonly KnotMood[] = ["party", "love", "laugh"];
const SURPRISED_MOODS: readonly KnotMood[] = ["held", "oops", "loading", "lost"];

/** Small vector fan-art companions share the same physics, pointer tracking and moods. */
export function Companion({ character, mood = "hello", size = 72, animate = true, costume, action }: { character: CompanionId; mood?: KnotMood; size?: number; animate?: boolean; costume?: KnotCostume; action?: KnotAction }) {
  if (character === "knot") return <Knot mood={mood} size={size} animate={animate} costume={costume} action={action} />;
  const Art = ART[character];
  const art: ArtProps = {
    mood,
    happy: HAPPY_MOODS.includes(mood),
    asleep: mood === "sleep",
    surprised: SURPRISED_MOODS.includes(mood),
  };
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden data-character={character} className={`wt-companion ${animate ? "wt-companion-animated" : ""} wt-companion-${mood}`}>
      <GroundShadow />
      <g className="wt-companion-body">
        <Art {...art} />
        {art.asleep ? <text x="71" y="22" fill="var(--wt-text-muted)" fontSize="13" fontWeight="700">zZ</text> : null}
        {mood === "dizzy" ? <text x="69" y="20" fill="#e7b63c" fontSize="18">✦</text> : null}
      </g>
    </svg>
  );
}
