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

export const PUSH_COPY = {
  button: "Message notifications",
  turnOn: "Turn on message notifications",
  turnOff: "Turn off message notifications",
  onNote: "You'll get a notification when someone messages you, even if WebTrak is closed.",
  offNote: "Get a notification when someone messages you, even if WebTrak is closed.",
  blocked: "Notifications are blocked for this site. Allow them in your browser's site settings, then try again.",
  unsupported: "This browser can't show notifications. On iPhone, add WebTrak to your Home Screen first.",
  notReady: "Notifications aren't switched on for this workspace yet. Ask your admin.",
  enabled: "Message notifications are on.",
  disabled: "Message notifications are off.",
  failed: "Couldn't change notification settings. Please try again.",
  bannerTitle: "Never miss a message",
  bannerBody: "Turn on notifications and we'll tell you when someone writes to you, even when WebTrak is closed.",
  bannerAction: "Turn on",
  bannerDismiss: "Not now",
  bannerSnoozeKey: "wt-push-banner-snooze",
  bannerSnoozeMs: 7 * 24 * 3600 * 1000,
  queryKeyConfig: ["push", "config"],
  queryKeyState: ["push", "state"],
} as const;
