import type { CSSProperties } from "react";

export type KnotMood = "hello" | "loading" | "oops" | "lost" | "party" | "sleep" | "held" | "love" | "dizzy" | "laugh" | "cry";

/** What Knot is wearing for the season (null = nothing special). */
export type KnotCostume = "cricket" | "diwali" | "christmas" | "holi" | null;

/** A pose held for a moment: swinging the cricket bat. */
export type KnotAction = "swing" | null;

const BRAND = "var(--wt-brand, #355095)";
const KNOT = "#f5c451";

/** Mouth and extras for each mood, drawn in the mascot's 96×96 box. */
function Face({ mood }: { mood: KnotMood }) {
  switch (mood) {
    case "oops":
      return (
        <>
          <path d="M38 62 q5 -4 10 0 t10 0" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          <path className="wt-knot-drop" d="M70 36 q3 5 0 8 q-3 -3 0 -8z" fill="#7dd3fc" />
        </>
      );
    case "lost":
      return (
        <>
          <ellipse cx="48" cy="62" rx="3.2" ry="3.8" fill="#fff" />
          <text x="68" y="30" fontSize="16" fontWeight="700" fill={KNOT} fontFamily="system-ui, sans-serif">
            ?
          </text>
        </>
      );
    case "loading":
      return <ellipse cx="48" cy="62" rx="3" ry="3.4" fill="#fff" />;
    case "party":
      return (
        <>
          <path d="M36 58 q12 14 24 0 z" fill="#fff" />
          <path d="M42 63 q6 6 12 0" fill="#f97066" />
          <g className="wt-knot-spark" fill={KNOT}>
            <path d="M14 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
            <path d="M82 18 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" />
          </g>
        </>
      );
    case "sleep":
      return (
        <>
          <path d="M42 62 q6 3 12 0" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <g className="wt-knot-zzz" fill="#cbd5e1" fontFamily="system-ui, sans-serif" fontWeight="700">
            <text x="66" y="30" fontSize="11">z</text>
            <text x="74" y="20" fontSize="14">Z</text>
          </g>
        </>
      );
    case "held":
      return <ellipse cx="48" cy="63" rx="4.2" ry="5.2" fill="#fff" />;
    case "love":
      return (
        <>
          <path d="M37 59 q11 13 22 0" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="29" cy="58" r="4" fill="#fb7185" opacity=".55" />
          <circle cx="67" cy="58" r="4" fill="#fb7185" opacity=".55" />
        </>
      );
    case "dizzy":
      return <path d="M38 63 q4 -5 8 0 t8 0 t8 0" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />;
    case "laugh":
      return (
        <>
          <path d="M34 56 q14 24 28 0 z" fill="#7f1d1d" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M40 66 q8 7 16 0 q-8 -4 -16 0z" fill="#fb7185" />
          <circle cx="29" cy="58" r="4" fill="#fb7185" opacity=".55" />
          <circle cx="67" cy="58" r="4" fill="#fb7185" opacity=".55" />
        </>
      );
    case "cry":
      return (
        <path className="wt-knot-quiver" d="M38 68 q10 -9 20 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      );
    default:
      return <path d="M37 59 q11 12 22 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />;
  }
}


/** Accessories that sit on the body, under the face: scarf, paint, tilak. */
function CostumeBody({ costume }: { costume: KnotCostume }) {
  switch (costume) {
    case "christmas":
      return (
        <>
          {/* scarf */}
          <path d="M22 70 C38 80 58 80 74 70 L75 77 C58 87 38 87 21 77 Z" fill="#dc2626" />
          <path d="M33 78 L31 90 L40 90 L41 80 Z" fill="#b91c1c" />
          <path d="M26 72 l3 8 M44 79 l1 8 M60 79 l-1 8 M70 72 l-3 8" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
        </>
      );
    case "holi":
      return (
        <>
          <ellipse cx="28" cy="66" rx="8" ry="5" fill="#ec4899" opacity=".7" />
          <ellipse cx="68" cy="72" rx="9" ry="5" fill="#f5c451" opacity=".75" />
          <ellipse cx="52" cy="34" rx="9" ry="4" fill="#22c1c3" opacity=".65" transform="rotate(-12 52 34)" />
          <circle cx="34" cy="40" r="3" fill="#8b5cf6" opacity=".8" />
        </>
      );
    case "diwali":
      return <circle cx="48" cy="38" r="2.6" fill="#ef4444" />;
    default:
      return null;
  }
}

/** Accessories drawn over the face: hats, the bat, the sparkler. */
function CostumeFront({ costume, action }: { costume: KnotCostume; action: KnotAction }) {
  switch (costume) {
    case "christmas":
      return (
        <g>
          <path d="M23 37 C26 18 44 8 62 11 C73 13 79 23 75 34 C60 31 38 31 23 37 Z" fill="#dc2626" />
          <path d="M19 37 C36 30 62 30 78 37 L76 44 C60 38 38 38 21 44 Z" fill="#fff" />
          <circle cx="72" cy="13" r="6.2" fill="#fff" />
        </g>
      );
    case "cricket":
      return (
        <g>
          <path d="M24 38 C26 20 70 20 72 38 Z" fill="#1d4ed8" />
          <path d="M24 38 C16 38 14 41 18 43 L48 42 Z" fill="#1e3a8a" />
          <circle cx="48" cy="22" r="3" fill={KNOT} />
          {/* bat in the right hand */}
          <g className={`wt-knot-bat${action === "swing" ? " wt-knot-swinging" : ""}`}>
            <rect x="70" y="26" width="6" height="22" rx="3" fill="#7c4a1d" />
            <path d="M66 46 H 80 L 81 80 Q 73 84 65 80 Z" fill="#e8c27a" />
            <path d="M73 48 V 80" stroke="#b9893e" strokeWidth="1" />
          </g>
          <circle cx="74" cy="62" r="5" fill="#2f4a8f" />
        </g>
      );
    case "diwali":
      return (
        <g>
          {/* a sparkler in the right hand */}
          <line x1="74" y1="70" x2="86" y2="48" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" />
          <g className="wt-knot-sparkler" fill="#fde68a">
            <path d="M86 44 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4z" />
            <circle cx="92" cy="40" r="1.2" />
            <circle cx="80" cy="42" r="1.1" />
          </g>
          <circle cx="74" cy="70" r="4.6" fill="#2f4a8f" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * Knot — WebTrak's mascot, a little blue blob with a golden knot on its head (Web-knot). Shown while things load, when something
 * goes wrong, when a page can't be found and when someone is welcomed. Pure SVG, so it works anywhere — including the
 * error page that renders outside the app's styles — and it holds still for people who prefer reduced motion.
 */
export function Knot({
  mood = "hello",
  size = 96,
  className,
  label,
  animate = true,
  costume = null,
  action = null,
}: {
  mood?: KnotMood;
  size?: number;
  className?: string;
  /** Spoken description; leave empty when the mascot is purely decorative next to text. */
  label?: string;
  animate?: boolean;
  costume?: KnotCostume;
  action?: KnotAction;
}) {
  const looking = mood === "lost" ? 3 : 0;
  const style: CSSProperties = { width: size, height: size };
  return (
    <svg
      viewBox="0 0 96 96"
      style={style}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <style>{`
        .wt-knot-hidden{display:none}
        .wt-knot-body{transform-origin:48px 84px}
        .wt-knot-on .wt-knot-body{animation:wt-knot-bob 2.6s ease-in-out infinite}
        .wt-knot-on.wt-knot-oops .wt-knot-body{animation:wt-knot-wobble .5s ease-in-out 3}
        .wt-knot-on .wt-knot-eye{transform-box:fill-box;transform-origin:center;animation:wt-knot-blink 4.2s infinite}
        .wt-knot-on .wt-knot-drop{animation:wt-knot-drip 1.6s ease-in infinite}
        .wt-knot-on .wt-knot-spark{transform-box:fill-box;transform-origin:center;animation:wt-knot-twinkle 1.2s ease-in-out infinite}
        .wt-knot-on.wt-knot-loading .wt-knot-hidden{display:none}
        .wt-knot-loop{transform-box:fill-box;transform-origin:center;animation:wt-knot-wiggle 1.4s ease-in-out infinite}
        .wt-knot-on .wt-knot-zzz{animation:wt-knot-zzz 2.4s ease-in-out infinite}
        .wt-knot-on.wt-knot-laugh .wt-knot-body{animation:wt-knot-shake .22s ease-in-out infinite}
        .wt-knot-on.wt-knot-cry .wt-knot-body{animation:wt-knot-sob .7s ease-in-out infinite}
        .wt-knot-on .wt-knot-tear{animation:wt-knot-stream .9s ease-in infinite}
        .wt-knot-on .wt-knot-tear-b{animation-delay:.3s}
        .wt-knot-on .wt-knot-quiver{animation:wt-knot-quiver .35s ease-in-out infinite}
        .wt-knot-bat{transform-box:view-box;transform-origin:72px 62px;transform:rotate(-20deg)}
        .wt-knot-on .wt-knot-bat.wt-knot-swinging{animation:wt-knot-swing .5s cubic-bezier(.3,.1,.3,1) 1}
        .wt-knot-on .wt-knot-flame{transform-box:fill-box;transform-origin:50% 100%;animation:wt-knot-flicker 1s ease-in-out infinite}
        .wt-knot-on .wt-knot-sparkler{transform-box:fill-box;transform-origin:center;animation:wt-knot-twinkle .35s linear infinite}
        @keyframes wt-knot-shake{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-3px) rotate(3deg)}}
        @keyframes wt-knot-sob{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,.97) translateY(1px)}}
        @keyframes wt-knot-stream{0%{transform:translateY(-3px);opacity:0}25%{opacity:1}100%{transform:translateY(16px);opacity:0}}
        @keyframes wt-knot-quiver{0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}
        @keyframes wt-knot-swing{0%{transform:rotate(-20deg)}35%{transform:rotate(-110deg)}70%{transform:rotate(60deg)}100%{transform:rotate(-20deg)}}
        @keyframes wt-knot-flicker{0%,100%{transform:scale(1,1)}50%{transform:scale(.88,1.12)}}
        @keyframes wt-knot-zzz{0%,100%{opacity:.35;transform:translateY(2px)}50%{opacity:1;transform:translateY(-3px)}}
        @keyframes wt-knot-bob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-4px) scale(1.02,.98)}}
        @keyframes wt-knot-wobble{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
        @keyframes wt-knot-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
        @keyframes wt-knot-drip{0%{transform:translateY(-2px);opacity:0}30%{opacity:1}100%{transform:translateY(8px);opacity:0}}
        @keyframes wt-knot-twinkle{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.6);opacity:.5}}
        @keyframes wt-knot-wiggle{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}
        @media (prefers-reduced-motion: reduce){.wt-knot-on *{animation:none!important}}
      `}</style>
      <g className={`${animate ? "wt-knot-on" : ""} wt-knot-${mood}`}>
        <ellipse cx="48" cy="90" rx="22" ry="3.5" fill="#000" opacity=".12" />
        <g className="wt-knot-body">
          {/* feet */}
          <ellipse cx="36" cy="85" rx="7" ry="4" fill={BRAND} />
          <ellipse cx="60" cy="85" rx="7" ry="4" fill={BRAND} />
          {/* body */}
          <path d="M20 58 C20 36 32 24 48 24 C64 24 76 36 76 58 C76 74 64 86 48 86 C32 86 20 74 20 58z" fill={BRAND} />
          <path d="M30 40 C34 32 42 28 50 28" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="4" strokeLinecap="round" />
          <CostumeBody costume={costume} />
          {/* the knot */}
          <g className={costume === "christmas" || costume === "cricket" ? "wt-knot-loop wt-knot-hidden" : "wt-knot-loop"}>
            <ellipse cx="38" cy="19" rx="10" ry="6" transform="rotate(-24 38 19)" fill="none" stroke={KNOT} strokeWidth="4" />
            <ellipse cx="58" cy="19" rx="10" ry="6" transform="rotate(24 58 19)" fill="none" stroke={KNOT} strokeWidth="4" />
          </g>
          {costume === "christmas" || costume === "cricket" ? null : <circle cx="48" cy="22" r="5" fill={KNOT} />}
          {/* eyes — closed, hearts or crosses for some moods; otherwise they look where `--wt-knot-look-*` points (the pet follows the cursor) */}
          {mood === "sleep" ? (
            <g fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
              <path d="M31 49 q6 5 12 0" />
              <path d="M53 49 q6 5 12 0" />
            </g>
          ) : mood === "love" ? (
            <g fill="#fb7185">
              <path d="M37 54 c-9 -6 -9 -13 -3 -13 c2 0 3 1 3 3 c0 -2 1 -3 3 -3 c6 0 6 7 -3 13z" />
              <path d="M59 54 c-9 -6 -9 -13 -3 -13 c2 0 3 1 3 3 c0 -2 1 -3 3 -3 c6 0 6 7 -3 13z" />
            </g>
          ) : mood === "laugh" ? (
            <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <path d="M31 51 q6 -9 12 0" />
              <path d="M53 51 q6 -9 12 0" />
            </g>
          ) : mood === "cry" ? (
            <g>
              <ellipse cx="37" cy="49" rx="6.2" ry="7" fill="#fff" />
              <ellipse cx="59" cy="49" rx="6.2" ry="7" fill="#fff" />
              <circle cx="37" cy="52" r="3.2" fill="#1f2a44" />
              <circle cx="59" cy="52" r="3.2" fill="#1f2a44" />
              <path d="M30 40 L43 44 M66 40 L53 44" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
              <path className="wt-knot-tear" d="M33 56 q-3 9 0 12 q3 -3 0 -12z" fill="#7dd3fc" />
              <path className="wt-knot-tear wt-knot-tear-b" d="M63 56 q-3 9 0 12 q3 -3 0 -12z" fill="#7dd3fc" />
            </g>
          ) : mood === "dizzy" ? (
            <g stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
              <path d="M32 43 l10 10 M42 43 l-10 10" />
              <path d="M54 43 l10 10 M64 43 l-10 10" />
            </g>
          ) : (
            <g>
              <ellipse className="wt-knot-eye" cx="37" cy="48" rx="6" ry={mood === "held" ? 8 : 7} fill="#fff" />
              <ellipse className="wt-knot-eye" cx="59" cy="48" rx="6" ry={mood === "held" ? 8 : 7} fill="#fff" />
              <g style={{ transform: "translate(var(--wt-knot-look-x, 0px), var(--wt-knot-look-y, 0px))" }}>
                <circle cx={38 + looking} cy="49" r="3" fill="#1f2a44" />
                <circle cx={60 + looking} cy="49" r="3" fill="#1f2a44" />
                <circle cx={39 + looking} cy="47.5" r="1" fill="#fff" />
                <circle cx={61 + looking} cy="47.5" r="1" fill="#fff" />
              </g>
            </g>
          )}
          <Face mood={mood} />
          <CostumeFront costume={costume} action={action} />
        </g>
      </g>
    </svg>
  );
}
