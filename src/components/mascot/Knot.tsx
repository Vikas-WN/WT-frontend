import type { CSSProperties } from "react";

export type KnotMood = "hello" | "loading" | "oops" | "lost" | "party";

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
    default:
      return <path d="M37 59 q11 12 22 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />;
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
}: {
  mood?: KnotMood;
  size?: number;
  className?: string;
  /** Spoken description; leave empty when the mascot is purely decorative next to text. */
  label?: string;
  animate?: boolean;
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
        .wt-knot-body{transform-origin:48px 84px}
        .wt-knot-on .wt-knot-body{animation:wt-knot-bob 2.6s ease-in-out infinite}
        .wt-knot-on.wt-knot-oops .wt-knot-body{animation:wt-knot-wobble .5s ease-in-out 3}
        .wt-knot-on .wt-knot-eye{transform-box:fill-box;transform-origin:center;animation:wt-knot-blink 4.2s infinite}
        .wt-knot-on .wt-knot-drop{animation:wt-knot-drip 1.6s ease-in infinite}
        .wt-knot-on .wt-knot-spark{transform-box:fill-box;transform-origin:center;animation:wt-knot-twinkle 1.2s ease-in-out infinite}
        .wt-knot-on.wt-knot-loading .wt-knot-loop{transform-box:fill-box;transform-origin:center;animation:wt-knot-wiggle 1.4s ease-in-out infinite}
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
          {/* the knot */}
          <g className="wt-knot-loop">
            <ellipse cx="38" cy="19" rx="10" ry="6" transform="rotate(-24 38 19)" fill="none" stroke={KNOT} strokeWidth="4" />
            <ellipse cx="58" cy="19" rx="10" ry="6" transform="rotate(24 58 19)" fill="none" stroke={KNOT} strokeWidth="4" />
          </g>
          <circle cx="48" cy="22" r="5" fill={KNOT} />
          {/* eyes */}
          <g>
            <ellipse className="wt-knot-eye" cx="37" cy="48" rx="6" ry="7" fill="#fff" />
            <ellipse className="wt-knot-eye" cx="59" cy="48" rx="6" ry="7" fill="#fff" />
            <circle cx={38 + looking} cy="49" r="3" fill="#1f2a44" />
            <circle cx={60 + looking} cy="49" r="3" fill="#1f2a44" />
            <circle cx={39 + looking} cy="47.5" r="1" fill="#fff" />
            <circle cx={61 + looking} cy="47.5" r="1" fill="#fff" />
          </g>
          <Face mood={mood} />
        </g>
      </g>
    </svg>
  );
}
