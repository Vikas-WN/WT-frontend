"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { useOnboardOptions } from "@/hooks/useOnboardOptions";
import type { OnboardOptionItem } from "@/types/onboard-options";
import {
  formatReportingManagerNames,
  nameFromOnboardOptionLabel,
  parseReportingManagerNames,
} from "@/utils/exitInterviewManagers";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

function matchesQuery(option: OnboardOptionItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const label = option.label.toLowerCase();
  const name = nameFromOnboardOptionLabel(option.label).toLowerCase();
  return label.includes(q) || name.includes(q);
}

export function ExitInterviewReportingManagersSelector({
  value,
  onChange,
  disabled = false,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const optionsQ = useOnboardOptions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = optionsQ.data?.reporting_managers ?? [];
  const selectedNames = useMemo(() => parseReportingManagerNames(value), [value]);

  const selectedNameSet = useMemo(
    () => new Set(selectedNames.map((name) => name.toLowerCase())),
    [selectedNames]
  );

  const filteredOptions = useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query]
  );

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const toggleName = (name: string, checked: boolean) => {
    const normalized = name.trim();
    if (!normalized) return;
    const next = new Set(selectedNameSet);
    const key = normalized.toLowerCase();
    if (checked) next.add(key);
    else next.delete(key);

    const ordered = selectedNames.filter((item) => next.has(item.toLowerCase()));
    for (const option of options) {
      const optionName = nameFromOnboardOptionLabel(option.label);
      const optionKey = optionName.toLowerCase();
      if (next.has(optionKey) && !ordered.some((item) => item.toLowerCase() === optionKey)) {
        ordered.push(optionName);
      }
    }
    onChange(formatReportingManagerNames(ordered));
  };

  const removeName = (name: string) => {
    toggleName(name, false);
  };

  const triggerLabel = selectedNames.length
    ? `${selectedNames.length} manager${selectedNames.length > 1 ? "s" : ""} selected`
    : "Search and select managers…";

  if (optionsQ.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (optionsQ.isError && !options.length) {
    return (
      <p className="text-sm text-rose-600">
        Could not load employees. Try refreshing the page.
      </p>
    );
  }

  return (
    <div className="space-y-2" ref={rootRef}>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={required || undefined}
          disabled={disabled || !options.length}
          onClick={() => setOpen((current) => !current)}
          className="h-10 w-full justify-between px-3 text-sm font-normal text-muted-foreground"
        >
          <span className={selectedNames.length ? "text-foreground" : ""}>{triggerLabel}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>

        {open ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search employees by name or email…"
                value={query}
                disabled={disabled}
                autoComplete="off"
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {filteredOptions.length ? (
                filteredOptions.map((option) => {
                  const name = nameFromOnboardOptionLabel(option.label);
                  const checked = selectedNameSet.has(name.toLowerCase());
                  return (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="size-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleName(name, !checked)}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium block truncate">{name}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {option.label.includes("(")
                            ? option.label.slice(option.label.indexOf("(") + 1, -1)
                            : option.label}
                        </span>
                      </span>
                      {checked ? <Check className="size-4 shrink-0 text-primary" /> : null}
                    </label>
                  );
                })
              ) : (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No employees match your search.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {selectedNames.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedNames.map((name) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${filledBadgeClass("neutral")}`}
            >
              <span className="max-w-[220px] truncate">{name}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeName(name)}
                className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={`Remove ${name}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {!options.length ? (
        <p className="text-xs text-wt-text-muted">No employees available to select.</p>
      ) : null}
    </div>
  );
}
