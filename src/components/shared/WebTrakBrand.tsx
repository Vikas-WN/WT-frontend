"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "login" | "header" | "sidebar";

type WebTrakBrandProps = {
  variant?: Variant;
  /** Icon-only mark for the collapsed sidebar rail. */
  compact?: boolean;
  className?: string;
  asLink?: boolean;
};

const LOGO_SRC = "/webtrak-logo.png";

function logoFrameClass(variant: Variant, compact: boolean) {
  if (compact) {
    return "size-10 rounded-xl bg-[color-mix(in_srgb,var(--wt-brand)_10%,transparent)] p-1.5 ring-1 ring-[color-mix(in_srgb,var(--wt-brand)_16%,transparent)]";
  }
  if (variant === "login") return "size-12 rounded-xl p-2 sm:size-[3.25rem] sm:p-2.5";
  if (variant === "sidebar") {
    // Sidebar is always dark, so this frame needs more brand presence than
    // the same treatment gets on a light surface to actually read.
    return "size-9 rounded-xl bg-[color-mix(in_srgb,var(--wt-brand)_22%,transparent)] p-1.5 ring-1 ring-[color-mix(in_srgb,var(--wt-brand)_35%,transparent)]";
  }
  return "size-8 rounded-lg p-1";
}

function wordmarkClass(variant: Variant) {
  return cn(
    "wt-brand-wordmark",
    variant === "login" && "text-2xl font-bold tracking-[-0.045em] text-white",
    // Sidebar is deliberately fixed-dark regardless of app theme — the
    // wordmark needs its own always-light color, not text-wt-text (which
    // flips and would go invisible against the dark sidebar in light mode).
    variant === "sidebar" &&
      "truncate text-[1.05rem] font-semibold tracking-[-0.035em] text-[var(--wt-sidebar-text)]",
    variant === "header" && "text-lg font-semibold tracking-[-0.035em] text-wt-text"
  );
}

export function WebTrakBrand({
  variant = "header",
  compact = false,
  className = "",
  asLink = true,
}: WebTrakBrandProps) {
  const logoSize = compact ? 32 : variant === "login" ? 44 : variant === "sidebar" ? 36 : 28;

  const logo = (
    <span
      className={cn("flex shrink-0 items-center justify-center", logoFrameClass(variant, compact))}
      aria-hidden={!compact}
    >
      <Image
        src={LOGO_SRC}
        alt={compact ? "webtrak" : ""}
        width={logoSize}
        height={logoSize}
        priority={variant === "login"}
        unoptimized
        className={cn(
          "size-full object-contain",
          // Sidebar is always dark regardless of app theme, so it needs the
          // "on dark background" logo treatment unconditionally — everywhere
          // else that treatment only kicks in when the app theme is dark.
          variant === "sidebar"
            ? "brightness-[1.35] contrast-125 saturate-150 drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]"
            : "dark:brightness-[1.35] dark:contrast-125 dark:saturate-150 dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]"
        )}
      />
    </span>
  );

  const content = (
    <>
      {logo}
      {!compact ? <span className={wordmarkClass(variant)}>WebTrak</span> : null}
    </>
  );

  const wrapClass = cn(
    "flex min-w-0 items-center",
    compact ? "justify-center" : "gap-2.5",
    variant === "sidebar" && !compact && "justify-start",
    variant === "login" && "gap-3",
    className
  );

  if (asLink && variant !== "login") {
    return (
      <Link href="/dashboard" className={wrapClass} aria-label="webtrak home">
        {content}
      </Link>
    );
  }

  return <div className={wrapClass}>{content}</div>;
}
