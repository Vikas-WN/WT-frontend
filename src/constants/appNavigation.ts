export const APP_NAV_COPY = {
  group: "Page navigation",
  back: "Back",
  forward: "Forward",
  refresh: "Refresh",
} as const;

/** The ways an installed web app is displayed (a normal browser tab matches none of these). */
export const INSTALLED_DISPLAY_MODES = ["standalone", "minimal-ui", "fullscreen", "window-controls-overlay"] as const;

/** Where the entry number is kept inside `history.state`, for browsers without the Navigation API. */
export const HISTORY_INDEX_KEY = "__wtIdx";
export const HISTORY_POSITION_STORAGE_KEY = "wt-history-position";
