import type { SeasonalThemeId } from "@/types/seasonal";

/** Artwork lives inside the greeting, never across controls or reading surfaces. */
export function SeasonalArtwork({ season }: { season: SeasonalThemeId }) {
  return (
    <svg viewBox="0 0 160 100" className="h-24 w-40" aria-hidden>
      <circle cx="86" cy="52" r="43" fill="currentColor" opacity=".055" />
      <circle cx="86" cy="52" r="32" fill="none" stroke="currentColor" strokeOpacity=".12" />
      {season === "DIWALI" ? <>
        <path d="M35 61 Q80 83 125 61 Q119 90 80 91 Q41 89 35 61Z" fill="#c97940" />
        <ellipse cx="80" cy="61" rx="45" ry="9" fill="#f5c887" />
        <path d="M80 59 C57 48 77 27 79 17 C97 37 102 48 80 59Z" fill="#efac46" />
        <path d="M80 55 Q72 45 82 34 Q92 48 80 55Z" fill="#fff0bf" />
        <path d="M55 76 Q80 86 105 76" fill="none" stroke="#edc48c" strokeWidth="2" />
        <path d="M27 29 h8 m-4 -4 v8 M124 35 h10 m-5 -5 v10" stroke="#c79039" strokeWidth="2" strokeLinecap="round" />
      </> : season === "HOLI" ? <>
        <circle cx="62" cy="48" r="22" fill="#eab2cc" /><circle cx="97" cy="38" r="22" fill="#b9b2ea" /><circle cx="91" cy="69" r="22" fill="#9acecf" /><circle cx="52" cy="75" r="14" fill="#efca80" />
        <path d="M44 53 Q78 10 112 53 M50 66 Q80 33 105 68" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2" /><circle cx="35" cy="24" r="4" fill="#eab2cc" /><circle cx="124" cy="69" r="5" fill="#b9b2ea" />
      </> : season === "CHRISTMAS" ? <>
        <path d="M81 11 L107 45 H97 L119 73 H43 L65 45 H55Z" fill="#426d61" /><path d="M81 27 L96 46 M66 61 H103" stroke="#9dc3a7" strokeWidth="2" /><rect x="76" y="74" width="10" height="13" rx="2" fill="#ad805c" /><path d="M81 4 l3 6 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1Z" fill="#e8c57a" />
        <circle cx="71" cy="44" r="3" fill="#edc478" /><circle cx="94" cy="63" r="3" fill="#e1b2ad" /><path d="M30 31 h10 m-5 -5 v10 M128 51 h10 m-5 -5 v10" stroke="#acc7d5" strokeWidth="2" />
      </> : <>
        <path d="M55 79 L74 29" stroke="#dfc09b" strokeWidth="17" strokeLinecap="round" /><path d="M74 29 L82 10" stroke="#416e9c" strokeWidth="6" strokeLinecap="round" /><circle cx="110" cy="72" r="16" fill="#b96867" /><path d="M108 57 Q96 73 108 87 M113 57 Q101 73 113 87" fill="none" stroke="#f4d2ba" strokeWidth="1.3" strokeDasharray="2 2" /><path d="M43 89 H132" stroke="#8fb39c" strokeWidth="3" strokeLinecap="round" />
      </>}
    </svg>
  );
}

/** Kept as the host interface; decoration is intentionally contained in Home. */
export function SeasonalDecor({ season }: { season: SeasonalThemeId }) {
  return <span data-season-decoration={season.toLowerCase()} hidden />;
}
