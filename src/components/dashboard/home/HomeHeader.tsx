"use client";

import Link from "next/link";
import { CalendarPlus, Check, Clock, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { AddWidgetMenu } from "@/components/dashboard/home/AddWidgetMenu";
import { Button } from "@/components/ui/button";
import { DASHBOARD_ROUTES } from "@/constants/routes";

type HomeHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  editMode: boolean;
  onEditModeChange: (editing: boolean) => void;
  hiddenWidgets: { id: string; title: string }[];
  onShowWidget: (id: string) => void;
  onReset: () => void;
};

export function HomeHeader({eyebrow,title,subtitle,editMode,onEditModeChange,hiddenWidgets,onShowWidget,onReset}: HomeHeaderProps) {
  return <header data-page-hero className="wt-home-heading">
    <div className="min-w-0">
      <p className="wt-page-eyebrow">{eyebrow}</p>
      <h1>{title}<span className="text-wt-brand">.</span></h1>
      {subtitle ? <p className="wt-home-subtitle">{subtitle}</p> : null}
    </div>
    <div className="wt-page-actions">
      {editMode ? <>
        <AddWidgetMenu hiddenWidgets={hiddenWidgets} onShow={onShowWidget}/>
        <Button variant="outline" onClick={onReset}>Reset layout</Button>
        <Button onClick={()=>onEditModeChange(false)}><Check className="size-4"/>Done</Button>
      </> : <>
        <Button variant="ghost" size="icon" onClick={()=>onEditModeChange(true)} aria-label="Customize this page" title="Customize this page"><SlidersHorizontal className="size-4"/></Button>
        <Button variant="outline" nativeButton={false} render={<Link href={`${DASHBOARD_ROUTES.leave}?tab=my`}/>}><CalendarPlus className="size-4"/>Apply for leave</Button>
        <Button nativeButton={false} render={<Link href={DASHBOARD_ROUTES.timelog}/>}><Clock className="size-4"/>Log time</Button>
      </>}
    </div>
  </header>;
}
