import type { KnotMood } from "@/components/mascot/Knot";

/** What every character's art needs to know about the current mood. */
export type ArtProps = {
  mood: KnotMood;
  happy: boolean;
  asleep: boolean;
  surprised: boolean;
};

export const SKIN = { light: "#ffd2ab", base: "#f2b88e", shade: "#d99a72", line: "#b87a58" } as const;
