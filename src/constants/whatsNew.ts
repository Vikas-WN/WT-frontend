/** Copy and keys for the "What's new" dialog. */
export const WHATS_NEW_COPY = {
  title: "What's new",
  dismiss: "Got it",
  footnote: "You'll only see this once for each update.",
  previewNotice: "Preview — closing this won't mark it as seen.",
} as const;

/** Mirror of the server-side "last seen" value, used when saving it to the server fails. */
export const WHATS_NEW_LOCAL_STORAGE_KEY = "wt.whatsNew.lastSeenRelease";

/** `?whatsNew=preview` shows the latest release without recording it, so anyone can see it again. */
export const WHATS_NEW_PREVIEW_PARAM = "whatsNew";
export const WHATS_NEW_PREVIEW_VALUE = "preview";

/** A user who skipped several updates sees at most this many, newest first. */
export const WHATS_NEW_MAX_RELEASES = 3;
