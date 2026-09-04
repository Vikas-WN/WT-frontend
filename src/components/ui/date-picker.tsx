"use client"

import { useState, useCallback } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverPortal, PopoverPositioner, PopoverContent } from "@/components/ui/popover"
import { Field, FieldLabel } from "@/components/ui/field"
import { parseApiDate, formatApiDate, apiDateFieldValue } from "@/utils/apiDate"
import { FORM_CONTROL_CLASS } from "@/components/dashboard/ui/uiLayout"
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
  positionerClassName,
  id,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  min?: string
  max?: string
  className?: string
  /** Raise above modals (z-[200]) when the picker is used inside a dialog. */
  positionerClassName?: string
  id?: string
}) {
  const [open, setOpen] = useState(false)

  const parsedMin = min ? parseApiDate(min) : undefined
  const parsedMax = max ? parseApiDate(max) : undefined

  const selected = parseApiDate(value)
  const displayText = formatDisplayDate(value)
  const inputValue = apiDateFieldValue(value)

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
  }, [])

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
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          disabled={disabled}
          id={id}
          className={cn(
            FORM_CONTROL_CLASS,
            "flex cursor-pointer items-center gap-2 hover:bg-wt-surface-2/70",
            "aria-invalid:border-destructive",
            displayText ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left truncate">
            {displayText || inputValue || "Select date"}
          </span>
        </PopoverTrigger>
        <PopoverPortal>
          {/*
            Collision avoidance stays enabled for as long as the popup is open so it
            keeps flipping/shifting back into view on scroll and resize. The calendar
            renders `fixedWeeks`, so its height does not change between months and
            cannot cause placement jitter.
          */}
          <PopoverPositioner
            side="bottom"
            align="start"
            sideOffset={4}
            positionMethod="fixed"
            collisionPadding={16}
            collisionAvoidance={{
              // Behave like a dropdown, not a free-floating popup: flip top/bottom
              // and shift into view, but never fall back to a left/right side of the
              // field — that pushes the calendar past the viewport edge for fields
              // in the right column. When vertical space is tight the calendar
              // scrolls internally (see max-h below) instead.
              side: "flip",
              align: "shift",
              fallbackAxisSide: "none",
            }}
            className={cn("z-[250]", positionerClassName)}
          >
            <PopoverContent
              className={cn(
                "border-wt-border bg-wt-surface-1 p-0 shadow-lg",
                // Never exceed the space the positioner reports, so a short viewport
                // scrolls the calendar instead of clipping it. collisionPadding on
                // the positioner keeps the popup off the screen edges.
                "max-h-[min(var(--available-height,100dvh),22rem)] overflow-y-auto overscroll-contain",
                "max-w-[min(var(--available-width,100vw),100vw)]"
              )}
            >
              <Calendar
                mode="single"
                compact
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
