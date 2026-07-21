import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Soft focus-visible:ring-* glows looked like a light halo after click.
  // Keyboard focus uses the global :focus-visible outline in globals.css.
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,box-shadow,color,transform,opacity] duration-[var(--wt-duration)] ease-[var(--wt-ease)] outline-none select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--wt-brand)] text-[var(--wt-brand-text)] shadow-sm hover:bg-[var(--wt-brand-hover)] active:bg-[var(--wt-brand-active)]",
        brand:
          "bg-[var(--wt-brand)] text-[var(--wt-brand-text)] shadow-sm hover:bg-[var(--wt-brand-hover)] active:bg-[var(--wt-brand-active)]",
        outline:
          "border-wt-border bg-wt-surface-1 text-wt-text hover:bg-wt-surface-2 hover:text-wt-text aria-expanded:bg-wt-surface-2 dark:border-wt-border dark:bg-wt-surface-1 dark:hover:bg-wt-surface-2",
        secondary:
          "bg-wt-surface-2 text-wt-text hover:bg-wt-surface-3 aria-expanded:bg-wt-surface-3",
        ghost:
          "hover:bg-wt-surface-2 hover:text-wt-text aria-expanded:bg-wt-surface-2 dark:hover:bg-wt-surface-2/80",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-[var(--wt-brand)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-xl px-3.5 text-[0.8125rem] in-data-[slot=button-group]:rounded-xl has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-lg in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-xl in-data-[slot=button-group]:rounded-xl",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // Base UI defaults nativeButton=true. Only opt out for non-button renders
  // (e.g. Next.js Link). Combobox/InputGroup still render real <button>s via
  // `render`, so auto-forcing false whenever `render` is set is incorrect.
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={render}
      {...(nativeButton !== undefined ? { nativeButton } : {})}
      {...props}
    />
  )
}

export { Button, buttonVariants }
