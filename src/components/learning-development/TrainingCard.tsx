"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/learning-development/ui/forms";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { formatUiStatusLabel } from "@/utils/statusLabel";
import { formatApiDateDisplay } from "@/utils/apiDate";
import { cn } from "@/lib/utils";

function formatLabel(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "—") return "—";
  return formatUiStatusLabel(raw);
}

export function TrainingCard({
  row,
  href,
  showEdit,
  onEdit,
}: {
  row: Record<string, unknown>;
  href: string;
  showEdit?: boolean;
  onEdit?: () => void;
}) {
  const id = String(row.id ?? "").trim();
  const name = String(row.name ?? `Training ${id}`).trim();
  const description = String(row.description ?? "").trim();
  const category = formatLabel(row.category);
  const type = formatLabel(row.type);
  const status = String(row.status ?? "—");
  const start = formatApiDateDisplay(String(row.start_date ?? row.training_start ?? ""));
  const end = formatApiDateDisplay(String(row.end_date ?? row.training_end ?? ""));

  return (
    <article
      className={cn(
        CONTENT_CARD_CLASS,
        "group relative flex min-h-[190px] flex-col p-6 transition-[border-color,box-shadow,transform] duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
        "hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--wt-brand)_35%,transparent)]"
      )}
    >
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wt-brand)]"
        aria-label={`Open ${name}`}
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold leading-snug tracking-tight text-wt-text line-clamp-2 pr-2 transition-colors group-hover:text-[var(--wt-brand)]">
            {name}
          </h3>
          <StatusBadge status={status} />
        </div>
        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-wt-text-muted line-clamp-2">
          {description || "No description yet."}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-wt-surface-2 px-2.5 py-1 text-[11px] font-medium text-wt-text-muted ring-1 ring-wt-border/80">
            {category}
          </span>
          <span className="rounded-lg bg-wt-surface-2 px-2.5 py-1 text-[11px] font-medium text-wt-text-muted ring-1 ring-wt-border/80">
            {type}
          </span>
        </div>
        <p className="mt-4 text-xs tabular-nums text-wt-text-faint">
          {start} → {end}
        </p>
      </div>
      {showEdit && onEdit ? (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="relative z-20 mt-3 h-auto self-start p-0 pointer-events-auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit Training
        </Button>
      ) : null}
    </article>
  );
}
