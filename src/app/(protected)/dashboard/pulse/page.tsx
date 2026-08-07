import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { TrendingUp } from "lucide-react";

export default function PulsePage() {
  return (
    <ComingSoonPanel
      title="Pulse"
      description="Engagement insights are coming into WebTrak. This page replaces the old external redirect so everything stays in one premium workspace."
      icon={<TrendingUp className="size-6" />}
    />
  );
}
