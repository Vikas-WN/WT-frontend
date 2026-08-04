"use client";

import { normalizeApiBaseUrl } from "@/api/httpClient";
import { useState } from "react";

const LOCAL_BACKEND_FALLBACK = "http://localhost:8080";

function resolveProfileAssetBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return normalizeApiBaseUrl(process.env.API_BASE_URL ?? LOCAL_BACKEND_FALLBACK);
}
import { formatUILabel } from "@/utils/titleCase";
import { formatUiStatusLabel, normalizeStatusKey } from "@/utils/statusLabel";
import { formatEmployeeStatusLabel, normalizeEmployeeStatusKey } from "@/utils/userStatus";

export function resolveProfilePhotoSrc(profile: Record<string, unknown> | null | undefined): string | null {
  if (!profile) return null;
  const raw = String(
    profile.profile_photo_url ??
      profile.profilePhotoUrl ??
      profile.profile_pic_url ??
      profile.profilePicUrl ??
      profile.photo_url ??
      profile.photoUrl ??
      profile.avatar_url ??
      profile.avatarUrl ??
      profile.image_url ??
      profile.imageUrl ??
      profile.profile_photo ??
      profile.profilePhoto ??
      ""
  ).trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw;
  }
  const base = resolveProfileAssetBaseUrl();
  if (raw.startsWith("local://uploads/")) {
    const filename = raw.slice("local://uploads/".length);
    return `${base}/api/v1/profile/photo/${encodeURIComponent(filename)}`;
  }
  return raw.startsWith("/") ? `${base}${raw}` : `${base}/${raw}`;
}

/** Indigo/violet gradient pairs using theme tokens — cohesive with the app brand. */
const AVATAR_GRADIENT_STOPS = [
  "var(--wt-indigo-500),var(--wt-violet-500)",
  "var(--wt-indigo-600),var(--wt-violet-400)",
  "var(--wt-brand),var(--wt-indigo-500)",
  "var(--wt-violet-500),var(--wt-indigo-400)",
  "var(--wt-indigo-700),var(--wt-indigo-400)",
  "var(--wt-indigo-400),var(--wt-violet-500)",
] as const;

/** First letter of first name + first letter of last name (e.g. "Sanketh" → "S"). */
export function avatarInitials(displayName: string): string {
  const parts = String(displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = (parts[0].charAt(0) || "").toUpperCase();
  const last = parts.length > 1 ? (parts[parts.length - 1].charAt(0) || "").toUpperCase() : "";
  return first + last || "?";
}

/** Deterministic gradient class for a name, so each person keeps a stable, varied color. */
export function avatarGradientClass(displayName: string): string {
  const seed = String(displayName ?? "").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const stops = AVATAR_GRADIENT_STOPS[hash % AVATAR_GRADIENT_STOPS.length];
  return `bg-[linear-gradient(135deg,${stops})]`;
}

export function readProfileField(
  profile: Record<string, unknown> | null | undefined,
  snakeKey: string,
  camelKey?: string
): string {
  if (!profile) return "";
  const camel = camelKey ?? snakeKey.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  const value = profile[snakeKey] ?? profile[camel];
  if (value === null || value === undefined || value === "") return "";
  return String(value).trim();
}

export function formatSecondarySkillsForProfile(profile: Record<string, unknown> | null | undefined): string {
  if (!profile) return "—";
  const raw =
    profile.secondary_skills ?? profile.secondarySkills ?? profile.secondary_skill;
  if (Array.isArray(raw)) {
    const parts = raw
      .map((item) => {
        if (item && typeof item === "object") {
          const rec = item as Record<string, unknown>;
          const skill = String(rec.skill ?? rec.name ?? "").trim();
          const rating = rec.rating ?? rec.level;
          if (!skill) return "";
          return rating !== undefined && String(rating).trim() !== ""
            ? `${skill} (${String(rating)}/5)`
            : skill;
        }
        return String(item ?? "").trim();
      })
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }
  const single = String(raw ?? "").trim();
  return single || "—";
}

async function downloadImage(src: string, filename: string) {
  const response = await fetch(src, { credentials: "include" });
  if (!response.ok) throw new Error("Unable to download profile image");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function UserAvatar({
  profile,
  fallbackName,
  size = "sm",
  className = "",
}: {
  profile: Record<string, unknown> | null | undefined;
  fallbackName?: string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = resolveProfilePhotoSrc(profile);
  const displayName = String(profile?.name ?? fallbackName ?? "User").trim();
  const showFallback = !src || imageFailed;
  const sizeClass =
    size === "xs" ? "h-6 w-6" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textClass =
    size === "xs" ? "text-[10px]" : size === "sm" ? "text-xs" : "text-sm";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-wt-border ${showFallback ? avatarGradientClass(displayName) : "bg-wt-surface-2"} ${className}`.trim()}
      aria-hidden
    >
      {src && !imageFailed ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={`${textClass} font-semibold text-white`}>
          {avatarInitials(displayName)}
        </span>
      )}
    </div>
  );
}

export function ProfilePhotoAvatar({
  profile,
  fallbackName,
}: {
  profile: Record<string, unknown> | null | undefined;
  fallbackName?: string | null;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = resolveProfilePhotoSrc(profile);
  const displayName = String(profile?.name ?? fallbackName ?? "User").trim();
  const showFallback = !src || imageFailed;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`h-28 w-28 shrink-0 overflow-hidden rounded-full border border-wt-border ${showFallback ? avatarGradientClass(displayName) : "bg-wt-surface-2"} flex items-center justify-center`}
        aria-hidden={!src || imageFailed}
      >
        {src && !imageFailed ? (
          <img
            src={src}
            alt={`${displayName} profile photo`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-3xl font-semibold text-white">{avatarInitials(displayName)}</span>
        )}
      </div>

      {src && !imageFailed ? (
        <button
          type="button"
          className="btn-secondary text-xs px-3 py-1.5"
          onClick={() => void downloadImage(src, `${displayName.replace(/\s+/g, "_")}.jpg`)}
        >
          Download
        </button>
      ) : null}
    </div>
  );
}

function formatProfileFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "—";
  }
  if (Array.isArray(value)) {
    const parts = value.map((item) => String(item ?? "").trim()).filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }
  return String(value);
}

export function ProfileField({
  label,
  value,
  fullWidth = false,
  link = false,
}: {
  label: string;
  value: unknown;
  fullWidth?: boolean;
  link?: boolean;
}) {
  const labelKey = formatUILabel(label).toLowerCase();
  let formatted = formatProfileFieldValue(value);
  if (labelKey === "status" && formatted !== "—") {
    formatted = normalizeEmployeeStatusKey(formatted)
      ? formatEmployeeStatusLabel(formatted)
      : formatUiStatusLabel(normalizeStatusKey(formatted) || formatted);
  }
  const href = link && formatted !== "—" ? formatted : null;
  const spanClass = fullWidth ? "sm:col-span-2" : "";

  return (
    <div className={`flex items-baseline gap-x-4 gap-y-1 text-sm ${fullWidth ? "w-full" : ""} ${spanClass}`}>
      <dt className="w-40 shrink-0 text-wt-text-muted">{formatUILabel(label)}</dt>
      <dd className="min-w-0 flex-1 font-medium text-wt-text break-words">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--wt-brand)] hover:underline"
          >
            {formatted}
          </a>
        ) : (
          formatted
        )}
      </dd>
    </div>
  );
}
