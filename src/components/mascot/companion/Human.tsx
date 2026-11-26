import type { ReactNode } from "react";

import { SkinDefs } from "./Defs";
import { SKIN } from "./types";

/** The arm that sweeps across the body during a signature action (opacity is driven by workspace.css). */
export function SignatureHands({ sleeve }: { sleeve: string }) {
  return (
    <g className="wt-signature-hands">
      <path className="wt-signature-arm" d="M29 62 Q42 72 62 65 M66 60 Q75 66 62 65" fill="none" stroke={sleeve} strokeWidth="7" strokeLinecap="round" />
      <circle cx="64" cy="65" r="5" fill={SKIN.light} stroke={SKIN.line} strokeWidth=".7" />
    </g>
  );
}

/** A cricket bat held at the right hip; its pivot (73,67) is used by the drive and helicopter animations. */
export function CricketBat() {
  return (
    <g className="wt-cricket-bat">
      <path d="M74 70 L81 40" stroke="#d6ad73" strokeWidth="7" strokeLinecap="round" />
      <path d="M72.4 68.5 L79.4 41.5" stroke="#f1d6a6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M81 41 L85 27" stroke="#5b3a2a" strokeWidth="3" strokeLinecap="round" />
      <path d="M82.2 36.5 L83.4 31.5" stroke="#e4572e" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

export function CricketBall() {
  return (
    <g className="wt-cricket-ball">
      <circle cx="77" cy="75" r="3.2" fill="#d83c3c" stroke="#8f2020" strokeWidth=".7" />
      <path d="M74.6 73.4 Q77 75 74.6 76.8 M79.4 73.4 Q77 75 79.4 76.8" fill="none" stroke="#fff4e0" strokeWidth=".6" />
    </g>
  );
}

/** Head, ears, nose and cheeks, drawn under the hair and face features supplied by the character. */
export function HumanHead({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <>
      <defs>
        <SkinDefs id={id} />
      </defs>
      <circle cx="26.5" cy="44" r="4.2" fill={`url(#${id}-skin)`} stroke={SKIN.line} strokeWidth=".9" />
      <circle cx="69.5" cy="44" r="4.2" fill={`url(#${id}-skin)`} stroke={SKIN.line} strokeWidth=".9" />
      <ellipse cx="48" cy="41" rx="22" ry="23" fill={`url(#${id}-skin)`} stroke={SKIN.line} strokeWidth="1" />
      <ellipse cx="33" cy="49" rx="4.5" ry="2.8" fill="#f08c7a" opacity=".38" />
      <ellipse cx="63" cy="49" rx="4.5" ry="2.8" fill="#f08c7a" opacity=".38" />
      <path d="M46.5 44.5 Q48 47.5 50 44.5" fill="none" stroke={SKIN.line} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
      {children}
    </>
  );
}
