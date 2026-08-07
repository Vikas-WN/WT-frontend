"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { hrmsService } from "@/services/hrms.service";
import {
  DEFAULT_USER_PREFERENCES,
  type ThemePreference,
  type UserPreferences,
  type UserPreferencesUpdate,
} from "@/types/user-preferences";
import { applyTheme, readStoredThemePreference, resolveThemePreference } from "@/utils/dashboard/theme";
import {
  applyDensityPreference,
  applyReduceMotionPreference,
  parseUserPreferences,
} from "@/utils/userPreferences";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type UserPreferencesContextValue = {
  preferences: UserPreferences;
  isLoading: boolean;
  isSaving: boolean;
  setTheme: (theme: ThemePreference) => void;
  updatePreferences: (patch: UserPreferencesUpdate) => Promise<void>;
  refresh: () => Promise<void>;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export const USER_PREFERENCES_QUERY_KEY = ["profile", "preferences"] as const;

function preferencesQueryKey(email?: string | null) {
  return [...USER_PREFERENCES_QUERY_KEY, email ?? "anonymous"] as const;
}

function unwrapPreferencesPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const envelope = raw as Record<string, unknown>;
  if ("data" in envelope) return envelope.data;
  return raw;
}

/** Prefer localStorage theme until the API responds — prevents dark flash when DEFAULT is system. */
function clientSeededPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_USER_PREFERENCES;
  return {
    ...DEFAULT_USER_PREFERENCES,
    theme: readStoredThemePreference(),
  };
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const queryClient = useQueryClient();
  const enabled = status === "authenticated" && Boolean(user?.email);
  const [optimistic, setOptimistic] = useState<UserPreferences | null>(null);
  const [seed] = useState(clientSeededPreferences);

  const query = useQuery({
    queryKey: preferencesQueryKey(user?.email),
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await hrmsService.getMyPreferences();
      return parseUserPreferences(unwrapPreferencesPayload(res));
    },
  });

  const preferences = optimistic ?? query.data ?? seed;
  const theme = preferences.theme;
  const density = preferences.density;
  const reduceMotion = preferences.reduce_motion;

  // Keep this dependency list fixed-length — Fast Refresh previously flipped between
  // a 7-item and 3-item array and React throws if the size changes across renders.
  useEffect(() => {
    applyTheme(theme);
    applyDensityPreference(density);
    applyReduceMotionPreference(reduceMotion);
  }, [theme, density, reduceMotion]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const mutation = useMutation({
    mutationFn: async (args: { patch: UserPreferencesUpdate; silent?: boolean }) => {
      const res = await hrmsService.updateMyPreferences(args.patch);
      return { prefs: parseUserPreferences(unwrapPreferencesPayload(res)), silent: Boolean(args.silent) };
    },
    onMutate: async ({ patch }) => {
      const previous = preferences;
      const next = { ...previous, ...patch };
      setOptimistic(next);
      if (patch.theme) applyTheme(patch.theme);
      if (patch.density) applyDensityPreference(patch.density);
      if (patch.reduce_motion !== undefined) applyReduceMotionPreference(patch.reduce_motion);
      return { previous };
    },
    onError: (error, _args, ctx) => {
      if (ctx?.previous) {
        setOptimistic(ctx.previous);
        applyTheme(ctx.previous.theme);
        applyDensityPreference(ctx.previous.density);
        applyReduceMotionPreference(ctx.previous.reduce_motion);
      }
      showErrorToast(error instanceof Error ? error.message : "Could not save preferences.");
    },
    onSuccess: (result) => {
      setOptimistic(null);
      queryClient.setQueryData(preferencesQueryKey(user?.email), result.prefs);
      if (!result.silent) showSuccessToast("Preferences saved");
    },
  });

  const setTheme = useCallback(
    (theme: ThemePreference) => {
      void mutation.mutateAsync({ patch: { theme }, silent: true });
    },
    [mutation]
  );

  const updatePreferences = useCallback(
    async (patch: UserPreferencesUpdate) => {
      await mutation.mutateAsync({ patch, silent: false });
    },
    [mutation]
  );

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      preferences,
      isLoading: query.isLoading && enabled,
      isSaving: mutation.isPending,
      setTheme,
      updatePreferences,
      refresh,
    }),
    [preferences, query.isLoading, enabled, mutation.isPending, setTheme, updatePreferences, refresh]
  );

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    // Safe fallback outside provider (e.g. login pages).
    return {
      preferences: DEFAULT_USER_PREFERENCES,
      isLoading: false,
      isSaving: false,
      setTheme: (theme: ThemePreference) => applyTheme(theme),
      updatePreferences: async () => undefined,
      refresh: async () => undefined,
      resolvedTheme: resolveThemePreference(DEFAULT_USER_PREFERENCES.theme),
    };
  }
  return {
    ...ctx,
    resolvedTheme: resolveThemePreference(ctx.preferences.theme),
  };
}
