"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEP_LABELS } from "@/components/dashboard/referral/referral-form/referral-form.constants";

function StepCircle({ state, step }: { state: "completed" | "active" | "upcoming"; step: number }) {
  if (state === "completed") {
    return (
      <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white ring-[3px] ring-indigo-100 dark:ring-indigo-900/50">
        <Check className="size-3.5" />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white ring-[3px] ring-indigo-100 dark:ring-indigo-900/50">
        <span className="text-xs font-bold">{step}</span>
      </div>
    );
  }
  return (
    <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{step}</span>
    </div>
  );
}

export function Timeline({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-start py-2">
      {STEP_LABELS.map((label, idx) => {
        const n = (idx + 1) as 1 | 2 | 3;
        const state = n < step ? "completed" : n === step ? "active" : "upcoming";
        const isLast = n === STEP_LABELS.length;

        return (
          <div key={n} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              <div
                className={cn(
                  "flex-1 h-px",
                  idx === 0 ? "bg-transparent" : (n <= step ? "bg-indigo-400" : "bg-slate-200 dark:bg-slate-700")
                )}
              />
              <StepCircle state={state} step={n} />
              <div
                className={cn(
                  "flex-1 h-px",
                  isLast ? "bg-transparent" : (n < step ? "bg-indigo-400" : "bg-slate-200 dark:bg-slate-700")
                )}
              />
            </div>
            <span
              className={cn(
                "text-[10px] sm:text-xs font-medium whitespace-nowrap leading-tight mt-1.5 transition-colors",
                state === "active" && "text-indigo-600 dark:text-indigo-400 font-semibold",
                state === "completed" && "text-indigo-600 dark:text-indigo-400",
                state === "upcoming" && "text-slate-400 dark:text-slate-500"
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
