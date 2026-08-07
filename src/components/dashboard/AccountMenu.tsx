"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  LogOut,
  Monitor,
  Moon,
  Settings2,
  Sun,
  UserRound,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from "@/components/dashboard/ui/profile";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { dashboardHref, DASHBOARD_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { formatTimezoneLabel, formatLocalTimeInZone } from "@/utils/userPreferences";
import type { ThemePreference } from "@/types/user-preferences";

type AccountMenuProps = {
  profile: { name?: string | null } | null | undefined;
  user: { name?: string | null; email?: string | null } | null | undefined;
  displayName: string;
  canAccessProfile: boolean;
  isOffboarded?: boolean;
  collapsed?: boolean;
  placement?: "sidebar" | "header";
  onLogout: () => void | Promise<void>;
  onNavigate?: () => void;
  className?: string;
};

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function AccountMenu({
  profile,
  user,
  displayName,
  canAccessProfile,
  isOffboarded = false,
  collapsed = false,
  placement = "sidebar",
  onLogout,
  onNavigate,
  className,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const { preferences, setTheme, resolvedTheme } = useUserPreferences();
  const email = (user?.email ?? "").trim();
  const localTime = useMemo(
    () => formatLocalTimeInZone(preferences.timezone),
    [preferences.timezone]
  );

  const triggerClass =
    placement === "header"
      ? cn(
          "group flex size-10 items-center justify-center overflow-hidden rounded-xl border border-wt-border bg-wt-surface-1 shadow-sm transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:border-[color-mix(in_srgb,var(--wt-brand)_35%,var(--wt-border))] hover:shadow-md hover:ring-2 hover:ring-[color-mix(in_srgb,var(--wt-brand)_18%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)] dark:bg-wt-surface-2",
          open && "border-[color-mix(in_srgb,var(--wt-brand)_40%,var(--wt-border))] ring-2 ring-[color-mix(in_srgb,var(--wt-brand)_22%,transparent)]"
        )
      : cn(
          "group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] hover:bg-wt-surface-1 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
          open && "bg-wt-surface-1 shadow-sm ring-1 ring-[color-mix(in_srgb,var(--wt-brand)_22%,transparent)]",
          collapsed && "lg:justify-center lg:px-1.5"
        );

  if (!canAccessProfile) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(triggerClass, className)}
        aria-label={`Account menu for ${displayName}`}
        title={collapsed ? displayName : undefined}
        disabled={isOffboarded}
      >
        <span
          className={cn(
            "relative",
            placement === "header" && "flex size-full items-center justify-center"
          )}
        >
          <UserAvatar
            profile={profile}
            fallbackName={user?.name ?? user?.email}
            size={placement === "header" ? "sm" : "xs"}
            className={cn(
              "transition-transform duration-[var(--wt-duration)] ease-[var(--wt-ease)] group-hover:scale-[1.03]",
              placement === "header" && "size-8 border-0"
            )}
          />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-wt-surface-1 bg-emerald-500 shadow-sm dark:border-wt-surface-2",
              placement === "sidebar" && collapsed && "lg:hidden"
            )}
            title="Online"
          />
        </span>
        {placement === "sidebar" ? (
          <span
            className={cn(
              "min-w-0 flex-1",
              collapsed &&
                "lg:pointer-events-none lg:absolute lg:-m-px lg:h-px lg:w-px lg:overflow-hidden lg:whitespace-nowrap lg:border-0 lg:p-0"
            )}
          >
            <span className="block truncate text-xs font-semibold leading-tight text-wt-text">
              {displayName}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-wt-text-muted">
              Account & settings
            </span>
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverPositioner
          side={placement === "header" ? "bottom" : "top"}
          align={placement === "header" ? "end" : collapsed ? "start" : "start"}
          sideOffset={10}
          className="z-[280]"
        >
          <PopoverContent
            className={cn(
              "wt-account-menu w-[min(92vw,20.5rem)] overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1/95 p-0 shadow-[var(--wt-shadow-lg)] backdrop-blur-xl dark:bg-wt-surface-2/95 dark:shadow-none"
            )}
          >
            <div className="relative overflow-hidden border-b border-wt-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--wt-brand)_14%,transparent),transparent_55%)] px-4 pb-3.5 pt-4">
              <div className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-[color-mix(in_srgb,var(--wt-brand)_18%,transparent)] blur-2xl" />
              <div className="relative flex items-center gap-3">
                <UserAvatar profile={profile} fallbackName={user?.name ?? user?.email} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-tight text-wt-text">
                    {displayName}
                  </p>
                  {email ? (
                    <p className="truncate text-xs text-wt-text-muted">{email}</p>
                  ) : null}
                  <p className="mt-1 truncate text-[11px] text-wt-text-faint">
                    {formatTimezoneLabel(preferences.timezone)} · {localTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-3">
              <div>
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-wt-text-faint">
                  Appearance
                </p>
                <div
                  className="grid grid-cols-3 gap-1 rounded-xl bg-wt-surface-2 p-1 dark:bg-black/40"
                  role="radiogroup"
                  aria-label="Theme"
                >
                  {THEME_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = preferences.theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          "relative flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-all duration-[var(--wt-duration-fast)] ease-[var(--wt-ease)]",
                          selected
                            ? "bg-wt-surface-1 text-wt-text shadow-sm ring-1 ring-wt-border dark:bg-wt-surface-3"
                            : "text-wt-text-muted hover:text-wt-text"
                        )}
                      >
                        <Icon className="size-3.5" />
                        {option.label}
                        {selected ? (
                          <Check className="absolute right-1 top-1 size-2.5 text-[var(--wt-brand)]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 px-1 text-[10px] text-wt-text-faint">
                  Active: {resolvedTheme === "dark" ? "Dark" : "Light"}
                  {preferences.theme === "system" ? " (system)" : ""}
                </p>
              </div>

              <div className="space-y-1">
                {!isOffboarded ? (
                  <Link
                    prefetch={false}
                    href={dashboardHref("profile")}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm text-wt-text transition-colors hover:bg-wt-surface-2"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-wt-surface-2 text-wt-text-muted transition-colors group-hover:bg-wt-brand-soft group-hover:text-[var(--wt-brand)] dark:bg-wt-surface-3">
                      <UserRound className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">View profile</span>
                      <span className="block text-[11px] text-wt-text-muted">
                        Personal details & skills
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-wt-text-faint transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : null}

                <Link
                  prefetch={false}
                  href={DASHBOARD_ROUTES.settings}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm text-wt-text transition-colors hover:bg-wt-surface-2"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-wt-surface-2 text-wt-text-muted transition-colors group-hover:bg-wt-brand-soft group-hover:text-[var(--wt-brand)] dark:bg-wt-surface-3">
                    <Settings2 className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">Settings</span>
                    <span className="block text-[11px] text-wt-text-muted">
                      Timezone, density & more
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-wt-text-faint transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="border-t border-wt-border p-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                  <LogOut className="size-4" />
                </span>
                Sign out
              </button>
            </div>
          </PopoverContent>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
