"use client"

import { useState, useCallback } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverPortal, PopoverPositioner, PopoverContent } from "@/components/ui/popover"
import { Field, FieldLabel } from "@/components/ui/field"
import { parseApiDate, formatApiDate, apiDateFieldValue } from "@/utils/apiDate"
import { cn } from "@/lib/utils"

function formatDisplayDate(value: string): string {
  const d = parseApiDate(value)
  if (!d) return ""
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function DatePicker({
  label = "",
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  max,
  className,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  min?: string
  max?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const parsedMin = min ? parseApiDate(min) : undefined
  const parsedMax = max ? parseApiDate(max) : undefined

  const selected = parseApiDate(value)
  const displayText = formatDisplayDate(value)
  const inputValue = apiDateFieldValue(value)

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onChange(formatApiDate(date))
        setOpen(false)
      }
    },
    [onChange]
  )

  return (
    <Field className={cn("", className)}>
      {label ? (
        <FieldLabel>
          {label}
          {required ? <span className="text-destructive" aria-hidden>*</span> : null}
        </FieldLabel>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors",
            "hover:bg-accent/50",
            "focus-visible:border-ring focus-visible:ring-0",
            "disabled:pointer-events-none disabled:opacity-50 disabled:bg-input/50",
            "aria-invalid:border-destructive",
            "cursor-pointer",
            displayText ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left truncate">
            {displayText || inputValue || "Select date"}
          </span>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverPositioner align="start" sideOffset={4}>
            <PopoverContent className="p-0">
            <Calendar
              mode="single"
              selected={selected ?? undefined}
              onSelect={handleSelect}
              disabled={[
                ...(parsedMin ? [{ before: parsedMin }] : []),
                ...(parsedMax ? [{ after: parsedMax }] : []),
              ]}
            />
            </PopoverContent>
          </PopoverPositioner>
        </PopoverPortal>
      </Popover>
    </Field>
  )
}
