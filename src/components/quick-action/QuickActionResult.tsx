"use client";

import Link from "next/link";
import { Check, Clock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QUICK_ACTION_COPY as COPY } from "@/constants/quickAction";
import { cn } from "@/lib/utils";

export type ResultKind = "approved" | "rejected" | "decided" | "expired";

const KIND = {
  approved: { icon: Check, tone: "#10b981", title: COPY.approved, detail: COPY.approvedDetail },
  rejected: { icon: X, tone: "#ef4444", title: COPY.rejected, detail: COPY.rejectedDetail },
  decided: { icon: Check, tone: "#64748b", title: COPY.alreadyDecided, detail: COPY.alreadyDecidedDetail },
  expired: { icon: Clock, tone: "#f59e0b", title: COPY.expiredTitle, detail: COPY.expiredDetail },
} as const;

/** The end state of the page: an animated mark, one line of outcome, and a way into WebTrak. */
export function QuickActionResult({ kind }: { kind: ResultKind }) {
  const { icon: Icon, tone, title, detail } = KIND[kind];
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span
        className={cn("wt-pop wt-ring grid size-16 place-items-center rounded-full text-white")}
        style={{ background: tone, ["--wt-ring-color" as string]: tone }}
        aria-hidden
      >
        <Icon className="size-8" strokeWidth={3} />
      </span>
      <h2 className="wt-fade-up mt-5 text-xl font-semibold text-wt-text" style={{ animationDelay: "120ms" }}>
        {title}
      </h2>
      <p className="wt-fade-up mt-1.5 max-w-xs text-sm text-wt-text-muted" style={{ animationDelay: "200ms" }}>
        {detail}
      </p>
      <div className="wt-fade-up mt-6" style={{ animationDelay: "280ms" }}>
        <Button variant="outline" render={<Link href="/dashboard/home" />}>
          {COPY.openWebTrak}
        </Button>
      </div>
    </div>
  );
}
