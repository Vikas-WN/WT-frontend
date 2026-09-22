import { Suspense } from "react";
import { TimelogPageClient } from "@/components/dashboard/timelog/TimelogPageClient";
import { DashboardPageLoading } from "@/components/dashboard/DashboardPageLoading";

export default function DashboardTimelogPage() {
  return (
    <Suspense fallback={<DashboardPageLoading label="Loading Time Logs…" />}>
      <TimelogPageClient />
    </Suspense>
  );
}
