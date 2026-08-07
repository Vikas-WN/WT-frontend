import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Keeps Learning routes/nav wired but shows Coming Soon for all personas.
 * Existing page clients remain in the tree for a one-line restore later.
 */
export default function LearningDevelopmentLayout({ children: _children }: { children: ReactNode }) {
  return (
    <ComingSoonPanel
      title="Learning & Development"
      description="Training catalogs, sessions, attendance, and scores are on the way. Navigation stays in place so you can jump in the moment we flip this live."
      icon={<GraduationCap className="size-6" />}
    />
  );
}
