/**
 * A room's schedule changes the moment anyone books, edits or cancels, and the people looking at
 * it aren't told. So an open schedule re-reads itself every few seconds and whenever the window
 * regains focus — an edited time is on everyone's screen within roughly this long.
 */
export const MEETING_ROOM_REFRESH_MS = 8_000;
export const MEETING_ROOM_STALE_MS = 4_000;
