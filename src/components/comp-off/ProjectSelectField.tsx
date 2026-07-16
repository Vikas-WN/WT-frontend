"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FieldLabel } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FORM_FIELD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import type { CompOffProjectOption } from "@/utils/compOffProjects";

export function ProjectSelectField({
  label,
  value,
  options,
  onChange,
  onAddProject,
  disabled,
  required = false,
  placeholder = "Search or add project",
  addProjectLabel,
  selectOnAdd = true,
  className,
}: {
  label: string;
  value: string;
  options: CompOffProjectOption[];
  onChange: (projectCode: string) => void;
  /** Called when the user adds a project that is not in the list. */
  onAddProject?: (projectName: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  addProjectLabel?: (projectName: string) => string;
  /** When false, onAddProject runs without selecting the typed value (e.g. navigate away). */
  selectOnAdd?: boolean;
  className?: string;
}) {
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => options.find((opt) => opt.code === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery(selected?.label ?? value);
    }
  }, [selected, value, isOpen]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const trimmedQuery = query.trim();
  const filteredOptions = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.code.toLowerCase().includes(q) ||
        opt.name.toLowerCase().includes(q)
    );
  }, [options, trimmedQuery]);

  const hasExactMatch = useMemo(
    () =>
      Boolean(trimmedQuery) &&
      options.some(
        (opt) =>
          opt.label.toLowerCase() === trimmedQuery.toLowerCase() ||
          opt.code.toLowerCase() === trimmedQuery.toLowerCase() ||
          opt.name.toLowerCase() === trimmedQuery.toLowerCase()
      ),
    [options, trimmedQuery]
  );

  const showAddOption = Boolean(trimmedQuery) && !hasExactMatch && !disabled;

  function selectProject(projectCode: string, displayLabel?: string) {
    onChange(projectCode);
    setQuery(displayLabel ?? projectCode);
    setIsOpen(false);
  }

  function handleAddProject() {
    if (!trimmedQuery || hasExactMatch) return;
    const existing = options.find(
      (opt) =>
        opt.label.toLowerCase() === trimmedQuery.toLowerCase() ||
        opt.code.toLowerCase() === trimmedQuery.toLowerCase() ||
        opt.name.toLowerCase() === trimmedQuery.toLowerCase()
    );
    if (existing) {
      selectProject(existing.code, existing.label);
      return;
    }
    onAddProject?.(trimmedQuery);
    if (selectOnAdd) {
      selectProject(trimmedQuery, trimmedQuery);
    } else {
      setIsOpen(false);
    }
  }

  return (
    <Field className={cn(FORM_FIELD_CLASS, className)}>
      <FieldLabel label={label} required={required} htmlFor={inputId} />
      <div ref={rootRef} className="relative">
        <Input
          id={inputId}
          type="text"
          value={query}
          disabled={disabled}
          required={required}
          aria-required={required || undefined}
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (showAddOption) {
                handleAddProject();
                return;
              }
              const first = filteredOptions[0];
              if (first) selectProject(first.code, first.label);
            }
            if (e.key === "Escape") setIsOpen(false);
          }}
        />
        {isOpen && !disabled ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-wt-border bg-wt-surface-1 py-1 text-sm shadow-lg"
          >
            {filteredOptions.length === 0 && !showAddOption ? (
              <li className="px-3 py-2 text-wt-text-muted">
                {trimmedQuery ? "No matches" : "Type to search or add a project"}
              </li>
            ) : null}
            {filteredOptions.map((opt) => (
              <li key={opt.code}>
                <Button
                  type="button"
                  role="option"
                  variant="ghost"
                  aria-selected={value === opt.code}
                  className={cn(
                    "block h-auto w-full justify-start rounded-none px-3 py-2 font-normal hover:bg-wt-surface-2",
                    value === opt.code ? "bg-wt-surface-2 font-medium" : ""
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectProject(opt.code, opt.label)}
                >
                  {opt.label}
                </Button>
              </li>
            ))}
            {showAddOption ? (
              <li className="border-t border-wt-border">
                <Button
                  type="button"
                  variant="ghost"
                  className="block h-auto w-full justify-start rounded-none px-3 py-2 text-[var(--wt-brand)] hover:bg-[var(--wt-brand-soft)]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleAddProject}
                >
                  {addProjectLabel?.(trimmedQuery) ??
                    `Add "${trimmedQuery}" as project`}
                </Button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}
