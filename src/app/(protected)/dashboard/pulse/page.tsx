import { LazyPulsePageClient } from "@/components/dashboard/lazyPages";

/**
 * Pulse used to redirect out to the external RT portal
 * (rtportal.webknot-dev.in) — see dashboardNavigation.ts's PULSE_EXTERNAL_URL
 * for that history. It's native now: employees fill in their monthly
 * self-review, managers review their team's, and HR/Admin manage KPIs, the
 * submission window, and final approval.
 */
export default function PulsePage() {
  return <LazyPulsePageClient />;
}
