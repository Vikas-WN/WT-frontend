"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, ArrowLeft, UserCog } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type AccessRestrictedProps = {
  /** Custom message explaining why access is restricted */
  message?: string;
  /** Custom title */
  title?: string;
  /** Where to link back to */
  backHref?: string;
  /** Back link label */
  backLabel?: string;
  /** Whether the user is HR/Admin but trying to access own profile */
  isOwnProfile?: boolean;
};

export function AccessRestricted({
  message,
  title = "Access Restricted",
  backHref = DASHBOARD_ROUTES.profile,
  backLabel = "Back to Dashboard",
  isOwnProfile = false,
}: AccessRestrictedProps = {}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultMessage = isOwnProfile
    ? "You cannot access your own employee profile from the directory. Please use the Profile page to view your information."
    : "Employee profiles in the directory are available to HR and admin users only.";

  return (
    <DashboardPageShell>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Animated lock icon */}
          <div className="mb-6 flex justify-center animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--wt-brand)]/20 to-[var(--wt-brand)]/5 rounded-full blur-xl animate-pulse-slow" />
              <div className="relative flex size-24 items-center justify-center rounded-2xl bg-[var(--wt-brand-soft)]">
                <Lock className="size-10 text-[var(--wt-brand)]" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-xl font-semibold text-wt-text animate-fade-in-up delay-100">
            {title}
          </h2>

          {/* Message */}
          <p className="mt-3 text-center text-sm text-wt-text-muted animate-fade-in-up delay-200">
            {message || defaultMessage}
          </p>

          {/* Additional context for own profile */}
          {isOwnProfile && (
            <div className="mt-6 p-4 rounded-xl bg-wt-surface-2/50 border border-wt-border animate-fade-in-up delay-300">
              <div className="flex items-center gap-3 text-sm text-wt-text">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
                  <UserCog className="size-4" />
                </div>
                <p>
                  <span className="font-medium">HR/Admin users:</span> Your own profile is view-only in the directory. Use the Profile page to edit your information.
                </p>
              </div>
            </div>
          )}

          {/* Back button */}
          <div className="mt-8 text-center animate-fade-in-up delay-400">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[var(--wt-brand)] rounded-xl hover:bg-[var(--wt-brand)]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)] focus-visible:ring-offset-2"
            >
              <ArrowLeft className="size-4" />
              {backLabel}
            </Link>
          </div>

          {/* Decorative floating elements */}
          {mounted && (
            <>
              <div className="pointer-events-none fixed top-20 left-5 size-16 rounded-full bg-[var(--wt-brand)]/5 blur-2xl animate-float" />
              <div className="pointer-events-none fixed bottom-20 right-5 size-20 rounded-full bg-[var(--wt-brand)]/5 blur-2xl animate-float delay-1000" />
            </>
          )}
        </div>
      </div>
    </DashboardPageShell>
  );
}