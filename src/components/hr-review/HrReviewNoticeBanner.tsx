"use client";

import type { ReactNode } from "react";
import {
  INFO_BANNER_BODY_CLASS,
  INFO_BANNER_CLASS,
} from "@/components/dashboard/ui/uiLayout";

const DEFAULT_MESSAGE =
  "Comp-off usage requests are routed to HR for review. Earn requests go to your project manager. You will be notified once HR or your manager approves or rejects your request.";

export function HrReviewNoticeBanner({ children }: { children?: ReactNode } = {}) {
  return (
    <div className={INFO_BANNER_CLASS} role="status">
      <div className={INFO_BANNER_BODY_CLASS}>{children ?? DEFAULT_MESSAGE}</div>
    </div>
  );
}
