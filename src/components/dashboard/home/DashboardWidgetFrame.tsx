"use client";

import { useState, type ReactNode } from "react";
import { EyeOff, GripVertical, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetSize } from "@/hooks/dashboard/useHomeDashboardLayout";

export function DashboardWidgetFrame({
  id,
  size,
  editing,
  draggedId,
  onDragStart,
  onDrop,
  onDragEnd,
  onToggleSize,
  onHide,
  children,
}: {
  id: string;
  size: WidgetSize;
  editing: boolean;
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  onToggleSize: (id: string) => void;
  onHide: (id: string) => void;
  children: ReactNode;
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const isDragging = draggedId === id;

  return (
    <div
      className={cn(
        size === "wide" && "sm:col-span-2",
        editing && "relative rounded-2xl outline outline-2 outline-transparent transition-[outline-color]",
        editing && isDropTarget && draggedId && draggedId !== id && "outline-[var(--wt-brand)]",
        isDragging && "opacity-40"
      )}
      draggable={editing}
      onDragStart={(e) => {
        if (!editing) return;
        e.dataTransfer.effectAllowed = "move";
        onDragStart(id);
      }}
      onDragOver={(e) => {
        if (!editing || !draggedId) return;
        // preventDefault is required to allow a drop here; the actual
        // reordering only happens once, on drop — not on every dragover
        // tick, which fires continuously while hovering and would otherwise
        // cause the dragged widget to ping-pong back and forth.
        e.preventDefault();
        if (!isDropTarget) setIsDropTarget(true);
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(e) => {
        if (!editing) return;
        e.preventDefault();
        setIsDropTarget(false);
        onDrop(id);
      }}
      onDragEnd={() => {
        setIsDropTarget(false);
        onDragEnd();
      }}
    >
      {editing ? (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg border border-wt-border bg-wt-surface-1 p-1 shadow-sm">
          <span
            className="flex size-6 cursor-grab items-center justify-center text-wt-text-muted active:cursor-grabbing"
            aria-hidden
          >
            <GripVertical className="size-3.5" />
          </span>
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded-md text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text"
            onClick={() => onToggleSize(id)}
            aria-label={size === "wide" ? "Shrink widget" : "Widen widget"}
            title={size === "wide" ? "Shrink" : "Widen"}
          >
            {size === "wide" ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded-md text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text"
            onClick={() => onHide(id)}
            aria-label="Hide widget"
            title="Hide"
          >
            <EyeOff className="size-3.5" />
          </button>
        </div>
      ) : null}
      <div className={cn(editing && "pointer-events-none select-none")}>{children}</div>
    </div>
  );
}
