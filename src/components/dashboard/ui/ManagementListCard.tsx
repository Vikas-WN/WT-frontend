"use client";

import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardToolbar,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import {
  CARD_CONTENT_BELOW_TOOLBAR_CLASS,
  CARD_CONTENT_COMPACT_CLASS,
  CARD_CONTENT_STACK_CLASS,
  CARD_CONTENT_STACK_COMPACT_CLASS,
  CARD_HEADER_CLASS,
  CARD_HEADER_COMPACT_CLASS,
  CARD_TOOLBAR_CLASS,
  CARD_TOOLBAR_COMPACT_CLASS,
  CARD_TOOLBAR_INNER_CLASS,
  CARD_TOOLBAR_INNER_COMPACT_CLASS,
  CONTENT_CARD_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { UI_COPY } from "@/constants/uiCopy";
import { cn } from "@/lib/utils";

type ManagementListCardProps = {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  /** A section inside a page that has its own heading: the title stays inside the card. */
  embedded?: boolean;
  /** Summary cards shown between the page heading and the list card. */
  aboveCard?: ReactNode;
  toolbar?: ReactNode;
  search?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Tighter padding and vertical rhythm for data-heavy list pages. */
  density?: "default" | "compact";
};

export function ManagementListCard({
  title,
  description,
  headerAction,
  aboveCard,
  embedded = false,
  toolbar,
  search,
  filters,
  children,
  className,
  density = "default",
}: ManagementListCardProps) {
  const hasToolbar = Boolean(toolbar || search || filters);
  const compact = density === "compact";

  return (
    <div className={cn("space-y-6 wt-soft-in", className)}>
      {embedded ? null : <PageHero title={title} description={description} action={headerAction} raw />}
      {aboveCard}
      <Card className={cn("p-0", CONTENT_CARD_CLASS)}>
      {embedded ? (
        <>
          <CardHeader
            className={cn(
              "flex flex-col space-y-0 sm:flex-row sm:items-start sm:justify-between",
              compact ? "gap-2" : "gap-3",
              compact ? CARD_HEADER_COMPACT_CLASS : CARD_HEADER_CLASS
            )}
          >
            <div className="min-w-0 flex-1">
              <CardTitle>{title}</CardTitle>
              {description ? <CardDescription className={compact ? "mt-0.5" : undefined}>{description}</CardDescription> : null}
            </div>
            {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
          </CardHeader>
          <Separator />
        </>
      ) : null}
      {hasToolbar ? (
        <CardToolbar className={compact ? CARD_TOOLBAR_COMPACT_CLASS : CARD_TOOLBAR_CLASS}>
          {toolbar ?? (
            <div className={compact ? CARD_TOOLBAR_INNER_COMPACT_CLASS : CARD_TOOLBAR_INNER_CLASS}>
              {search ? <div className="min-w-0 flex-1">{search}</div> : null}
              {filters ? (
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-start sm:justify-end",
                    compact ? "gap-2" : "gap-3"
                  )}
                >
                  {filters}
                </div>
              ) : null}
            </div>
          )}
        </CardToolbar>
      ) : null}

      <CardContent
        className={
          hasToolbar
            ? compact
              ? CARD_CONTENT_COMPACT_CLASS
              : CARD_CONTENT_BELOW_TOOLBAR_CLASS
            : undefined
        }
      >
        <div className={compact ? CARD_CONTENT_STACK_COMPACT_CLASS : CARD_CONTENT_STACK_CLASS}>
          {children}
        </div>
      </CardContent>
      </Card>
    </div>
  );
}

type ManagementListContentProps = {
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  skeletonRows?: number;
  skeletonColumns?: number;
  children: ReactNode;
};

export function ManagementListContent({
  isLoading,
  isEmpty,
  emptyTitle = UI_COPY.noRecordsFound,
  emptyDescription = UI_COPY.adjustFilters,
  emptyIcon,
  skeletonRows = 8,
  skeletonColumns = 4,
  children,
}: ManagementListContentProps) {
  if (isLoading) {
    return <TableRowsSkeleton rows={skeletonRows} columns={skeletonColumns} />;
  }

  if (isEmpty) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
    );
  }

  return <>{children}</>;
}
