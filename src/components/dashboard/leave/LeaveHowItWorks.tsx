import Link from "next/link";

import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { LEAVE_HOW_COPY } from "@/constants/leaveYearSummary";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

/** A short reminder of how leave is credited, with a way to the full policy. */
export function LeaveHowItWorks() {
  return (
    <section className={cn(CONTENT_CARD_CLASS, "p-5")} aria-label={LEAVE_HOW_COPY.title}>
      <h2 className="text-lg font-bold tracking-tight text-wt-text">{LEAVE_HOW_COPY.title}</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-wt-text-muted">
        {LEAVE_HOW_COPY.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ol>
      <Link href={DASHBOARD_ROUTES.policies} className="mt-3 inline-block text-sm font-semibold text-[var(--wt-brand)] hover:underline">
        {LEAVE_HOW_COPY.policyLink}
      </Link>
    </section>
  );
}
