import { ShadeGradient } from "./Defs";
import { Face } from "./Face";
import { HumanHead, SignatureHands } from "./Human";
import { Arms, Legs } from "./Limbs";
import { SKIN, type ArtProps } from "./types";

const GI = "url(#goku-gi)";
const BLUE = "#2852a0";
const HAIR = "#252d3d";

/** Goku fan art: spiky black hair, orange gi with blue undershirt, belt and wristbands. */
export function Goku(props: ArtProps) {
  return (
    <>
      <defs>
        <ShadeGradient id="goku-gi" light="#ff9c4a" mid="#f47b20" dark="#d4600f" />
      </defs>
      {props.happy ? <path className="wt-companion-aura" d="M18 80 Q5 48 22 20 L28 30 L39 6 L47 21 L61 7 L65 30 L79 19 Q91 57 78 81Z" fill="#ffda6b" opacity=".6" /> : null}
      <Legs trouser="#f47b20" shoe={BLUE} line="#c25a0d" />
      <path d="M25 66 Q24 48 48 47 Q72 48 71 66 L68 83 Q48 90 28 83Z" fill={GI} stroke="#c25a0d" strokeWidth="1" />
      <path d="M37 48.5 L48 64 L59 48.5 L57 70 H39Z" fill={BLUE} />
      <path d="M28 77 Q48 83 69 77 L69 82 Q48 88 28 82Z" fill={BLUE} />
      <Arms sleeve={SKIN.base} hand={SKIN.light} handLine={SKIN.line} width={8} />
      <path d="M21 67 L24 71.5" stroke={BLUE} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M75 67 L72 71.5" stroke={BLUE} strokeWidth="4.2" strokeLinecap="round" />
      <HumanHead id="goku">
        <path d="M25 36 L15 26 L27 25 L19 12 L35 19 L35 4 L48 16.5 L58 3 L62 18.5 L78 11 L71 26.5 L82 29 L69 37 L61 25 L49 29 L41 23 L33 37Z" fill={HAIR} />
        <path d="M37 10 L41 18 M57 10 L56 18 M21 17 L27 22" fill="none" stroke="#4a566c" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
        <Face {...props} style={{ mouth: "#7a4538", brow: HAIR, determined: true }} />
      </HumanHead>
      <SignatureHands sleeve={SKIN.base} />
      <g className="wt-ki-effects">
        <circle className="wt-ki-orb" cx="65" cy="65" r="9" fill="#8ceaff" stroke="#e9ffff" strokeWidth="2" />
        <path className="wt-ki-beam" d="M65 65 L94 59 L94 71Z" fill="#abf1ff" />
        <path className="wt-ki-beam" d="M65 65 H94" stroke="white" strokeWidth="3" />
      </g>
    </>
  );
}
