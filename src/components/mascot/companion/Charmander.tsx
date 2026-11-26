import { ShadeGradient } from "./Defs";
import { Face } from "./Face";
import { Arms, Legs } from "./Limbs";
import type { ArtProps } from "./types";

const SKIN_FILL = "url(#charmander-skin)";
const LINE = "#c4772c";
const BELLY = "#ffe3a6";

/** Charmander fan art: orange body, cream belly, blunt snout, teal eyes and a flame-tipped tail. */
export function Charmander(props: ArtProps) {
  return (
    <>
      <defs>
        <ShadeGradient id="charmander-skin" light="#ffb868" mid="#f79b4a" dark="#e0802f" />
        <radialGradient id="charmander-flame" cx="50%" cy="75%" r="70%">
          <stop offset="0" stopColor="#ffe48a" />
          <stop offset="0.5" stopColor="#ffb13d" />
          <stop offset="1" stopColor="#f2652d" />
        </radialGradient>
      </defs>
      <path className="wt-companion-tail" d="M68 79 Q89 83 84 62" fill="none" stroke={LINE} strokeWidth="10.5" strokeLinecap="round" />
      <path className="wt-companion-tail" d="M68 79 Q89 83 84 62" fill="none" stroke="#f79b4a" strokeWidth="8.5" strokeLinecap="round" />
      <path className="wt-companion-flame" d="M84 66 C68 60 83 44 80 39 C96 51 95 62 84 66Z" fill="url(#charmander-flame)" />
      <path className="wt-companion-flame" d="M84 63 Q78 56 85 49 Q91 58 84 63Z" fill="#fff0b0" />
      <Legs trouser="#f79b4a" shoe="#f79b4a" line={LINE} bare />
      <path d="M25 66 Q24 48 48 47 Q72 48 71 66 L68 83 Q48 90 28 83Z" fill={SKIN_FILL} stroke={LINE} strokeWidth="1" />
      <ellipse cx="48" cy="73" rx="13" ry="12" fill={BELLY} />
      <path d="M38 67 Q48 70 58 67 M37 73 Q48 76.5 59 73 M39 79 Q48 82 57 79" fill="none" stroke="#f2c97a" strokeWidth="1.2" strokeLinecap="round" />
      <Arms sleeve="#f79b4a" hand="#ffb868" handLine={LINE} />
      <ellipse cx="48" cy="41" rx="25" ry="24" fill={SKIN_FILL} stroke={LINE} strokeWidth="1" />
      <ellipse cx="48" cy="53" rx="15" ry="9.5" fill="#ffb868" opacity=".75" />
      <circle cx="43" cy="49.5" r="1" fill="#a85a22" />
      <circle cx="53" cy="49.5" r="1" fill="#a85a22" />
      <Face {...props} style={{ mouth: "#7a3f2a", brow: null, iris: "#2a8fa6" }} />
      <g className="wt-ember-effects">
        <path d="M57 51 Q78 44 91 52 Q76 63 57 54Z" fill="#ffad5d" />
        <path d="M58 52 Q76 49 85 53 Q74 57 58 54Z" fill="#ffe09a" />
        <circle cx="91" cy="47" r="2" fill="#f28d40" />
      </g>
    </>
  );
}
