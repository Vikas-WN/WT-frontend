import { Hash, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { avatarTone, initialsOf } from "@/utils/chatDisplay";

/** A person's initials in a colour that is always theirs, or a # / lock for a channel. */
export function ChatAvatar({ name, channel, isPrivate, size = "md" }: { name: string; channel?: boolean; isPrivate?: boolean; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-8 text-[11px]" : "size-10 text-sm";
  if (channel) {
    const Icon = isPrivate ? Lock : Hash;
    return (
      <span className={cn("grid shrink-0 place-items-center rounded-xl bg-wt-surface-3 text-wt-text-muted", box)} aria-hidden>
        <Icon className={size === "sm" ? "size-4" : "size-[18px]"} />
      </span>
    );
  }
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full font-semibold", avatarTone(name), box)} aria-hidden>
      {initialsOf(name)}
    </span>
  );
}
