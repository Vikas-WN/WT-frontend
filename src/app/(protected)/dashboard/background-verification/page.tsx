import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { Shield } from "lucide-react";

/**
 * Keeps BGV route/nav wired; page client remains importable for a one-line restore.
 * Visible to all personas via expanded nav roles.
 */
export default function DashboardBackgroundVerificationPage() {
  return (
    <ComingSoonPanel
      title="Background Verification"
      description="Verification workflows and status tracking will appear here soon. Your existing BGV tooling stays connected behind this screen."
      icon={<Shield className="size-6" />}
    />
  );
}
