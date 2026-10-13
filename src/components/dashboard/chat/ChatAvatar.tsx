"use client";

import { Hash, Lock } from "lucide-react";
import { useState } from "react";

import { endpoints } from "@/api/endpoints";
import { cn } from "@/lib/utils";
import { avatarTone, initialsOf } from "@/utils/chatDisplay";

interface Props {
  name: string;
  channel?: boolean;
  isPrivate?: boolean;
  size?: "sm" | "md";
  /** When given (with `hasPhoto`), the person's profile photo is shown instead of their initials. */
  userId?: number | null;
  hasPhoto?: boolean;
}

/** A person's profile photo, or their initials in a colour that is always theirs, or a # / lock for a channel. */
export function ChatAvatar({ name, channel, isPrivate, size = "md", userId, hasPhoto }: Props) {
  // UI state: the photo failed to load, so fall back to initials.
  const [failed, setFailed] = useState(false);
  const box = size === "sm" ? "size-8 text-[11px]" : "size-10 text-sm";
  if (channel) {
    const Icon = isPrivate ? Lock : Hash;
    return (
      <span className={cn("grid shrink-0 place-items-center rounded-xl bg-wt-surface-3 text-wt-text-muted", box)} aria-hidden>
        <Icon className={size === "sm" ? "size-4" : "size-[18px]"} />
      </span>
    );
  }
  if (hasPhoto && userId && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- an authenticated same-origin photo; next/image would re-fetch it without the session
      <img
        src={endpoints.chat.personPhoto(userId)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        // Inline size: a global `img { height: auto }` rule outranks utility classes and squashes the photo into a pill.
        style={{ width: size === "sm" ? 32 : 40, height: size === "sm" ? 32 : 40 }}
        className={cn("shrink-0 rounded-full object-cover", box)}
      />
    );
  }
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full font-semibold", avatarTone(name), box)} aria-hidden>
      {initialsOf(name)}
    </span>
  );
}
