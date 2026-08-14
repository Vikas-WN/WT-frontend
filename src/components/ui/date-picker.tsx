"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverPortal, PopoverPositioner, PopoverContent } from "@/components/ui/popover"
import { Field, FieldLabel } from "@/components/ui/field"
import { parseApiDate, formatApiDate, apiDateFieldValue } from "@/utils/apiDate"
import { FORM_CONTROL_CLASS } from "@/components/dashboard/ui/uiLayout"
import { cn } from "@/lib/utils"

type PopoverSide = "top" | "bottom" | "left" | "right" | "inline-end" | "inline-start"
type PopoverAlign = "start" | "center" | "end"

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

function readPlacement(el: HTMLElement | null): {
  side: PopoverSide | null
  align: PopoverAlign | null
} {
  if (!el) return { side: null, align: null }
  const side = el.getAttribute("data-side") as PopoverSide | null
  const align = el.getAttribute("data-align") as PopoverAlign | null
  return { side, align }
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
}) {
  const [open, setOpen] = useState(false)
  const [lockedSide, setLockedSide] = useState<PopoverSide | null>(null)
  const [lockedAlign, setLockedAlign] = useState<PopoverAlign | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  const parsedMin = min ? parseApiDate(min) : undefined
  const parsedMax = max ? parseApiDate(max) : undefined

  const selected = parseApiDate(value)
  const displayText = formatDisplayDate(value)
  const inputValue = apiDateFieldValue(value)

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) {
      setLockedSide(null)
      setLockedAlign(null)
    }
  }, [])

  // After the first collision-aware place, freeze side/align so month navigation
  // (content remeasure) cannot flip or shift the popup.
  useEffect(() => {
    if (!open || lockedSide) return
    let cancelled = false
    let attempts = 0

    const lock = () => {
      if (cancelled) return
      const { side, align } = readPlacement(contentRef.current)
      if (side) {
        setLockedSide(side)
        setLockedAlign(align ?? "start")
        return
      }
      if (attempts++ < 8) {
        requestAnimationFrame(lock)
      }
    }

    const frame = requestAnimationFrame(lock)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [open, lockedSide])

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onChange(formatApiDate(date))
        setOpen(false)
      }
    },
    [onChange]
  )

  const placementLocked = Boolean(lockedSide)

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
          <PopoverPositioner
            side={lockedSide ?? "bottom"}
            align={lockedAlign ?? "start"}
            sideOffset={4}
            positionMethod="fixed"
            collisionPadding={8}
            collisionAvoidance={
              placementLocked
                ? { side: "none", align: "none", fallbackAxisSide: "none" }
                : {
                    side: "flip",
                    align: "shift",
                    fallbackAxisSide: "end",
                  }
            }
            className={cn("z-[250]", positionerClassName)}
          >
            <PopoverContent
              ref={contentRef}
              className={cn(
                "border-wt-border bg-wt-surface-1 p-0 shadow-lg",
                "max-h-[min(var(--available-height,100dvh),24rem)] overflow-y-auto overscroll-contain"
              )}
            >
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
