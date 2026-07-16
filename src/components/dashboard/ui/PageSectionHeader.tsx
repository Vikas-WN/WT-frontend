import type { ReactNode } from "react";

import {
  SECTION_DESCRIPTION_CLASS,
  SECTION_HEADER_CLASS,
  SECTION_TITLE_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import { formatUILabel } from "@/utils/titleCase";

export function PageSectionHeader({
  title,
  description,
  action,
  className,
  titleAs = "h3",
  divided = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  titleAs?: "h2" | "h3" | "h4";
  /** When true, applies the shared section divider under the header. */
  divided?: boolean;
}) {
  const TitleTag = titleAs;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        divided && SECTION_HEADER_CLASS,
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <TitleTag className={SECTION_TITLE_CLASS}>{formatUILabel(title)}</TitleTag>
        {description ? <p className={SECTION_DESCRIPTION_CLASS}>{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
