export const PWA = {
  swUrl: "/sw.js",
  /** Wait this long after load before offering to install, so it never greets someone on first paint. */
  installDelayMs: 25_000,
  /** After "Not now", stay quiet for this long. */
  installSnoozeMs: 14 * 24 * 3600 * 1000,
  installSnoozeKey: "wt-pwa-install-snooze",
  /** Look for a new service worker this often while the app stays open. */
  updateCheckMs: 30 * 60 * 1000,
} as const;

export const PWA_COPY = {
  installTitle: "Install WebTrak",
  installBody: "Open it from your home screen or dock, full screen, like any other app.",
  install: "Install",
  notNow: "Not now",
  iosTitle: "Add WebTrak to your Home Screen",
  iosBody: "Tap the Share button, then “Add to Home Screen”.",
  gotIt: "Got it",
  offline: "You're offline. Showing what's already on screen; changes can't be saved until you reconnect.",
  backOnline: "Back online",
  updateTitle: "A new version of WebTrak is ready",
  update: "Refresh",
  later: "Later",
} as const;
