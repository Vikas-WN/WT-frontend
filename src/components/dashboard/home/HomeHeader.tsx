"use client";

import Link from "next/link";
import { CalendarPlus, Check, Clock, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { AddWidgetMenu } from "@/components/dashboard/home/AddWidgetMenu";
import { Button } from "@/components/ui/button";
import { DASHBOARD_ROUTES } from "@/constants/routes";

interface HomeHeaderProps {
  eyebrow: string;
  title: string;
  /** One line under the greeting — what is waiting. May carry highlighted counts. */
  subtitle?: ReactNode;
  editMode: boolean;
  onEditModeChange: (editing: boolean) => void;
  hiddenWidgets: { id: string; title: string }[];
  onShowWidget: (id: string) => void;
  onReset: () => void;
}

/** The greeting: the date, "Good afternoon, Name", what is waiting — and the two things people do most, plus customise. */
export function HomeHeader({ eyebrow, title, subtitle, editMode, onEditModeChange, hiddenWidgets, onShowWidget, onReset }: HomeHeaderProps) {
  return (
    <header data-page-hero className="flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <p className="text-sm text-wt-text-muted">{eyebrow}</p>
        <h1 className="mt-1 text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-wt-text sm:text-[1.75rem]">{title}</h1>
        {subtitle ? <p className="mt-1 text-base text-wt-text-muted">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {editMode ? (
          <>
            <AddWidgetMenu hiddenWidgets={hiddenWidgets} onShow={onShowWidget} />
            <Button variant="outline" onClick={onReset}>
              Reset layout
            </Button>
            <Button variant="brand" onClick={() => onEditModeChange(false)}>
              <Check className="size-4" /> Done
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="lg" nativeButton={false} render={<Link href={DASHBOARD_ROUTES.timelog} />}>
              <Clock className="size-4" /> Log time
            </Button>
            <Button variant="brand" size="lg" nativeButton={false} render={<Link href={`${DASHBOARD_ROUTES.leave}?tab=my`} />}>
              <CalendarPlus className="size-4" /> Apply for leave
            </Button>
            <Button variant="outline" size="icon-lg" onClick={() => onEditModeChange(true)} aria-label="Customize this page" title="Customize this page">
              <SlidersHorizontal className="size-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
