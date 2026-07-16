import * as React from "react"

import { BRAND_FOCUS_RING_CLASS } from "@/components/dashboard/ui/uiLayout"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[7.5rem] w-full rounded-xl border border-input bg-wt-surface-1 px-3.5 py-3 text-sm",
        "transition-[border-color,box-shadow,background-color] duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
        "outline-none placeholder:text-muted-foreground",
        BRAND_FOCUS_RING_CLASS,
        "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "dark:bg-input/30 dark:disabled:bg-input/80",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
