"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Callout = {
  label: string;
  top: string;
  left: string;
};

type GuideFigureProps = {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
  callouts?: Callout[];
};

export function GuideFigureFrame({
  title,
  subtitle,
  className,
  children,
  callouts = [],
}: GuideFigureProps) {
  return (
    <figure
      className={cn(
        "guide-figure relative overflow-hidden rounded-xl border border-wt-border bg-wt-surface-1 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-wt-border bg-wt-surface-2/80 px-3 py-2">
        <div className="flex gap-1">
          <span className="size-2 rounded-full bg-rose-400/80" />
          <span className="size-2 rounded-full bg-amber-400/80" />
          <span className="size-2 rounded-full bg-emerald-400/80" />
        </div>
        <div className="min-w-0 flex-1 truncate text-center text-[10px] font-medium text-wt-text-muted">
          WebTrak — {title}
        </div>
      </div>
      {subtitle ? (
        <figcaption className="border-b border-wt-border px-4 py-2 text-xs text-wt-text-muted">
          {subtitle}
        </figcaption>
      ) : null}
      <div className="relative p-4">{children}</div>
      {callouts.map((callout) => (
        <div
          key={callout.label}
          className="pointer-events-none absolute z-10 max-w-[8.5rem] rounded-md border border-[var(--wt-brand)] bg-white/95 px-2 py-1 text-[10px] font-medium text-[var(--wt-brand)] shadow-sm dark:bg-wt-surface-1"
          style={{ top: callout.top, left: callout.left }}
        >
          {callout.label}
        </div>
      ))}
    </figure>
  );
}

function MockSidebar({ active }: { active?: string }) {
  const items = ["Directory", "Offboarding", "Leave Requests", "Help & Guide"];
  return (
    <div className="w-36 shrink-0 rounded-lg border border-wt-border bg-wt-surface-2 p-2 text-[10px]">
      <p className="mb-2 font-semibold text-wt-text">Sidebar</p>
      {items.map((item) => (
        <div
          key={item}
          className={cn(
            "rounded px-2 py-1",
            active === item
              ? "bg-[var(--wt-brand-soft)] font-medium text-[var(--wt-brand)]"
              : "text-wt-text-muted"
          )}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-medium uppercase tracking-wide text-wt-text-muted">{label}</p>
      <div className="rounded-md border border-wt-border bg-white px-2 py-1.5 text-[11px] text-wt-text dark:bg-wt-surface-2">
        {value}
      </div>
    </div>
  );
}

export function GuideFigureById({ figureId }: { figureId: string }) {
  switch (figureId) {
    case "navigation":
      return (
        <GuideFigureFrame
          title="Navigation"
          subtitle="Sidebar groups and notification bell"
          callouts={[
            { label: "Notifications", top: "12%", left: "72%" },
            { label: "Help & Guide", top: "68%", left: "4%" },
          ]}
        >
          <div className="flex gap-3">
            <MockSidebar active="Help & Guide" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex justify-between rounded-lg border border-wt-border bg-wt-page-bg px-3 py-2">
                <span className="text-xs font-semibold">Help & Guide</span>
                <span className="rounded-full bg-[var(--wt-brand-soft)] px-2 py-0.5 text-[10px] text-[var(--wt-brand)]">
                  3 new
                </span>
              </div>
              <div className="h-24 rounded-lg border border-dashed border-wt-border bg-wt-surface-2/50" />
            </div>
          </div>
        </GuideFigureFrame>
      );
    case "profile":
      return (
        <GuideFigureFrame title="Profile" subtitle="Self onboarding form">
          <div className="grid gap-2 sm:grid-cols-2">
            <MockField label="Name" value="Alex Morgan" />
            <MockField label="Work email" value="alex@company.com" />
            <MockField label="Primary skills" value="React · TypeScript" />
            <MockField label="Self rating" value="4" />
          </div>
        </GuideFigureFrame>
      );
    case "directory":
      return (
        <GuideFigureFrame
          title="Employee Directory"
          subtitle="Filters and profile access"
          callouts={[{ label: "User type filter", top: "28%", left: "55%" }]}
        >
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-24 rounded-md border border-wt-border bg-white text-[10px] leading-7 text-center text-wt-text-muted">
                User type
              </div>
              <div className="h-7 w-28 rounded-md border border-wt-border bg-white text-[10px] leading-7 text-center text-wt-text-muted">
                Primary skill
              </div>
            </div>
            <div className="rounded-lg border border-wt-border">
              <div className="grid grid-cols-3 gap-2 border-b border-wt-border bg-wt-surface-2 px-2 py-1 text-[9px] font-semibold uppercase text-wt-text-muted">
                <span>Name</span>
                <span>Type</span>
                <span>Status</span>
              </div>
              <div className="grid grid-cols-3 gap-2 px-2 py-2 text-[11px]">
                <span className="font-medium text-[var(--wt-brand)]">Jordan Lee</span>
                <span>Consultant</span>
                <span>Active</span>
              </div>
            </div>
          </div>
        </GuideFigureFrame>
      );
    case "onboarding":
      return (
        <GuideFigureFrame title="Onboarding" subtitle="HR invite form">
          <div className="grid gap-2 sm:grid-cols-2">
            <MockField label="User type" value="Full-Time" />
            <MockField label="Band" value="B5" />
            <MockField label="Designation" value="Software Engineer" />
            <MockField label="Primary skills" value="Java · Spring Boot" />
          </div>
        </GuideFigureFrame>
      );
    case "offboarding":
      return (
        <GuideFigureFrame
          title="Offboarding"
          subtitle="Consultant vs Full-Time fields"
          callouts={[{ label: "LWD only for Consultant", top: "42%", left: "8%" }]}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <MockField label="Employee" value="Jordan Lee (Consultant)" />
            <MockField label="Last working day" value="2026-09-30" />
            <div className="sm:col-span-2">
              <MockField label="Exit type" value="Contractual (fixed)" />
            </div>
          </div>
        </GuideFigureFrame>
      );
    case "leave-team":
      return (
        <GuideFigureFrame title="Team Leave Requests" subtitle="Manager inbox">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="rounded-full bg-[var(--wt-brand-soft)] px-2 py-0.5 text-[10px] text-[var(--wt-brand)]">
                Optional
              </div>
              <div className="rounded-full bg-wt-surface-2 px-2 py-0.5 text-[10px] text-wt-text-muted">
                Comp Off Credit
              </div>
            </div>
            <div className="rounded-lg border border-wt-border p-2 text-[11px]">
              <p className="font-medium">Priya Sharma — Optional leave</p>
              <p className="text-wt-text-muted">12–13 Aug · Pending your approval</p>
              <div className="mt-2 flex gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
                  Approve
                </span>
                <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] text-rose-800">
                  Reject
                </span>
              </div>
            </div>
          </div>
        </GuideFigureFrame>
      );
    case "leave-self":
      return (
        <GuideFigureFrame title="Leave Request" subtitle="Self-service apply">
          <div className="grid gap-2 sm:grid-cols-2">
            <MockField label="Type" value="Leave" />
            <MockField label="From – To" value="5 Aug – 7 Aug" />
            <div className="sm:col-span-2">
              <MockField label="Reason" value="Personal" />
            </div>
          </div>
        </GuideFigureFrame>
      );
    case "timelog":
      return (
        <GuideFigureFrame title="Time Logs" subtitle="Weekly grid">
          <div className="rounded-lg border border-wt-border text-[10px]">
            <div className="grid grid-cols-4 border-b border-wt-border bg-wt-surface-2 px-2 py-1 font-semibold">
              <span>Project</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Total</span>
            </div>
            <div className="grid grid-cols-4 px-2 py-1.5">
              <span>Alpha</span>
              <span>8</span>
              <span>8</span>
              <span className="font-medium">16</span>
            </div>
          </div>
        </GuideFigureFrame>
      );
    case "allocation":
      return (
        <GuideFigureFrame title="Project Allocation" subtitle="Assign employees">
          <div className="grid gap-2 sm:grid-cols-2">
            <MockField label="Project" value="PROJ1 — Customer Portal" />
            <MockField label="Employee" value="Sam Rivera" />
            <MockField label="Allocation" value="100%" />
            <MockField label="End date" value="2026-12-31" />
          </div>
        </GuideFigureFrame>
      );
    case "allocation-extension":
      return (
        <GuideFigureFrame title="Extend Allocation" subtitle="Manager request">
          <div className="grid gap-2 sm:grid-cols-2">
            <MockField label="Project" value="PROJ1 — Customer Portal" />
            <MockField label="New end date" value="2027-03-31" />
            <div className="sm:col-span-2">
              <MockField label="Reason" value="Phase 2 delivery extension" />
            </div>
          </div>
        </GuideFigureFrame>
      );
    case "exit-survey":
      return (
        <GuideFigureFrame title="Exit Survey" subtitle="Follow-up list">
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between rounded-lg border border-wt-border p-2">
              <span>Chris Wong</span>
              <span className="text-amber-700">Pending</span>
            </div>
            <div className="flex justify-between rounded-lg border border-wt-border p-2">
              <span>Dana Kim</span>
              <span className="text-emerald-700">Submitted</span>
            </div>
          </div>
        </GuideFigureFrame>
      );
    case "reports":
      return (
        <GuideFigureFrame title="Reports" subtitle="Workforce overview">
          <div className="grid grid-cols-3 gap-2">
            {["Headcount", "Attrition %", "Bench"].map((label) => (
              <div
                key={label}
                className="rounded-lg border border-wt-border bg-wt-surface-2/60 p-2 text-center"
              >
                <p className="text-[9px] uppercase text-wt-text-muted">{label}</p>
                <p className="text-lg font-semibold tabular-nums text-wt-text">—</p>
              </div>
            ))}
          </div>
        </GuideFigureFrame>
      );
    default:
      return null;
  }
}

export function GuideFigure({ figureId }: { figureId: string }) {
  const content = GuideFigureById({ figureId });
  if (!content) return null;
  return <div className="guide-figure-wrap my-4">{content}</div>;
}
