export const PET_NAME = "Knot";

/** What Knot says when poked. Friendly, short, never naggy. */
export const PET_LINES: readonly string[] = [
  "Hi there!",
  "You're doing great today.",
  "Remember to drink some water.",
  "Psst — stretch your legs for a minute?",
  "I'm just keeping your seat warm.",
  "Tickles!",
  "Want to see me jump?",
  "Time logs won't fill themselves… but I believe in you.",
  "Try double-clicking me.",
  "Drag me anywhere. I dare you.",
  "Right-click me for options.",
  "Everything is going to be fine.",
];

export const PET_COPY = {
  firstHello: (name: string) => `Hi ${name}! I'm Knot.`,
  wake: "Mmm… I'm up!",
  dizzy: "Whoa — easy!",
  love: "Aww, that's nice.",
  thrown: "Wheee!",
  approve: "Approved!",
  reject: "Noted.",
  undo: "Undone!",
  success: "Done!",
  napping: "Zzz… tap me to wake me.",
  menuTalk: "Say something",
  menuNap: "Take a nap",
  menuWake: "Wake up",
  menuHide: "Hide Knot",
  menuHideHint: "You can bring me back in Settings.",
  ariaLabel: "Knot, your WebTrak pet. Press Enter to say hi.",
} as const;
