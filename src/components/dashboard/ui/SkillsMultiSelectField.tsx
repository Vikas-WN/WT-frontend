"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FieldLabel } from "@/components/dashboard/ui/forms";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { FORM_FIELD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SkillSelectOption = { value: string; label: string };

type SkillsMultiSelectFieldProps = {
  label: string;
  value: string[];
  options: SkillSelectOption[];
  onChange: (skills: string[]) => void;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  placeholder?: string;
  className?: string;
  /** Cap dropdown panel width (px). Defaults to trigger width, max 320px. */
  dropdownMaxWidth?: number;
};

const DROPDOWN_MAX_HEIGHT = 240;
const DROPDOWN_GAP = 6;
const VIEWPORT_MARGIN = 8;
const SEARCH_HEADER_HEIGHT = 40;

export function SkillsMultiSelectField({
  label,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
  loading = false,
  loadingLabel = "Loading skills…",
  placeholder,
  className,
  dropdownMaxWidth = 320,
}: SkillsMultiSelectFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerWrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedSet = useMemo(
    () => new Set(value.map((skill) => skill.trim()).filter(Boolean)),
    [value]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerWrapRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - DROPDOWN_GAP - VIEWPORT_MARGIN);
      const spaceAbove = Math.max(0, rect.top - DROPDOWN_GAP - VIEWPORT_MARGIN);
      const openUpward = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;
      const available = openUpward ? spaceAbove : spaceBelow;
      const maxHeight = Math.min(DROPDOWN_MAX_HEIGHT, Math.max(available, 1));
      const width = Math.min(Math.max(rect.width, 180), dropdownMaxWidth);
      const left = Math.min(
        Math.max(VIEWPORT_MARGIN, rect.left),
        Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN)
      );

      setDropdownStyle({
        position: "fixed",
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        zIndex: 9999,
        ...(openUpward
          ? { bottom: `${window.innerHeight - rect.top + DROPDOWN_GAP}px`, top: "auto" }
          : { top: `${rect.bottom + DROPDOWN_GAP}px`, bottom: "auto" }),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, dropdownMaxWidth, value.length, filteredOptions.length]);

  const toggleSkill = (skill: string, checked: boolean) => {
    const normalized = skill.trim();
    if (!normalized) return;
    const next = new Set(selectedSet);
    if (checked) next.add(normalized);
    else next.delete(normalized);
    onChange(options.map((option) => option.value).filter((item) => next.has(item)));
  };

  const triggerLabel = loading
    ? loadingLabel
    : value.length
      ? `${value.length} selected`
      : placeholder ?? `Select ${label.toLowerCase()}…`;

  const listMaxHeight = Math.max(
    72,
    (typeof dropdownStyle.maxHeight === "string"
      ? Number.parseFloat(dropdownStyle.maxHeight)
      : DROPDOWN_MAX_HEIGHT) - SEARCH_HEADER_HEIGHT
  );

  return (
    <div className={cn(FORM_FIELD_CLASS, className)} ref={rootRef}>
      <FieldLabel label={label} required={required} />
      <div className="relative" ref={triggerWrapRef}>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={required || undefined}
          disabled={disabled || loading || !options.length}
          onClick={() => setOpen((current) => !current)}
          className="h-10 w-full justify-between px-3 text-sm font-normal text-muted-foreground"
        >
          <span className={value.length ? "text-foreground" : ""}>{triggerLabel}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>

        {open
          ? createPortal(
              <div
                ref={dropdownRef}
                style={dropdownStyle}
                className="flex flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
              >
                <div className="flex shrink-0 items-center gap-2 border-b border-border px-3">
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder={`Search ${label.toLowerCase()}…`}
                    value={query}
                    disabled={disabled}
                    autoComplete="off"
                    autoFocus
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1"
                  style={{ maxHeight: `${listMaxHeight}px` }}
                >
                  {filteredOptions.length ? (
                    filteredOptions.map((option) => {
                      const checked = selectedSet.has(option.value);
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
                            onChange={() => toggleSkill(option.value, !checked)}
                          />
                          <span className="flex-1 min-w-0 truncate">{option.label}</span>
                          {checked ? <Check className="size-4 shrink-0 text-primary" /> : null}
                        </label>
                      );
                    })
                  ) : (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No skills match your search.
                    </p>
                  )}
                </div>
              </div>,
              document.body
            )
          : null}
      </div>

      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <span
              key={skill}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${filledBadgeClass("neutral")}`}
            >
              <span className="max-w-[220px] truncate">{skill}</span>
              <button
                type="button"
                disabled={disabled || loading}
                onClick={() => toggleSkill(skill, false)}
                className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={`Remove ${skill}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
