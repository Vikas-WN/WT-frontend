"use client";

import { useState, type ReactNode } from "react";
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

export type DirectoryNamePreviewCardProps = {
  name: string;
  designation: string;
  band: string;
  department: string;
  email: string;
  phone: string;
  /** Raw directory record — used only to resolve the profile photo. */
  profile: Record<string, unknown>;
  onCopy: (value: string, message: string) => void;
  /** The name/avatar element the hover-card is anchored to. */
  children: ReactNode;
};

/**
 * Wraps just the employee name/avatar cell content with a hover/focus contact
 * card: photo, name, designation, band, department, and one-click-copyable
 * work email + phone. Scoped to the name only (not the whole row) so hovering
 * elsewhere in the row — e.g. to open the Role or Status dropdown — never
 * triggers it.
 */
export function DirectoryNamePreviewCard({
  name,
  designation,
  band,
  department,
  email,
  phone,
  profile,
  onCopy,
  children,
}: DirectoryNamePreviewCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoSrc = resolveProfilePhotoSrc(profile);
  const initials = avatarInitials(name);
  const showPhoto = Boolean(photoSrc) && !imageFailed;

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={220}
        closeDelay={120}
        render={(props) => (
          <span {...props} className={cn(props.className, "inline-block min-w-0 max-w-full")}>
            {children}
          </span>
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
              <span
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-wt-border text-sm font-semibold text-white"
                style={showPhoto ? undefined : avatarGradientStyle(name)}
              >
                {showPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoSrc as string}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  initials
                )}
              </span>
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
