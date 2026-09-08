import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { Activity } from "lucide-react";

/**
 * Keeps the Pulse route/nav wired without redirecting out to the external RT
 * portal. To restore the redirect, swap this back to:
 *   import { redirect } from "next/navigation";
 *   import { PULSE_EXTERNAL_URL } from "@/constants/dashboardNavigation";
 *   export default function PulsePage() { redirect(PULSE_EXTERNAL_URL); }
 * See background-verification/page.tsx for the same coming-soon pattern.
 */
export default function PulsePage() {
  return (
    <ComingSoonPanel
      title="Pulse"
      description="Pulse insights will appear here soon. Your existing Pulse tooling stays connected behind this screen."
      icon={<Activity className="size-6" />}
    />
  );
}
