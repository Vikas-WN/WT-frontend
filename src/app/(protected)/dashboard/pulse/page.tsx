import { redirect } from "next/navigation";

import { LazyPulsePageClient } from "@/components/dashboard/lazyPages";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { PULSE_ENABLED } from "@/constants/pulseFeature";

/**
 * Pulse used to redirect out to the external RT portal
 * (rtportal.webknot-dev.in) — see dashboardNavigation.ts's PULSE_EXTERNAL_URL
 * for that history. It's native now: employees fill in their monthly
 * self-review, managers review their team's, and HR/Admin manage KPIs, the
 * submission window, and final approval.
 *
 * While Pulse is switched off (see constants/pulseFeature.ts) every visit, including old notification and bookmark
 * links, lands on the home page instead.
 */
export default function PulsePage() {
  if (!PULSE_ENABLED) redirect(DASHBOARD_ROUTES.home);
  return <LazyPulsePageClient />;
}
