"use client";

import {
  BANNER_BODY_CLASS,
  BANNER_LIST_CLASS,
  BANNER_TITLE_CLASS,
  bannerClass,
} from "@/components/dashboard/ui/bannerTones";

export function CompOffRulesBanner() {
  return (
    <div className={bannerClass("warning")}>
      <p className={BANNER_TITLE_CLASS}>Comp-off rules</p>
      <ul className={BANNER_LIST_CLASS}>
        <li>1 unit = 1 full calendar day (usage has no half-days).</li>
        <li>Earn Credits expire 60 days after the worked date.</li>
        <li>Usage consumes grants FIFO (oldest expiry first).</li>
        <li>Earn: request goes to your project manager; +1 unit is added after they approve.</li>
        <li>Usage: only available when you have balance; request goes to HR for approval.</li>
      </ul>
    </div>
  );
}
