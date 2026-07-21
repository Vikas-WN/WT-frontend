"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DROP_ZONE_LABELS, validateResume } from "@/components/dashboard/referral/resume-drop-zone/resume-drop-zone.constants";
import type { ResumeDropZoneProps } from "@/components/dashboard/referral/resume-drop-zone/resume-drop-zone.types";
import "./resume-drop-zone.css";

export function ResumeDropZone({ file, onPick }: ResumeDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryPick = useCallback(
    (f: File | null) => {
      setError(null);
      if (!f) { onPick(null); return; }
      const err = validateResume(f);
      if (err) { setError(err); onPick(null); return; }
      onPick(f);
    },
    [onPick],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      tryPick(e.dataTransfer.files[0] ?? null);
    },
    [tryPick],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      tryPick(e.target.files?.[0] ?? null);
    },
    [tryPick],
  );

  const zoneClass = error
    ? "drop-zone--error"
    : file
      ? "drop-zone--file"
      : dragging
        ? "drop-zone--dragging"
        : "drop-zone--empty";

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "drop-zone relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all",
        "duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
        zoneClass,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleChange}
      />

      {file ? (
        <>
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <FileText className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-wt-text">{file.name}</p>
            <p className="mt-0.5 text-xs text-wt-text-muted">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onPick(null); }}
          >
            <X className="size-3.5" />
            {DROP_ZONE_LABELS.remove}
          </Button>
        </>
      ) : (
        <>
          <div className={cn(
            "flex size-12 items-center justify-center rounded-full",
            error ? "bg-destructive/10" : "bg-wt-surface-2",
          )}>
            <Upload className={cn("size-6", error ? "text-destructive" : "text-wt-text-muted")} />
          </div>
          <div>
            <p className="text-sm font-medium text-wt-text">
              {error ? DROP_ZONE_LABELS.tryDifferent : dragging ? DROP_ZONE_LABELS.dropHere : DROP_ZONE_LABELS.upload}
            </p>
            <p className="mt-1 text-xs text-wt-text-muted">
              {error ? "" : DROP_ZONE_LABELS.browse}
            </p>
            <p className="mt-0.5 text-[11px] text-wt-text-faint">
              {DROP_ZONE_LABELS.formats}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
