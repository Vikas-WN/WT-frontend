"use client";

import { useState } from "react";
import {
  avatarInitials,
  avatarGradientStyle,
  resolveProfilePhotoSrc,
} from "@/components/dashboard/ui/profile";
import { cn } from "@/lib/utils";

export function DirectoryEmployeeNameCell({
  name,
  empId,
  profile,
  isOnline,
}: {
  name: string;
  empId?: string;
  profile: Record<string, unknown>;
  isOnline?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoSrc = resolveProfilePhotoSrc(profile);
  const showFallback = !photoSrc || imageFailed;
  const displayName = name.trim() || "Employee";
  const gradientSeed = String(empId ?? profile.email ?? profile.work_email ?? "").trim();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="relative shrink-0">
        <span
          className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-white/35 shadow-sm ring-1 ring-black/8"
          style={showFallback ? avatarGradientStyle(displayName, gradientSeed) : undefined}
        >
          {photoSrc && !imageFailed ? (
            <img
              src={photoSrc}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="text-[11px] font-semibold tracking-wide text-white drop-shadow-sm">
              {avatarInitials(displayName)}
            </span>
          )}
        </span>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-wt-surface-1",
            isOnline ? "bg-emerald-500" : "bg-wt-text-faint/55"
          )}
          title={isOnline ? "Online" : "Offline"}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight text-wt-text">
          {displayName}
        </span>
        {empId && empId !== "—" ? (
          <span className="mt-0.5 block truncate text-[11px] font-medium text-wt-text-faint">
            {empId}
          </span>
        ) : null}
      </span>
    </div>
  );
}
