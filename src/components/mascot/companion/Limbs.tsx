import type { ReactNode } from "react";

/** Left/right legs. Pivots (35,80) and (61,80) are fixed by the walk animation in workspace.css. */
export function Legs({ trouser, shoe, line, bare = false }: { trouser: string; shoe: string; line: string; bare?: boolean }) {
  return (
    <>
      <g className="wt-companion-leg-left">
        <path d="M31 73 L30 84 Q27 87 32 89 H40 L40 76Z" fill={trouser} stroke={line} strokeWidth="1" strokeLinejoin="round" />
        <path d="M29.5 83.5 L40.5 83.5 L41.5 89 H28Z" fill={bare ? trouser : shoe} stroke={bare ? line : "none"} strokeWidth="1" />
      </g>
      <g className="wt-companion-leg-right">
        <path d="M56 76 L56 85 Q54 89 59 89 H68 L65 74Z" fill={trouser} stroke={line} strokeWidth="1" strokeLinejoin="round" />
        <path d="M56 83.5 L66 83.5 L70 89 H56Z" fill={bare ? trouser : shoe} stroke={bare ? line : "none"} strokeWidth="1" />
      </g>
    </>
  );
}

/** Arms hang from the shoulders at (28,58) and (68,58), the pivots the walk and party animations use. */
export function Arms({ sleeve, hand, handLine, width = 9 }: { sleeve: string; hand: string; handLine?: string; width?: number }) {
  const arm = (cls: string, d: string, cx: number): ReactNode => (
    <g className={cls}>
      <path d={d} fill="none" stroke={sleeve} strokeWidth={width} strokeLinecap="round" />
      <circle cx={cx} cy="73" r="4.3" fill={hand} stroke={handLine ?? "none"} strokeWidth=".8" />
    </g>
  );
  return (
    <>
      {arm("wt-companion-arm-left", "M28 58 Q20 59 20 67 L23 73", 23)}
      {arm("wt-companion-arm-right", "M68 58 Q76 59 76 67 L73 73", 73)}
    </>
  );
}

/** Soft ground shadow shared by every character. */
export function GroundShadow() {
  return <ellipse cx="48" cy="90" rx="23" ry="3" fill="#182159" opacity=".16" />;
}
