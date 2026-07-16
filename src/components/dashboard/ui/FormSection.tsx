"use client";

import type { ReactNode } from "react";
import {
  INNER_PANEL_CLASS,
  SECTION_DESCRIPTION_CLASS,
  SECTION_HEADER_CLASS,
  SECTION_TITLE_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { formatUILabel } from "@/utils/titleCase";
import { cn } from "@/lib/utils";

/**
 * Grouped form block. Renders as a soft inner panel (not a second heavy card)
 * so nested sections stay clean inside ContentCard shells.
 */
export function FormSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(INNER_PANEL_CLASS, className)}>
      <header className={SECTION_HEADER_CLASS}>
        <h4 className={cn(SECTION_TITLE_CLASS, "text-base")}>{formatUILabel(title)}</h4>
        {description ? <p className={SECTION_DESCRIPTION_CLASS}>{description}</p> : null}
      </header>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

export function FormSubsection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 border-t border-wt-border/80 pt-6">
      <h5 className={cn("mb-4", SECTION_TITLE_CLASS, "text-sm")}>{formatUILabel(title)}</h5>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
