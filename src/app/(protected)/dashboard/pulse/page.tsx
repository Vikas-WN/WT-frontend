import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { TrendingUp } from "lucide-react";

/**
 * Pulse is parked behind a Coming Soon panel. The nav item and route stay wired and
 * `LazyPulsePageClient` (components/dashboard/lazyPages) is untouched — restore by
 * rendering it here again. (It briefly redirected to the external RT portal before going
 * native; see PULSE_EXTERNAL_URL in constants/dashboardNavigation.ts.)
 */
export default function PulsePage() {
  return (
    <ComingSoonPanel
      title="Pulse"
      description="Self-reviews, team reviews and KPI tracking will appear here soon. Your existing Pulse data stays connected behind this screen."
      icon={<TrendingUp className="size-6" />}
    />
  );
}
