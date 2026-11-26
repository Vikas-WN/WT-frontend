import { ShadeGradient } from "./Defs";
import { Face } from "./Face";
import { CricketBall, CricketBat, HumanHead, SignatureHands } from "./Human";
import { Arms, Legs } from "./Limbs";
import { SKIN, type ArtProps } from "./types";

const JERSEY = "url(#dhoni-jersey)";
const CAP = "url(#dhoni-cap)";
const YELLOW_MID = "#f6c22a";
const BLUE = "#2150a8";

/** MS Dhoni fan art: yellow kit and cap, light stubble, calm look, number 7. */
export function Dhoni(props: ArtProps) {
  return (
    <>
      <defs>
        <ShadeGradient id="dhoni-jersey" light="#ffdc5c" mid={YELLOW_MID} dark="#d99d12" />
        <ShadeGradient id="dhoni-cap" light="#ffe27a" mid="#f8c828" dark="#d99d12" />
      </defs>
      <Legs trouser="#f1f4fa" shoe="#2a3550" line="#b9c2d6" />
      <path d="M25 66 Q24 48 48 47 Q72 48 71 66 L68 83 Q48 90 28 83Z" fill={JERSEY} stroke="#c68f10" strokeWidth="1" />
      <path d="M38 48.5 L48 58 L58 48.5" fill="none" stroke={BLUE} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M33 62 H63" stroke={BLUE} strokeWidth="1.4" opacity=".55" />
      <Arms sleeve={YELLOW_MID} hand={SKIN.light} handLine={SKIN.line} />
      <text x="48" y="71" textAnchor="middle" fontSize="7" fontWeight="800" fill={BLUE} letterSpacing=".8">MSD</text>
      <text x="48" y="80.5" textAnchor="middle" fontSize="9" fontWeight="800" fill={BLUE}>7</text>
      <CricketBat />
      <HumanHead id="dhoni">
        <path d="M29 47 Q33 62 48 63 Q63 62 67 47 L62 51.5 Q48 56.5 34 51.5Z" fill="#5a4a44" opacity=".22" />
        <path d="M26 31 Q25 8 48 8 Q71 8 70 31 Q60 26 48 26 Q36 26 26 31Z" fill={CAP} stroke="#c68f10" strokeWidth="1" strokeLinejoin="round" />
        <path d="M25.5 29.5 Q48 21.5 70.5 29.5 L70 32.5 Q48 25 26 32.5Z" fill={BLUE} />
        <path d="M48 8.5 L48 24" stroke="#c68f10" strokeWidth=".9" opacity=".6" />
        <circle cx="48" cy="17" r="3" fill={BLUE} />
        <circle cx="48" cy="17" r="1.2" fill="#ffe27a" />
        <Face {...props} style={{ mouth: "#8a4e3e", brow: "#2a2522" }} />
      </HumanHead>
      <SignatureHands sleeve={YELLOW_MID} />
      <CricketBall />
    </>
  );
}
