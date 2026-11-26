import { ShadeGradient } from "./Defs";
import { Face } from "./Face";
import { CricketBall, CricketBat, HumanHead, SignatureHands } from "./Human";
import { Arms, Legs } from "./Limbs";
import { SKIN, type ArtProps } from "./types";

const JERSEY = "url(#virat-jersey)";
const JERSEY_MID = "#2f6fd0";

/** Virat Kohli fan art: full beard, India blue kit with orange trim, number 18. */
export function Virat(props: ArtProps) {
  return (
    <>
      <defs>
        <ShadeGradient id="virat-jersey" light="#5b97ee" mid={JERSEY_MID} dark="#1f4ea0" />
      </defs>
      <Legs trouser="#223566" shoe="#f4f6fb" line="#16254d" />
      <path d="M25 66 Q24 48 48 47 Q72 48 71 66 L68 83 Q48 90 28 83Z" fill={JERSEY} stroke="#1f4ea0" strokeWidth="1" />
      <path d="M38 48.5 L48 59 L58 48.5" fill="none" stroke="#ff9f2e" strokeWidth="2.4" strokeLinejoin="round" />
      <Arms sleeve={JERSEY_MID} hand={SKIN.light} handLine={SKIN.line} />
      <text x="48" y="71" textAnchor="middle" fontSize="7" fontWeight="800" fill="white" letterSpacing=".6">INDIA</text>
      <text x="48" y="80.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#dbe9ff">18</text>
      <CricketBat />
      <HumanHead id="virat">
        <path d="M26.5 36 L26 22 Q30 8 48 10.5 Q68 8 71 23 L70.5 36 Q66 27 58 23.5 Q46 30 34 24.5 Q29 28 26.5 36Z" fill="#232b35" />
        <path d="M35 16 Q46 10.5 59 15.5" fill="none" stroke="#4a5666" strokeWidth="2" strokeLinecap="round" opacity=".75" />
        <path d="M27 43 Q29 68 48 68 Q67 68 69 43 L65 47 Q63.5 51 59 50 Q48 46 37 50 Q32.5 51 31 47Z" fill="#2b2d34" />
        <path d="M33 55 Q48 63 63 55" fill="none" stroke="#454854" strokeWidth="1.4" opacity=".6" />
        <Face {...props} style={{ mouth: "#fff2df", brow: "#232b35", determined: true }} />
      </HumanHead>
      <SignatureHands sleeve={JERSEY_MID} />
      <CricketBall />
    </>
  );
}
