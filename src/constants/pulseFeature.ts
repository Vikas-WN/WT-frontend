/**
 * Master switch for the Pulse feature in the UI.
 *
 * `false` on the prod branch: Pulse is hidden from the sidebar, the command palette and search, the Settings page,
 * and /dashboard/pulse sends people home. Nothing is removed — set this back to `true` to turn Pulse on again.
 */
export const PULSE_ENABLED = false;
