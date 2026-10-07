/** Things that happen in the app which Knot reacts to. `giveFeedback` (approvals etc.) raises them; the pet listens. */
export const PET_EVENT = "wt:pet";

export type PetEventKind = "approve" | "reject" | "undo" | "success";

export function emitPetEvent(kind: PetEventKind): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PetEventKind>(PET_EVENT, { detail: kind }));
}
