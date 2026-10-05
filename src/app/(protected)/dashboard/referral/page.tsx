import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { Gift } from "lucide-react";

/**
 * Referral is parked behind a Coming Soon panel. The nav item and route stay wired and
 * `LazyReferralPageClient` (components/dashboard/lazyPages) is untouched — restore by
 * rendering it here again.
 */
export default function DashboardReferralPage() {
  return (
    <ComingSoonPanel
      title="Referral"
      description="Refer candidates and track your referrals here soon. Your existing referral data stays connected behind this screen."
      icon={<Gift className="size-6" />}
    />
  );
}
