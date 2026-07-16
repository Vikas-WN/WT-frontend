"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center text-wt-text-muted group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        /** Soft segmented control */
        default:
          "h-11 gap-1 rounded-xl bg-wt-surface-2 p-1 ring-1 ring-wt-border dark:bg-wt-surface-2 dark:ring-wt-border-md",
        /** Underline row for page / card headers */
        line: "h-auto gap-0 rounded-none bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-none cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
        "transition-[color,background-color,box-shadow,opacity,border-color] duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--wt-brand)_30%,transparent)]",
        "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",

        // Segmented (default)
        "group-data-[variant=default]/tabs-list:h-9 group-data-[variant=default]/tabs-list:rounded-lg group-data-[variant=default]/tabs-list:border-0 group-data-[variant=default]/tabs-list:px-3.5",
        "group-data-[variant=default]/tabs-list:text-wt-text-muted",
        "group-data-[variant=default]/tabs-list:hover:text-wt-text",
        "group-data-[variant=default]/tabs-list:data-active:bg-wt-surface-1 group-data-[variant=default]/tabs-list:data-active:text-wt-text group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=default]/tabs-list:data-active:ring-1 group-data-[variant=default]/tabs-list:data-active:ring-wt-border dark:group-data-[variant=default]/tabs-list:data-active:bg-wt-surface-3 dark:group-data-[variant=default]/tabs-list:data-active:shadow-none dark:group-data-[variant=default]/tabs-list:data-active:ring-wt-border-md",

        // Underline (line)
        "group-data-[variant=line]/tabs-list:h-11 group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-0 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:shadow-none",
        "group-data-[variant=line]/tabs-list:text-wt-text-muted",
        "group-data-[variant=line]/tabs-list:hover:text-wt-text",
        "group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-wt-text group-data-[variant=line]/tabs-list:data-active:shadow-none",

        // Brand underline indicator (line only)
        "after:pointer-events-none after:absolute after:opacity-0 after:transition-opacity after:duration-[var(--wt-duration)] after:ease-[var(--wt-ease)]",
        "group-data-horizontal/tabs:after:inset-x-3 group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-0.5 group-data-horizontal/tabs:after:rounded-full",
        "group-data-vertical/tabs:after:inset-y-2 group-data-vertical/tabs:after:left-0 group-data-vertical/tabs:after:w-0.5 group-data-vertical/tabs:after:rounded-full",
        "group-data-[variant=line]/tabs-list:after:bg-[var(--wt-brand)]",
        "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        "group-data-[variant=default]/tabs-list:after:hidden",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
