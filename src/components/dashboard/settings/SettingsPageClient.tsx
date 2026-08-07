"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Clock3,
  Contrast,
  Mail,
  Monitor,
  Moon,
  Sparkles,
  Sun,
  Waves,
} from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { OnboardingGate } from "@/components/dashboard/shared/OnboardingGate";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/dashboard/ui/forms";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import {
  COMMON_TIMEZONES,
  type DateFormatPreference,
  type ThemePreference,
  type WeekStartPreference,
} from "@/types/user-preferences";
import {
  detectBrowserTimezone,
  formatLocalTimeInZone,
  formatTimezoneLabel,
} from "@/utils/userPreferences";
import { cn } from "@/lib/utils";

const THEME_CARDS: Array<{
  value: ThemePreference;
  title: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: "light",
    title: "Light",
    description: "Bright surfaces for daytime focus",
    icon: Sun,
  },
  {
    value: "dark",
    title: "Dark",
    description: "Low glare for long sessions",
    icon: Moon,
  },
  {
    value: "system",
    title: "System",
    description: "Match your device preference",
    icon: Monitor,
  },
];

const DATE_FORMAT_OPTIONS: Array<{ value: DateFormatPreference; label: string }> = [
  { value: "DMY", label: "DD/MM/YYYY" },
  { value: "MDY", label: "MM/DD/YYYY" },
  { value: "YMD", label: "YYYY-MM-DD" },
];

const WEEK_START_OPTIONS: Array<{ value: WeekStartPreference; label: string }> = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
];

