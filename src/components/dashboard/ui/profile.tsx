"use client";

import { normalizeApiBaseUrl } from "@/api/httpClient";
import { useState } from "react";

const LOCAL_BACKEND_FALLBACK = "http://localhost:8080";

function resolveProfileAssetBaseUrl(): string {
  return normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.API_BASE_URL ??
      LOCAL_BACKEND_FALLBACK
  );
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

/**
 * Distinct hex gradient pairs so fallback avatars don't all look like the same
 * indigo/violet wash. Picked for readable white initials on both light/dark UIs.
 */
const AVATAR_GRADIENT_STOPS = [
  ["#355095", "#0ea5e9"],
  ["#0d9488", "#2dd4bf"],
  ["#059669", "#34d399"],
  ["#d97706", "#f59e0b"],
  ["#ea580c", "#fb923c"],
  ["#dc2626", "#fb7185"],
  ["#db2777", "#f472b6"],
  ["#7c3aed", "#a78bfa"],
  ["#4f46e5", "#818cf8"],
  ["#0284c7", "#38bdf8"],
  ["#0f766e", "#14b8a6"],
  ["#b45309", "#fbbf24"],
  ["#be123c", "#f43f5e"],
  ["#6d28d9", "#c084fc"],
  ["#1d4ed8", "#60a5fa"],
  ["#047857", "#6ee7b7"],
  ["#9333ea", "#e879f9"],
  ["#0891b2", "#67e8f9"],
  ["#c2410c", "#fdba74"],
  ["#4338ca", "#a5b4fc"],
] as const;

/** First letter of first name + first letter of last name (e.g. "Sanketh" → "S"). */
export function avatarInitials(displayName: string): string {
  const parts = String(displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = (parts[0].charAt(0) || "").toUpperCase();
  const last = parts.length > 1 ? (parts[parts.length - 1].charAt(0) || "").toUpperCase() : "";
  return first + last || "?";
}

function hashAvatarSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministic multi-color gradient for a person (inline style — Tailwind
 * arbitrary gradients with CSS vars often fail to emit). Pass empId/email as
 * `seedExtra` when available so similarly named people still diverge.
 */
export function avatarGradientStyle(
  displayName: string,
  seedExtra = ""
): { backgroundImage: string; backgroundColor: string } {
  const seed = `${String(displayName ?? "").trim().toLowerCase()}|${String(seedExtra ?? "").trim().toLowerCase()}`;
  const hash = hashAvatarSeed(seed || "employee");
  const [from, to] = AVATAR_GRADIENT_STOPS[hash % AVATAR_GRADIENT_STOPS.length];
  const angle = 120 + (hash % 60);
  return {
    backgroundColor: from,
    backgroundImage: `linear-gradient(${angle}deg, ${from}, ${to})`,
  };
}

/** @deprecated Prefer avatarGradientStyle — class-based gradients with CSS vars are unreliable. */
export function avatarGradientClass(_displayName: string): string {
  return "bg-[var(--wt-brand)]";
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

function formatSkillRatingEntry(item: unknown): string {
  if (item && typeof item === "object") {
    const rec = item as Record<string, unknown>;
    const skill = String(rec.skill ?? rec.name ?? "").trim();
    if (!skill) return "";
    const selfRating = rec.self_rating ?? rec.selfRating ?? rec.rating ?? rec.level;
    const webknotRating = rec.webknot_rating ?? rec.webknotRating;
    if (webknotRating !== undefined && webknotRating !== null && String(webknotRating).trim() !== "") {
      return `${skill} (Self: ${selfRating}/5, WK: ${webknotRating}/5)`;
    }
    if (selfRating !== undefined && String(selfRating).trim() !== "") {
      return `${skill} (Self: ${selfRating}/5)`;
    }
    return skill;
  }
  return String(item ?? "").trim();
}

export function formatSecondarySkillsForProfile(profile: Record<string, unknown> | null | undefined): string {
  if (!profile) return "—";
  const raw =
    profile.secondary_skills ?? profile.secondarySkills ?? profile.secondary_skill;
  if (Array.isArray(raw)) {
    const parts = raw.map(formatSkillRatingEntry).filter(Boolean);
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
  const gradientSeed = String(
    profile?.emp_id ??
      profile?.empId ??
      profile?.email ??
      profile?.work_email ??
      profile?.workEmail ??
      ""
  ).trim();
  const sizeClass =
    size === "xs" ? "h-6 w-6" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textClass =
    size === "xs" ? "text-[10px]" : size === "sm" ? "text-xs" : "text-sm";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 shadow-sm ring-1 ring-black/10 ${showFallback ? "" : "bg-wt-surface-2"} ${className}`.trim()}
      style={showFallback ? avatarGradientStyle(displayName, gradientSeed) : undefined}
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
        <span className={`${textClass} font-semibold text-white drop-shadow-sm`}>
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
  const gradientSeed = String(
    profile?.emp_id ??
      profile?.empId ??
      profile?.email ??
      profile?.work_email ??
      profile?.workEmail ??
      ""
  ).trim();

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`h-28 w-28 shrink-0 overflow-hidden rounded-full border border-white/25 shadow-md ring-1 ring-black/10 ${showFallback ? "" : "bg-wt-surface-2"} flex items-center justify-center`}
        style={showFallback ? avatarGradientStyle(displayName, gradientSeed) : undefined}
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
          <span className="text-3xl font-semibold text-white drop-shadow-sm">{avatarInitials(displayName)}</span>
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
