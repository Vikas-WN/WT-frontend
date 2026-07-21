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
};

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
}: SkillsMultiSelectFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
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
    if (open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      });
    }
  }, [open]);

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

  return (
    <div className={cn(FORM_FIELD_CLASS, className)} ref={rootRef}>
      <FieldLabel label={label} required={required} />
      <div className="relative">
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
                className="rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
              >
                <div className="flex items-center gap-2 border-b border-border px-3">
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
                <div className="max-h-52 overflow-y-auto p-1">
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
