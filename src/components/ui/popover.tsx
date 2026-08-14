"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function PopoverPortal(props: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

function PopoverRoot(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root {...props} />
}

function PopoverTrigger({ className, ...props }: PopoverPrimitive.Trigger.Props) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      className={cn("cursor-pointer", className)}
      {...props}
    />
  )
}

function PopoverPositioner({ className, ...props }: PopoverPrimitive.Positioner.Props) {
  return (
    <PopoverPrimitive.Positioner
      data-slot="popover-positioner"
      className={cn("z-[250] outline-none", className)}
      {...props}
    />
  )
}

const PopoverPopup = React.forwardRef<HTMLDivElement, PopoverPrimitive.Popup.Props>(
  function PopoverPopup({ className, ...props }, ref) {
    return (
      <PopoverPrimitive.Popup
        ref={ref}
        data-slot="popover-popup"
        className={cn(
          "w-auto rounded-xl border border-border bg-popover p-0 shadow-lg shadow-black/5 outline-none data-[side='bottom']:animate-in data-[side='top']:animate-out data-[side='top']:fade-out-0 data-[side='bottom']:fade-in-0 data-[side='bottom']:slide-in-from-top-2 data-[side='top']:slide-out-from-bottom-2",
          className
        )}
        {...props}
      />
    )
  }
)

function PopoverArrow({ className, ...props }: PopoverPrimitive.Arrow.Props) {
  return (
    <PopoverPrimitive.Arrow
      data-slot="popover-arrow"
      className={cn("fill-popover", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function PopoverClose({ className, ...props }: PopoverPrimitive.Close.Props) {
  return (
    <PopoverPrimitive.Close
      data-slot="popover-close"
      className={cn("cursor-pointer", className)}
      {...props}
    />
  )
}

export {
  PopoverRoot as Popover,
  PopoverTrigger as PopoverTrigger,
  PopoverPortal as PopoverPortal,
  PopoverPositioner as PopoverPositioner,
  PopoverPopup as PopoverContent,
  PopoverArrow as PopoverArrow,
  PopoverTitle as PopoverTitle,
  PopoverDescription as PopoverDescription,
  PopoverClose as PopoverClose,
}
