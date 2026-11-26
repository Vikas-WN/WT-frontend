/** Shared soft-shading gradients. Ids are prefixed per character so several companions on one page never clash. */
export function SkinDefs({ id }: { id: string }) {
  return (
    <radialGradient id={`${id}-skin`} cx="42%" cy="32%" r="75%">
      <stop offset="0" stopColor="#ffddbd" />
      <stop offset="0.65" stopColor="#f2b88e" />
      <stop offset="1" stopColor="#dc9c74" />
    </radialGradient>
  );
}

export function ShadeGradient({ id, light, mid, dark }: { id: string; light: string; mid: string; dark: string }) {
  return (
    <linearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stopColor={light} />
      <stop offset="0.55" stopColor={mid} />
      <stop offset="1" stopColor={dark} />
    </linearGradient>
  );
}
