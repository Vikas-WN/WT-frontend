"use client";

import { bannerClass } from "@/components/dashboard/ui/bannerTones";

export function HrReviewNoticeBanner() {
  return (
    <div className={bannerClass("info")}>
      Comp-off usage requests are routed to HR for review. Earn requests go to your project manager.
      You will be notified once HR or your manager approves or rejects your request.
    </div>
  );
}
