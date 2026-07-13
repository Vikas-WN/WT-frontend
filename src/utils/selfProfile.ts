import { ApiError } from "@/api/error";
import { hrmsService } from "@/services/hrms.service";
import {
  hasAccountManagerRole,
  hasDmRole,
  hasHrRole,
  hasManagerRole,
} from "@/utils/roles";
import { shouldRequireSelfOnboarding } from "@/utils/userStatus";

/** DM-only portal users cannot call GET /profile. */
export function shouldSkipSelfProfileFetch(roles: string[]): boolean {
  if (roles.includes("ROLE_EMPLOYEE")) return false;
  if (hasHrRole(roles)) return false;
  if (hasManagerRole(roles)) return false;
  if (hasAccountManagerRole(roles)) return false;
  return hasDmRole(roles);
}

export async function fetchSelfProfile(
  roles: string[]
): Promise<Record<string, unknown> | null> {
  if (shouldSkipSelfProfileFetch(roles)) {
    return null;
  }
  try {
    const res = await hrmsService.getMyProfile();
    const profile = (res.data ?? null) as Record<string, unknown> | null;
    return normalizeSelfProfile(profile);
  } catch (err) {
    if (err instanceof ApiError) {
      // Soft-fail: DM skip, missing profile, or transient backend/proxy errors (e.g. reload).
      if (
        err.status === 403 ||
        err.status === 404 ||
        err.status === 0 ||
        err.status === 500 ||
        err.status === 502 ||
        err.status === 503 ||
        err.status === 504
      ) {
        return null;
      }
    }
    throw err;
  }
}

/** Align API aliases so employee/manager profile views show HR-populated work fields. */
export function normalizeSelfProfile(
  profile: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!profile) return null;
  return {
    ...profile,
    band: profile.band_name ?? profile.band,
    band_name: profile.band_name ?? profile.band,
    reporting_manager:
      profile.reporting_manager ?? profile.reporting_manager_name ?? profile.manager_name,
    category: profile.category ?? profile.delivery_status ?? profile.deliveryStatus,
    work_location_type:
      profile.work_location_type ?? profile.work_location ?? profile.workLocationType,
    holiday_calendar_name:
      profile.holiday_calendar_name ?? profile.holidayCalendarName ?? null,
    portal_roles: profile.portal_roles ?? profile.portalRoles ?? [],
  };
}

export async function loadSelfProfileState(
  roles: string[],
  user?: { status?: string } | null
): Promise<{
  profile: Record<string, unknown> | null;
  isSelfOnboarded: boolean;
}> {
  const profile = await fetchSelfProfile(roles);
  const status = String(profile?.status ?? user?.status ?? "");
  return {
    profile,
    // SERVING_NOTICE employees already completed onboarding — do not gate Leave/Profile.
    isSelfOnboarded: !shouldRequireSelfOnboarding(status, roles),
  };
}
