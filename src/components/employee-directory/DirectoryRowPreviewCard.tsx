"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { Copy } from "lucide-react";
import {
  avatarGradientStyle,
  avatarInitials,
  resolveProfilePhotoSrc,
} from "@/components/dashboard/ui/profile";
import { cn } from "@/lib/utils";

const DASH = "—";

function hasValue(value: string | undefined | null): boolean {
  const t = String(value ?? "").trim();
  return t.length > 0 && t !== DASH;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-wt-text-faint">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right text-xs text-wt-text">
        {hasValue(value) ? value : DASH}
      </dd>
    </div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string, message: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-wt-text-faint">
        {label}
      </dt>
      <dd className="flex min-w-0 items-center gap-1">
        <span className="min-w-0 truncate text-xs text-wt-text">
          {hasValue(value) ? value : DASH}
        </span>
        {hasValue(value) ? (
          <button
            type="button"
            aria-label={`Copy ${label}`}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded text-wt-text-muted transition-colors hover:bg-wt-surface-2 hover:text-wt-text"
            onClick={(event) => {
              event.stopPropagation();
              onCopy(value, `${label} copied`);
            }}
          >
            <Copy className="size-3.5" />
          </button>
        ) : null}
      </dd>
    </div>
  );
}

export type DirectoryRowPreviewCardProps = {
  name: string;
  designation: string;
  band: string;
  department: string;
  email: string;
  phone: string;
  /** Raw directory record — used only to resolve the profile photo. */
  profile: Record<string, unknown>;
  onCopy: (value: string, message: string) => void;
  rowClassName?: string;
  onRowClick?: () => void;
  onRowKeyDown?: (event: KeyboardEvent<HTMLTableRowElement>) => void;
  rowAriaLabel?: string;
  children: ReactNode;
};

/**
 * A directory table row that reveals a contact card on hover / focus:
 * photo, name, designation, band, department, and one-click-copyable
 * work email + phone.
 */
export function DirectoryRowPreviewCard({
  name,
  designation,
  band,
  department,
  email,
  phone,
  profile,
  onCopy,
  rowClassName,
  onRowClick,
  onRowKeyDown,
  rowAriaLabel,
  children,
}: DirectoryRowPreviewCardProps) {
  const photoSrc = resolveProfilePhotoSrc(profile);
  const initials = avatarInitials(name);

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={220}
        closeDelay={120}
        render={(props) => (
          <tr
            {...props}
            className={rowClassName}
            onClick={onRowClick}
            onKeyDown={onRowKeyDown}
            tabIndex={0}
            role="link"
            aria-label={rowAriaLabel}
          >
            {children}
          </tr>
        )}
      />
      <PreviewCard.Portal>
        <PreviewCard.Positioner
          side="right"
          align="start"
          sideOffset={12}
          collisionPadding={12}
          className="z-[60]"
        >
          <PreviewCard.Popup
            className={cn(
              "w-[19rem] max-w-[calc(100vw-1.5rem)] rounded-xl border border-wt-border bg-wt-surface-1 p-4",
              "shadow-lg shadow-black/10 outline-none",
              "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
            )}
          >
            <div className="flex items-center gap-3">
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoSrc}
                  alt=""
                  className="size-12 shrink-0 rounded-full border border-wt-border object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={avatarGradientStyle(name)}
                >
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-wt-text">{name}</p>
                <p className="truncate text-xs text-wt-text-muted">
                  {hasValue(designation) ? designation : "No designation"}
                </p>
              </div>
            </div>

            <dl className="mt-3 space-y-2 border-t border-wt-border pt-3">
              <MetaRow label="Band" value={band} />
              <MetaRow label="Department" value={department} />
              <CopyRow label="Work Email" value={email} onCopy={onCopy} />
              <CopyRow label="Phone" value={phone} onCopy={onCopy} />
            </dl>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
