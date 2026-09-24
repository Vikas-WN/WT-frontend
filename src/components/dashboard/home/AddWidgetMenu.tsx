"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";

export function AddWidgetMenu({
  hiddenWidgets,
  onShow,
}: {
  hiddenWidgets: Array<{ id: string; title: string }>;
  onShow: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={buttonVariants({ variant: "outline", size: "sm" })}
        disabled={hiddenWidgets.length === 0}
      >
        <Plus className="size-4" /> Add widget
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner side="bottom" align="end" sideOffset={8} className="z-[280]">
          <PopoverContent className="w-56 p-1.5">
            {hiddenWidgets.length === 0 ? (
              <p className="px-2.5 py-2 text-xs text-wt-text-muted">All widgets are shown.</p>
            ) : (
              <ul className="space-y-0.5">
                {hiddenWidgets.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-wt-text hover:bg-wt-surface-2"
                      onClick={() => {
                        onShow(w.id);
                        setOpen(false);
                      }}
                    >
                      {w.title}
                      <Plus className="size-3.5 text-wt-text-muted" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
