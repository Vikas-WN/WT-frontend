import { ShadeGradient } from "./Defs";
import { Face } from "./Face";
import { Arms, Legs } from "./Limbs";
import type { ArtProps } from "./types";

const FUR = "url(#pikachu-fur)";
const LINE = "#b98d22";
const TIP = "#2b3348";

/** Pikachu fan art: yellow fur, black ear tips, red cheeks, lightning tail. */
export function Pikachu(props: ArtProps) {
  return (
    <>
      <defs>
        <ShadeGradient id="pikachu-fur" light="#ffe978" mid="#ffd93e" dark="#f0b81f" />
      </defs>
      <path className="wt-companion-tail" d="M73 76 L84 68 L77 58 L90 53 L83 36 L69 46 L78 55 L68 64Z" fill={FUR} stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
      <path className="wt-companion-tail" d="M73 76 L78 72 L70 69 L68 64Z" fill="#8a5a2b" />
      <Legs trouser="#ffd93e" shoe="#ffd93e" line={LINE} bare />
      <path d="M25 66 Q24 48 48 47 Q72 48 71 66 L68 83 Q48 90 28 83Z" fill={FUR} stroke={LINE} strokeWidth="1" />
      <ellipse cx="48" cy="73" rx="13" ry="12" fill="#ffeb92" />
      <path d="M33 60 Q28 62 30 67 M63 60 Q68 62 66 67" fill="none" stroke="#8a5a2b" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
      <Arms sleeve="#ffd93e" hand="#ffdf5a" handLine={LINE} />
      <ellipse cx="48" cy="41" rx="25" ry="24" fill={FUR} stroke={LINE} strokeWidth="1" />
      <path className="wt-companion-ear-left" d="M28 29 Q15 2 21 3 Q34 8 37 24" fill={FUR} stroke={LINE} strokeWidth="1" />
      <path d="M21 3 Q15 2 22 15 L29 13Z" fill={TIP} />
      <path className="wt-companion-ear-right" d="M60 24 Q63 7 76 3 Q82 3 68 29" fill={FUR} stroke={LINE} strokeWidth="1" />
      <path d="M76 3 Q82 3 74 15 L67 13Z" fill={TIP} />
      <ellipse cx="29" cy="49" rx="5.4" ry="5.2" fill="#f4574a" />
      <ellipse cx="67" cy="49" rx="5.4" ry="5.2" fill="#f4574a" />
      <circle cx="27.5" cy="47.4" r="1.4" fill="#ff9a8a" opacity=".85" />
      <circle cx="65.5" cy="47.4" r="1.4" fill="#ff9a8a" opacity=".85" />
      <path d="M46.5 45.5 Q48 47 49.5 45.5Z" fill="#3a2a22" />
      <Face {...props} style={{ mouth: "#684238", brow: null }} />
      <g className="wt-electric-effects" fill="none" stroke="#f4b728" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 44 L14 39 L18 47 L9 48 M70 44 L81 39 L77 48 L88 49" />
        <path d="M23 55 L13 61 L20 65 M71 55 L82 62 L76 67" />
      </g>
    </>
  );
}
