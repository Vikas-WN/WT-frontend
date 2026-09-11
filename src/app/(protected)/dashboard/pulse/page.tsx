import { LazyPulsePageClient } from "@/components/dashboard/lazyPages";

/**
 * Pulse used to redirect out to the external RT portal
 * (rtportal.webknot-dev.in) — see dashboardNavigation.ts's PULSE_EXTERNAL_URL
 * for that history. It's native now: HR/Admin manage KPI definitions and the
 * submission portal here; everyone else sees a coming-soon screen (the
 * self-review *filling* flow itself isn't built yet).
 */
export default function PulsePage() {
  return <LazyPulsePageClient />;
}
