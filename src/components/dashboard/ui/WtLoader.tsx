"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type WtLoaderProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

export function WtLoader({ size = "md", className = "", label = "Loading" }: WtLoaderProps) {
  return (
    <span
      className={`wt-loader wt-loader--${size} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    />
  );
}

export function WtLoaderCentered({
  label = "Loading",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`.trim()}>
      <WtLoader size="lg" label={label || "Loading"} />
      {label ? (
        <p className="animate-pulse text-sm font-medium tracking-wide text-wt-text-muted">{label}</p>
      ) : null}
    </div>
  );
}

/** Full-viewport busy shield — blocks clicks/navigation until the parent unmounts it. */
export function WtLoadingOverlay({ label = "Loading" }: { label?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="wt-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex flex-col items-center justify-center gap-4 px-6">
        <WtLoader size="lg" label={label} />
        {label ? (
          <p className="animate-pulse text-center text-sm font-medium tracking-wide text-wt-text">
            {label}
          </p>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
