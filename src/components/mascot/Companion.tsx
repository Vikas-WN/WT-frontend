"use client";

import { Knot, type KnotMood, type KnotCostume, type KnotAction } from "./Knot";
import type { CompanionId } from "@/constants/companions";

/** Small vector fan-art companions share the same physics, pointer tracking and moods. */
export function Companion({ character, mood = "hello", size = 72, animate = true, costume, action }: { character: CompanionId; mood?: KnotMood; size?: number; animate?: boolean; costume?: KnotCostume; action?: KnotAction }) {
  if (character === "knot") return <Knot mood={mood} size={size} animate={animate} costume={costume} action={action} />;
  const human = character === "virat" || character === "goku";
  const electric = character === "pikachu";
  const happy = ["party", "love", "laugh"].includes(mood);
  const asleep = mood === "sleep";
  const surprised = ["held", "oops", "loading", "lost"].includes(mood);
  const faceColor = human ? "#f4ba8f" : electric ? "#ffdb52" : "#f9a153";
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden data-character={character} className={`wt-companion ${animate ? "wt-companion-animated" : ""} wt-companion-${mood}`}>
      <ellipse cx="48" cy="90" rx="23" ry="3" fill="#182159" opacity=".14" />
      <g className="wt-companion-body">
        {character === "goku" && happy ? <path className="wt-companion-aura" d="M18 80 Q5 48 22 20 L28 30 L39 6 L47 21 L61 7 L65 30 L79 19 Q91 57 78 81Z" fill="#ffda6b" opacity=".65" /> : null}
        {electric ? <path className="wt-companion-tail" d="M73 76 L84 68 L77 58 L90 53 L83 36 L69 46 L78 55 L68 64Z" fill="#ffd43b" stroke="#b58c25" strokeWidth="1.5" /> : null}
        {character === "charmander" ? <><path className="wt-companion-tail" d="M68 79 Q89 83 84 62" fill="none" stroke="#ed873c" strokeWidth="9" strokeLinecap="round" /><path className="wt-companion-flame" d="M84 66 C68 60 83 44 80 39 C96 51 95 62 84 66Z" fill="#f27337" /><path d="M84 63 Q78 56 85 49 Q91 58 84 63Z" fill="#ffe48a" /></> : null}
        <g className="wt-companion-leg-left"><path d="M31 73 L30 84 Q27 87 32 89 H40 L40 76Z" fill={human ? character === "virat" ? "#3474c5" : "#ed792f" : faceColor} stroke={human ? "#294a86" : "#ca8c3a"} strokeWidth="1" /><path d="M30 83 L40 83 L41 89 H28Z" fill={human ? "#263f79" : faceColor} /></g>
        <g className="wt-companion-leg-right"><path d="M56 76 L56 85 Q54 89 59 89 H68 L65 74Z" fill={human ? character === "virat" ? "#3474c5" : "#ed792f" : faceColor} stroke={human ? "#294a86" : "#ca8c3a"} strokeWidth="1" /><path d="M56 83 L66 83 L70 89 H56Z" fill={human ? "#263f79" : faceColor} /></g>
        <path d="M25 66 Q24 48 48 47 Q72 48 71 66 L68 83 Q48 90 28 83Z" fill={human ? character === "virat" ? "#3273cc" : "#f98531" : faceColor} stroke={human ? "#28529e" : "#ca8c3a"} strokeWidth="1" />
        {!human ? <ellipse cx="48" cy="73" rx="13" ry="12" fill={electric ? "#ffe77d" : "#ffe1a3"} /> : null}
        <g className="wt-companion-arm-left"><path d="M28 58 Q20 59 20 67 L23 73" fill="none" stroke={human ? character === "virat" ? "#3273cc" : "#f4ba8f" : faceColor} strokeWidth="9" strokeLinecap="round" /><circle cx="23" cy="73" r="4" fill={faceColor} /></g>
        <g className="wt-companion-arm-right"><path d="M68 58 Q76 59 76 67 L73 73" fill="none" stroke={human ? character === "virat" ? "#3273cc" : "#f4ba8f" : faceColor} strokeWidth="9" strokeLinecap="round" /><circle cx="73" cy="73" r="4" fill={faceColor} /></g>
        {character === "virat" ? <><path d="M33 61 H63" stroke="#ffb65c" strokeWidth="2" /><text x="48" y="71" textAnchor="middle" fontSize="7" fontWeight="800" fill="white">INDIA</text><text x="48" y="80" textAnchor="middle" fontSize="8" fontWeight="800" fill="#d9e8ff">18</text><g className="wt-cricket-bat"><path d="M74 70 L81 40" stroke="#cfa66c" strokeWidth="7" strokeLinecap="round" /><path d="M81 41 L85 27" stroke="#744d35" strokeWidth="3" strokeLinecap="round" /></g></> : null}
        {character === "goku" ? <><path d="M36 54 L48 66 L60 54 L56 70 H40Z" fill="#2852a0" /><path d="M28 76 H69" stroke="#2852a0" strokeWidth="5" /><circle cx="60" cy="68" r="5" fill="#fff4df" /><path d="M58 66 l4 4 m0 -4 l-4 4" stroke="#26354b" strokeWidth="1" /></> : null}
        <ellipse cx="48" cy="41" rx={human ? 22 : 25} ry={human ? 23 : 24} fill={faceColor} stroke={human ? "#c48666" : "#ca8c3a"} strokeWidth="1" />
        {electric ? <><path className="wt-companion-ear-left" d="M28 29 Q15 2 21 3 Q34 8 37 24" fill="#ffdb52" stroke="#ba922a" strokeWidth="1" /><path d="M21 3 Q15 2 22 15 L29 13Z" fill="#293348" /><path className="wt-companion-ear-right" d="M60 24 Q63 7 76 3 Q82 3 68 29" fill="#ffdb52" stroke="#ba922a" strokeWidth="1" /><path d="M76 3 Q82 3 74 15 L67 13Z" fill="#293348" /><circle cx="29" cy="49" r="5" fill="#f56a55" /><circle cx="67" cy="49" r="5" fill="#f56a55" /></> : null}
        {character === "virat" ? <><path d="M26 35 L27 21 Q35 9 51 15 Q72 10 71 35 L65 28 L58 24 Q42 31 30 26Z" fill="#26303a" /><path d="M27 43 Q31 64 48 65 Q66 64 69 43 L63 47 L60 53 L48 57 L36 53 L32 47Z" fill="#30323a" /><path d="M40 52 Q48 47 56 52" stroke="#30323a" strokeWidth="3" fill="none" /></> : null}
        {character === "goku" ? <path d="M25 35 L16 26 L27 25 L20 13 L36 19 L36 5 L49 17 L59 4 L62 19 L78 12 L71 27 L81 29 L68 37 L60 25 L49 29 L41 23 L33 37Z" fill="#273142" /> : null}
        <g style={{ transform: "translate(var(--wt-knot-look-x, 0px), var(--wt-knot-look-y, 0px))" }}>
          {asleep || mood === "laugh" ? <path d="M33 41 q5 -4 9 0 M54 41 q5 -4 9 0" fill="none" stroke="#263142" strokeWidth="2.5" strokeLinecap="round" /> : mood === "love" ? <g fill="#db537c"><path d="M33 38 c-5 -5 -9 4 5 10 c14 -6 9 -15 4 -10 l-4 3Z" /><path d="M55 38 c-5 -5 -9 4 5 10 c14 -6 9 -15 4 -10 l-4 3Z" /></g> : <g className="wt-companion-eyes"><ellipse cx="38" cy="40" rx="4" ry="5.5" fill="#263142" /><ellipse cx="59" cy="40" rx="4" ry="5.5" fill="#263142" /><circle cx="39" cy="38" r="1.3" fill="white" /><circle cx="60" cy="38" r="1.3" fill="white" /></g>}
        </g>
        {surprised ? <ellipse cx="48" cy="52" rx="3" ry="4" fill={human ? "#fff3df" : "#673c36"} /> : <path d={mood === "cry" ? "M42 56 Q48 49 54 56" : happy ? "M40 50 Q48 65 56 50Z" : "M42 52 Q48 58 54 52"} fill={happy ? "#a04f50" : "none"} stroke={human ? "#fff2df" : "#684238"} strokeWidth="2" strokeLinecap="round" />}
        {human ? <g className="wt-signature-hands"><path className="wt-signature-arm" d="M29 62 Q42 72 62 65 M66 60 Q75 66 62 65" fill="none" stroke="#f4ba8f" strokeWidth="7" strokeLinecap="round" /><circle cx="64" cy="65" r="5" fill="#ffd4ac" /></g> : null}
        {character === "virat" ? <circle className="wt-cricket-ball" cx="77" cy="75" r="3" fill="#e9f0ff" stroke="#94a4c4" strokeWidth=".7" /> : null}
        {character === "goku" ? <g className="wt-ki-effects"><circle className="wt-ki-orb" cx="65" cy="65" r="9" fill="#8ceaff" stroke="#e9ffff" strokeWidth="2" /><path className="wt-ki-beam" d="M65 65 L94 59 L94 71Z" fill="#abf1ff" /><path className="wt-ki-beam" d="M65 65 H94" stroke="white" strokeWidth="3" /></g> : null}
        {electric ? <g className="wt-electric-effects" fill="none" stroke="#f4b728" strokeWidth="2" strokeLinecap="round"><path d="M24 44 L14 39 L18 47 L9 48 M70 44 L81 39 L77 48 L88 49" /><path d="M23 55 L13 61 L20 65 M71 55 L82 62 L76 67" /></g> : null}
        {character === "charmander" ? <g className="wt-ember-effects"><path d="M57 51 Q78 44 91 52 Q76 63 57 54Z" fill="#ffad5d" /><path d="M58 52 Q76 49 85 53 Q74 57 58 54Z" fill="#ffe09a" /><circle cx="91" cy="47" r="2" fill="#f28d40" /></g> : null}
        {asleep ? <text x="71" y="22" fill="var(--wt-text-muted)" fontSize="13" fontWeight="700">zZ</text> : null}
        {mood === "dizzy" ? <text x="69" y="20" fill="#e7b63c" fontSize="18">✦</text> : null}
      </g>
    </svg>
  );
}