function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  icon: typeof Bell;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-wt-border bg-wt-surface-2/50 px-4 py-3.5 transition-colors hover:border-[color-mix(in_srgb,var(--wt-brand)_28%,var(--wt-border))] dark:bg-black/20">
      <span className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-wt-surface-1 text-wt-text-muted dark:bg-wt-surface-3">
          <Icon className="size-4" />
        </span>
        <span>
          <span className="block text-sm font-medium text-wt-text">{title}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-wt-text-muted">{description}</span>
        </span>
      </span>
      <input
        type="checkbox"
        className="size-4 shrink-0 accent-[var(--wt-brand)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function SettingsPageClient() {
  const { preferences, updatePreferences, isSaving, isLoading } = useUserPreferences();
  const [timezone, setTimezone] = useState(preferences.timezone);
  const [theme, setTheme] = useState(preferences.theme);
  const [density, setDensity] = useState(preferences.density);
  const [reduceMotion, setReduceMotion] = useState(preferences.reduce_motion);
  const [emailNotifications, setEmailNotifications] = useState(preferences.email_notifications);
  const [desktopNotifications, setDesktopNotifications] = useState(preferences.desktop_notifications);
  const [weekStartsOn, setWeekStartsOn] = useState(preferences.week_starts_on);
  const [dateFormat, setDateFormat] = useState(preferences.date_format);
  const [clock, setClock] = useState(() => formatLocalTimeInZone(preferences.timezone));

  useEffect(() => {
    setTimezone(preferences.timezone);
    setTheme(preferences.theme);
    setDensity(preferences.density);
    setReduceMotion(preferences.reduce_motion);
    setEmailNotifications(preferences.email_notifications);
    setDesktopNotifications(preferences.desktop_notifications);
    setWeekStartsOn(preferences.week_starts_on);
    setDateFormat(preferences.date_format);
  }, [preferences]);

  useEffect(() => {
    const tick = () => setClock(formatLocalTimeInZone(timezone));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [timezone]);

  const timezoneOptions = useMemo(() => {
    const browserTz = detectBrowserTimezone();
    const values = new Map(COMMON_TIMEZONES.map((z) => [z.value, z.label]));
    if (!values.has(browserTz)) {
      values.set(browserTz, `${browserTz} (detected)`);
    }
    if (!values.has(timezone)) {
      values.set(timezone, formatTimezoneLabel(timezone));
    }
    return Array.from(values.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [timezone]);

  const dirty =
    timezone !== preferences.timezone ||
    theme !== preferences.theme ||
    density !== preferences.density ||
    reduceMotion !== preferences.reduce_motion ||
    emailNotifications !== preferences.email_notifications ||
    desktopNotifications !== preferences.desktop_notifications ||
    weekStartsOn !== preferences.week_starts_on ||
    dateFormat !== preferences.date_format;

  const handleSave = async () => {
    await updatePreferences({
      timezone,
      theme,
      density,
      reduce_motion: reduceMotion,
      email_notifications: emailNotifications,
      desktop_notifications: desktopNotifications,
      week_starts_on: weekStartsOn,
      date_format: dateFormat,
    });
  };

  const handleReset = () => {
    setTimezone(preferences.timezone);
    setTheme(preferences.theme);
    setDensity(preferences.density);
    setReduceMotion(preferences.reduce_motion);
    setEmailNotifications(preferences.email_notifications);
    setDesktopNotifications(preferences.desktop_notifications);
    setWeekStartsOn(preferences.week_starts_on);
    setDateFormat(preferences.date_format);
  };

  const handleUseDetectedTimezone = () => {
    setTimezone(detectBrowserTimezone());
  };

  return (
    <DashboardPageShell className="wt-detail-page">
      <OnboardingGate>
        <div className="mx-auto w-full max-w-3xl space-y-6 wt-soft-in">
          <header className="relative overflow-hidden rounded-3xl border border-wt-border bg-wt-surface-1 p-6 shadow-[var(--wt-shadow-md)] dark:bg-wt-surface-2 dark:shadow-none sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--wt-brand)_16%,transparent),transparent_55%)]" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-wt-text-faint">
                  Preferences
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-wt-text sm:text-3xl">
                  Settings
                </h1>
                <p className="mt-2 max-w-xl text-sm text-wt-text-muted">
                  Appearance, notifications, calendar defaults, and timezone — synced to your account.
                </p>
              </div>
              <div className="rounded-2xl border border-wt-border bg-wt-surface-2/80 px-4 py-3 backdrop-blur-sm dark:bg-black/30">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-wt-text-faint">
                  Local time
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-wt-text">
                  <Clock3 className="size-4 text-[var(--wt-brand)]" />
                  {clock}
                </p>
              </div>
            </div>
          </header>

          <section className="rounded-3xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm dark:bg-wt-surface-2 dark:shadow-none sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-[var(--wt-brand)]" />
              <h2 className="text-sm font-semibold text-wt-text">Appearance</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {THEME_CARDS.map((card) => {
                const Icon = card.icon;
                const selected = theme === card.value;
                return (
                  <button
                    key={card.value}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setTheme(card.value)}
                    className={cn(
                      "group rounded-2xl border p-4 text-left transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
                      selected
                        ? "border-[color-mix(in_srgb,var(--wt-brand)_45%,var(--wt-border))] bg-[color-mix(in_srgb,var(--wt-brand)_8%,var(--wt-surface-1))] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--wt-brand)_20%,transparent)]"
                        : "border-wt-border bg-wt-surface-2/60 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--wt-brand)_28%,var(--wt-border))] hover:shadow-md dark:bg-black/20"
                    )}
                  >
                    <span
                      className={cn(
                        "mb-3 flex size-9 items-center justify-center rounded-xl transition-colors",
                        selected
                          ? "bg-[var(--wt-brand)] text-white"
                          : "bg-wt-surface-1 text-wt-text-muted group-hover:text-[var(--wt-brand)] dark:bg-wt-surface-3"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="block text-sm font-semibold text-wt-text">{card.title}</span>
                    <span className="mt-1 block text-xs text-wt-text-muted">{card.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-wt-border bg-wt-surface-2/50 p-4 dark:bg-black/20">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-wt-text">
                  <Contrast className="size-4 text-wt-text-muted" />
                  Density
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "comfortable", label: "Comfortable" },
                      { value: "compact", label: "Compact" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDensity(option.value)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                        density === option.value
                          ? "border-[var(--wt-brand)] bg-wt-surface-1 text-wt-text shadow-sm"
                          : "border-wt-border bg-transparent text-wt-text-muted hover:text-wt-text"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-wt-border bg-wt-surface-2/50 p-4 dark:bg-black/20">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-wt-text">
                  <Waves className="size-4 text-wt-text-muted" />
                  Motion
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-1 px-3 py-3 dark:bg-wt-surface-3">
                  <span>
                    <span className="block text-sm font-medium text-wt-text">Reduce motion</span>
                    <span className="block text-xs text-wt-text-muted">
                      Soften page and menu animations
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--wt-brand)]"
                    checked={reduceMotion}
                    onChange={(e) => setReduceMotion(e.target.checked)}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm dark:bg-wt-surface-2 dark:shadow-none sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="size-4 text-[var(--wt-brand)]" />
              <h2 className="text-sm font-semibold text-wt-text">Notifications</h2>
            </div>
            <div className="space-y-3">
              <PreferenceToggle
                icon={Mail}
                title="Email notifications"
                description="Leave, birthdays, and important HR updates to your work inbox"
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />
              <PreferenceToggle
                icon={Bell}
                title="In-app alerts"
                description="Show notification badges and toasts while you work in WebTrak"
                checked={desktopNotifications}
                onChange={setDesktopNotifications}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm dark:bg-wt-surface-2 dark:shadow-none sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="size-4 text-[var(--wt-brand)]" />
              <h2 className="text-sm font-semibold text-wt-text">Calendar & dates</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-wt-text">Week starts on</p>
                <div className="grid grid-cols-2 gap-2">
                  {WEEK_START_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setWeekStartsOn(option.value)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                        weekStartsOn === option.value
                          ? "border-[var(--wt-brand)] bg-wt-surface-2 text-wt-text shadow-sm"
                          : "border-wt-border bg-transparent text-wt-text-muted hover:text-wt-text"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-wt-text">Date format</p>
                <div className="grid gap-2">
                  {DATE_FORMAT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDateFormat(option.value)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all",
                        dateFormat === option.value
                          ? "border-[var(--wt-brand)] bg-wt-surface-2 text-wt-text shadow-sm"
                          : "border-wt-border bg-transparent text-wt-text-muted hover:text-wt-text"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm dark:bg-wt-surface-2 dark:shadow-none sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-[var(--wt-brand)]" />
                <h2 className="text-sm font-semibold text-wt-text">Timezone</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleUseDetectedTimezone}
              >
                Use detected ({detectBrowserTimezone()})
              </Button>
            </div>
            <SelectField
              label="Display timezone"
              value={timezone}
              onChange={setTimezone}
              options={timezoneOptions}
              placeholder="Select timezone"
            />
            <p className="mt-2 text-xs text-wt-text-muted">
              Used for local time previews in your account menu. Saved to your profile.
            </p>
          </section>

          <div className="sticky bottom-4 z-10 flex justify-end">
            <div className="flex items-center gap-2 rounded-2xl border border-wt-border bg-wt-surface-1/95 p-2 shadow-lg backdrop-blur-md dark:bg-wt-surface-2/95">
              <Button type="button" variant="ghost" disabled={!dirty || isSaving} onClick={handleReset}>
                Reset
              </Button>
              <Button type="button" disabled={!dirty || isSaving || isLoading} onClick={() => void handleSave()}>
                {isSaving ? "Saving…" : "Save preferences"}
              </Button>
            </div>
          </div>
        </div>
      </OnboardingGate>
    </DashboardPageShell>
  );
}
