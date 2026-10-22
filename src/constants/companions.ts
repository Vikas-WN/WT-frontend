export const COMPANIONS = [
  { id: "knot", name: "Knot", detail: "Your original blue sidekick", action: "Happy dance", line: "A little progress is still progress." },
  { id: "virat", name: "Virat Kohli", detail: "A fan-art cricket companion", action: "Cover drive", line: "Eyes on the next ball. You've got this!" },
  { id: "goku", name: "Goku", detail: "A little Saiyan energy", action: "Kamehameha", line: "One more challenge. Let's power up!" },
  { id: "pikachu", name: "Pikachu", detail: "A spark of everyday energy", action: "Thunderbolt", line: "Pika pika! Time to recharge." },
  { id: "charmander", name: "Charmander", detail: "Small flame, big encouragement", action: "Ember", line: "Keep that little flame going!" },
] as const;
export type CompanionId = typeof COMPANIONS[number]["id"];
export function companionById(id: string | null | undefined) {
  return COMPANIONS.find((item) => item.id === id) ?? COMPANIONS[0];
}
