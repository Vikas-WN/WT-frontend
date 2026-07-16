"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

type RefreshIconButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  className?: string;
};

/**
 * Minimal icon-only refresh control — pitch-black glyph, no label.
 */
export function RefreshIconButton({
  onClick,
  disabled = false,
  loading = false,
  label = "Refresh",
  className,
}: RefreshIconButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      title={label}
      className={cn(
        "h-9 w-9 shrink-0 rounded-lg border-0 bg-transparent p-0",
        "text-black shadow-none hover:bg-black/[0.06] hover:text-black",
        "dark:text-white dark:hover:bg-white/[0.08] dark:hover:text-white",
        "disabled:opacity-40",
        className
      )}
    >
      <RefreshCw
        className={cn("size-4 stroke-[2.25]", loading && "animate-spin")}
        aria-hidden
      />
    </Button>
  );
}
