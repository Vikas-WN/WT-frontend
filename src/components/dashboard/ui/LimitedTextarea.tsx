"use client";

import { useId, useState, type ClipboardEvent } from "react";

import { Textarea } from "@/components/ui/textarea";
import { REASON_COPY, REASON_WARN_FRACTION } from "@/constants/requestReason";
import { cn } from "@/lib/utils";
import { limitLevel, pasteWouldOverflow } from "@/utils/charLimit";

/**
 * A text box with a limit you can see: a counter underneath that warns as you near it and turns red at it, and a plain
 * message when pasted text had to be cut — the browser would otherwise drop the extra characters without a word.
 */
export function LimitedTextarea({
  id,
  value,
  onChange,
  max,
  placeholder,
  disabled,
  rows = 3,
  className,
  hint,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  /** Short helper text under the box; defaults to "Keep it brief — up to N characters." */
  hint?: string;
}) {
  const generatedId = useId();
  const noteId = `${id ?? generatedId}-note`;
  // UI state: set when the last paste was longer than the box allows, cleared as soon as the person types again.
  const [pasteCut, setPasteCut] = useState(false);
  const level = limitLevel(value.length, max, REASON_WARN_FRACTION);

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const box = event.currentTarget;
    setPasteCut(pasteWouldOverflow(value, box.selectionEnd - box.selectionStart, event.clipboardData.getData("text"), max));
  }

  const message = pasteCut ? REASON_COPY.pasteTrimmed(max) : level === "limit" ? REASON_COPY.atLimit(max) : level === "near" ? REASON_COPY.nearLimit(max - value.length) : (hint ?? REASON_COPY.hint(max));
  const warn = pasteCut || level !== "ok";

  return (
    <div>
      <Textarea
        id={id}
        className={cn("min-h-[88px] resize-y", className)}
        value={value}
        disabled={disabled}
        maxLength={max}
        placeholder={placeholder}
        rows={rows}
        aria-describedby={noteId}
        onPaste={onPaste}
        onChange={(event) => {
          setPasteCut(false);
          onChange(event.target.value);
        }}
      />
      <div className="mt-1.5 flex items-start justify-between gap-3 text-xs">
        <p id={noteId} aria-live="polite" className={cn(warn ? (level === "limit" || pasteCut ? "font-medium text-rose-600 dark:text-rose-400" : "font-medium text-amber-700 dark:text-amber-400") : "text-wt-text-muted")}>
          {message}
        </p>
        <span className={cn("shrink-0 tabular-nums", level === "limit" ? "font-semibold text-rose-600 dark:text-rose-400" : level === "near" ? "font-semibold text-amber-700 dark:text-amber-400" : "text-wt-text-muted")}>
          {REASON_COPY.counter(value.length, max)}
        </span>
      </div>
    </div>
  );
}
