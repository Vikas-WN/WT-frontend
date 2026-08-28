"use client";

import { useState } from "react";
import Link from "next/link";
import {
  avatarInitials,
  avatarGradientStyle,
  resolveProfilePhotoSrc,
} from "@/components/dashboard/ui/profile";
import { cn } from "@/lib/utils";
import { employeeDirectoryProfilePath } from "@/constants/routes";

export function DirectoryEmployeeNameCell({
  name,
  empId,
  profile,
  isOnline,
  isBirthday = false,
}: {
  name: string;
  empId?: string;
  profile: Record<string, unknown>;
  isOnline?: boolean;
  isBirthday?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoSrc = resolveProfilePhotoSrc(profile);
  const showFallback = !photoSrc || imageFailed;
  const displayName = name.trim() || "Employee";
  const gradientSeed = String(empId ?? profile.email ?? profile.work_email ?? "").trim();
  const profileHref = empId && empId !== "—" ? employeeDirectoryProfilePath(empId) : null;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="relative shrink-0">
        <span
          className={cn(
            "flex size-9 items-center justify-center overflow-hidden rounded-full border border-white/35 shadow-sm ring-1 ring-black/8",
            isBirthday && "wt-birthday-avatar"
          )}
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
        {isBirthday ? (
          <span className="wt-birthday-badge" title="Birthday today" aria-label="Birthday today">
            <span className="wt-birthday-cake" aria-hidden>
              🎂
            </span>
            <span className="wt-birthday-popper" aria-hidden>
              🎉
            </span>
          </span>
        ) : (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-wt-surface-1",
              isOnline ? "bg-emerald-500" : "bg-wt-text-faint/55"
            )}
            title={isOnline ? "Online" : "Offline"}
            aria-label={isOnline ? "Online" : "Offline"}
          />
        )}
      </span>
      <span className="min-w-0">
        {profileHref ? (
          <Link href={profileHref} className="block">
            <span className="block truncate text-sm font-semibold tracking-tight text-wt-text hover:text-[var(--wt-brand)] transition-colors">
              {displayName}
              {isBirthday ? (
                <span className="ml-1.5 inline-block align-middle text-[11px] font-medium text-amber-600 dark:text-amber-300">
                  Birthday
                </span>
              ) : null}
            </span>
            {empId && empId !== "—" ? (
              <span className="mt-0.5 block truncate text-[11px] font-medium text-wt-text-faint">
                {empId}
              </span>
            ) : null}
          </Link>
        ) : (
          <>
            <span className="block truncate text-sm font-semibold tracking-tight text-wt-text">
              {displayName}
              {isBirthday ? (
                <span className="ml-1.5 inline-block align-middle text-[11px] font-medium text-amber-600 dark:text-amber-300">
                  Birthday
                </span>
              ) : null}
            </span>
            {empId && empId !== "—" ? (
              <span className="mt-0.5 block truncate text-[11px] font-medium text-wt-text-faint">
                {empId}
              </span>
            ) : null}
          </>
        )}
      </span>
    </div>
  );
}
