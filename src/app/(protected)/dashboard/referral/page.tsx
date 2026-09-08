import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { Share2 } from "lucide-react";

/**
 * Keeps the Referral route/nav wired; LazyReferralPageClient (and the
 * underlying ReferralPageClient it loads) remains untouched and importable
 * for a one-line restore — see background-verification/page.tsx for the
 * same pattern.
 */
export default function DashboardReferralPage() {
  return (
    <ComingSoonPanel
      title="Referral"
      description="Employee referrals and tracking will appear here soon. Your existing referral tooling stays connected behind this screen."
      icon={<Share2 className="size-6" />}
    />
  );
}
