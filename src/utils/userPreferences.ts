import {
  COMMON_TIMEZONES,
  DEFAULT_USER_PREFERENCES,
  type DateFormatPreference,
  type DensityPreference,
  type ThemePreference,
  type UserPreferences,
  type WeekStartPreference,
} from "@/types/user-preferences";

export function parseUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_USER_PREFERENCES };
  const row = raw as Record<string, unknown>;
  const theme = String(row.theme ?? "").toLowerCase();
  const density = String(row.density ?? "").toLowerCase();
  const weekStarts = String(row.week_starts_on ?? row.weekStartsOn ?? "").toLowerCase();
  const dateFormat = String(row.date_format ?? row.dateFormat ?? "").toUpperCase();
  return {
    timezone: String(row.timezone ?? DEFAULT_USER_PREFERENCES.timezone).trim() || DEFAULT_USER_PREFERENCES.timezone,
    theme: theme === "light" || theme === "dark" || theme === "system" ? (theme as ThemePreference) : DEFAULT_USER_PREFERENCES.theme,
    density:
      density === "comfortable" || density === "compact"
        ? (density as DensityPreference)
        : DEFAULT_USER_PREFERENCES.density,
    reduce_motion: Boolean(row.reduce_motion ?? row.reduceMotion ?? false),
    email_notifications: Boolean(
      row.email_notifications ?? row.emailNotifications ?? DEFAULT_USER_PREFERENCES.email_notifications
    ),
    desktop_notifications: Boolean(
      row.desktop_notifications ?? row.desktopNotifications ?? DEFAULT_USER_PREFERENCES.desktop_notifications
    ),
    week_starts_on:
      weekStarts === "monday" || weekStarts === "sunday"
        ? (weekStarts as WeekStartPreference)
        : DEFAULT_USER_PREFERENCES.week_starts_on,
    date_format:
      dateFormat === "DMY" || dateFormat === "MDY" || dateFormat === "YMD"
        ? (dateFormat as DateFormatPreference)
        : DEFAULT_USER_PREFERENCES.date_format,
  };
}

export function applyDensityPreference(density: DensityPreference) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-density", density);
}

export function applyReduceMotionPreference(reduceMotion: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("wt-reduce-motion", reduceMotion);
}

export function formatTimezoneLabel(timezone: string): string {
  const known = COMMON_TIMEZONES.find((z) => z.value === timezone);
  if (known) return known.label;
  return timezone;
}

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_USER_PREFERENCES.timezone;
  } catch {
    return DEFAULT_USER_PREFERENCES.timezone;
  }
}

export function formatLocalTimeInZone(timezone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(now);
  } catch {
    return now.toLocaleTimeString();
  }
}
