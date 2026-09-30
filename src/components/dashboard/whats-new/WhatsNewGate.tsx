"use client";

import { useAuth } from "@/context/AuthContext";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { WhatsNewDialog } from "@/components/dashboard/whats-new/WhatsNewDialog";
import { useWhatsNew } from "@/components/dashboard/whats-new/useWhatsNew";

/**
 * Mounted once in the dashboard layout. Shows the "What's new" dialog to a signed-in user who
 * hasn't read the latest release — not while they are still being onboarded, when a product
 * announcement would just get in the way of the form they have to fill in.
 */
export function WhatsNewGate() {
  const { status } = useAuth();
  const { requiresSelfOnboarding, accessSettled } = useDashboardAccess();
  // Wait for the onboarding decision to be made: until the profile loads, "onboarding isn't
  // required" only means "not known yet", and the dialog would flash up for someone who is.
  const { releases, isPreview, dismiss } = useWhatsNew(
    status === "authenticated" && accessSettled && !requiresSelfOnboarding
  );
  if (releases.length === 0) return null;
  return <WhatsNewDialog releases={releases} isPreview={isPreview} onClose={dismiss} />;
}
