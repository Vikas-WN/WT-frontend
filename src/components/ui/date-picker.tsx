"use client"

import { useState, useCallback } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverPositioner,
  PopoverContent,
} from "@/components/ui/popover"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  parseApiDate,
  formatApiDate,
  apiDateFieldValue,
} from "@/utils/apiDate"
import { FORM_CONTROL_CLASS } from "@/components/dashboard/ui/uiLayout"
import { cn } from "@/lib/utils"

function formatDisplayDate(value: string): string {
  const d = parseApiDate(value)
  if (!d) return ""

  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
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
        // Keep the value sent to the API in YYYY-MM-DD format.
        // Only the UI display uses DD/MM/YYYY.
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
          {required ? (
            <span className="text-destructive" aria-hidden>
              *
            </span>
          ) : null}
        </FieldLabel>
      ) : null}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          disabled={disabled}
          id={id}
          onKeyDown={(event) => {
            // Tabbing off the trigger while the calendar is open must move focus
            // to the next field, not into the popup's own Previous/Next-month
            // buttons and day cells.
            if (event.key !== "Tab" || !open) return

            event.preventDefault()
            setOpen(false)

            const trigger = event.currentTarget

            const focusable = Array.from(
              document.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
              )
            ).filter(
              (el) =>
                el.offsetParent !== null &&
                !el.closest('[data-slot="popover-popup"]')
            )

            const index = focusable.indexOf(trigger)

            if (index === -1) return

            const next =
              focusable[index + (event.shiftKey ? -1 : 1)]

            next?.focus()
          }}
          className={cn(
            FORM_CONTROL_CLASS,
            "flex cursor-pointer items-center gap-2 hover:bg-wt-surface-2/70",
            "aria-invalid:border-destructive",
            displayText
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />

          <span className="flex-1 text-left truncate">
            {displayText || inputValue || "Select date"}
          </span>
        </PopoverTrigger>

        <PopoverPortal>
          {/*
            Collision avoidance stays enabled for as long as the popup is open
            so it keeps flipping/shifting back into view on scroll and resize.
            The calendar renders fixedWeeks, so its height does not change
            between months and cannot cause placement jitter.
          */}
          <PopoverPositioner
            side="bottom"
            align="start"
            sideOffset={4}
            positionMethod="fixed"
            collisionPadding={16}
            collisionAvoidance={{
              // Behave like a dropdown, not a free-floating popup.
              side: "flip",
              align: "flip",
              fallbackAxisSide: "none",
            }}
            className={cn("z-[250]", positionerClassName)}
          >
            <PopoverContent
              // Keep focus on the trigger when the popup opens so keyboard
              // navigation behaves correctly.
              initialFocus={false}
              className={cn(
                "border-wt-border bg-wt-surface-1 p-0 shadow-lg",
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
