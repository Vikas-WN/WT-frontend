import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  surface?: boolean;
  raw?: boolean;
};

/** A single page heading and action zone; typography follows authored copy. */
export function PageHero({title, description, eyebrow, action, className, surface = false}: PageHeroProps) {
  return <header data-page-hero className={cn("wt-page-hero", surface && "wt-page-hero-surface", className)}>
    <div className="min-w-0 max-w-3xl">
      {eyebrow ? <p className="wt-page-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p className="wt-page-description">{description}</p> : null}
    </div>
    {action ? <div className="wt-page-actions">{action}</div> : null}
  </header>;
}
