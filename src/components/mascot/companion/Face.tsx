import type { ArtProps } from "./types";

const INK = "#263142";

type FaceStyle = {
  /** Mouth stroke colour; humans on a beard need a light one. */
  mouth: string;
  /** Eyebrow colour, or null for none (the creatures). */
  brow: string | null;
  /** Tilt the brows inward for a determined look. */
  determined?: boolean;
  /** Eye colour: creatures get coloured irises. */
  iris?: string;
};

function Brows({ color, determined, lifted }: { color: string; determined: boolean; lifted: boolean }) {
  const lift = lifted ? -2 : 0;
  const inner = determined ? 2 : 0;
  return (
    <g fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <path d={`M31 ${33 + lift + inner} Q37 ${30 + lift} 43 ${32 + lift - inner * 0.5}`} />
      <path d={`M53 ${32 + lift - inner * 0.5} Q59 ${30 + lift} 65 ${33 + lift + inner}`} />
    </g>
  );
}

function Eyes({ iris }: { iris?: string }) {
  return (
    <g className="wt-companion-eyes">
      <ellipse cx="38" cy="40" rx="4.2" ry="5.6" fill={iris ?? INK} />
      <ellipse cx="59" cy="40" rx="4.2" ry="5.6" fill={iris ?? INK} />
      {iris ? <><ellipse cx="38" cy="41" rx="2.4" ry="3.4" fill={INK} /><ellipse cx="59" cy="41" rx="2.4" ry="3.4" fill={INK} /></> : null}
      <circle cx="39.4" cy="37.8" r="1.5" fill="white" />
      <circle cx="60.4" cy="37.8" r="1.5" fill="white" />
      <circle cx="37" cy="42.5" r=".7" fill="white" opacity=".8" />
      <circle cx="58" cy="42.5" r=".7" fill="white" opacity=".8" />
    </g>
  );
}

function Mouth({ mood, happy, surprised, color }: Pick<ArtProps, "mood" | "happy" | "surprised"> & { color: string }) {
  if (surprised) return <ellipse cx="48" cy="52" rx="3" ry="4" fill="#5a3030" />;
  if (happy) {
    return (
      <g>
        <path d="M40 50 Q48 65 56 50Z" fill="#8f3f45" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M43 56.5 Q48 61 53 56.5 Q48 58 43 56.5Z" fill="#f08a8a" />
      </g>
    );
  }
  const d = mood === "cry" ? "M42 56 Q48 49 54 56" : "M41.5 52 Q48 58.5 54.5 52";
  return <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />;
}

/** Eyes, brows and mouth for a mood. The look-at-pointer offset moves the eyes only. */
export function Face({ mood, happy, asleep, surprised, style }: ArtProps & { style: FaceStyle }) {
  const sleepy = asleep || mood === "laugh";
  return (
    <>
      {style.brow && !asleep ? <Brows color={style.brow} determined={Boolean(style.determined)} lifted={surprised} /> : null}
      <g style={{ transform: "translate(var(--wt-knot-look-x, 0px), var(--wt-knot-look-y, 0px))" }}>
        {sleepy ? (
          <path d="M33 41 q5 -4 9 0 M54 41 q5 -4 9 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        ) : mood === "love" ? (
          <g fill="#e0456f">
            <path d="M33 38 c-5 -5 -9 4 5 10 c14 -6 9 -15 4 -10 l-4 3Z" />
            <path d="M55 38 c-5 -5 -9 4 5 10 c14 -6 9 -15 4 -10 l-4 3Z" />
          </g>
        ) : (
          <Eyes iris={style.iris} />
        )}
      </g>
      <Mouth mood={mood} happy={happy} surprised={surprised} color={style.mouth} />
    </>
  );
}
