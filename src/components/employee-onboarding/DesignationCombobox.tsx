"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ApiError } from "@/api/error";
import { hrmsService } from "@/services/hrms.service";
import type { Designation } from "@/types/masters";
import { parseDesignation, parseDesignationList } from "@/utils/masters";
import { FieldLabel } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  MAX_DESIGNATION_LENGTH,
  designationLengthError,
} from "@/utils/dashboard/validation";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

const SEARCH_DEBOUNCE_MS = 300;

export function DesignationCombobox({
  bandId,
  department,
  value,
  onChange,
  disabled = false,
  required = false,
  canCreate = false,
  error,
  onError,
  onCreated,
}: {
  bandId: number;
  department: string;
  value: string;
  onChange: (designationName: string) => void;
  disabled?: boolean;
  required?: boolean;
  canCreate?: boolean;
  /** External validation message (e.g. "Designation is required.") shown below the field. */
  error?: string | null;
  onError?: (message: string) => void;
  /** Fired after a designation is resolved via the "add new" flow (freshly created, or matched to an existing row on a 400). */
  onCreated?: (designation: Designation) => void;
}) {
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<Designation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lengthError, setLengthError] = useState<string | null>(null);

  const prerequisitesMet = bandId > 0 && Boolean(department.trim());
  const isDisabled = disabled || !prerequisitesMet;

  useEffect(() => {
    setQuery(value);
    setLengthError(designationLengthError(value));
  }, [value]);

  useEffect(() => {
    if (!prerequisitesMet) {
      setOptions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void (async () => {
        setIsSearching(true);
        try {
          const res = await hrmsService.searchDesignations({
            band_id: bandId,
            department: department.trim(),
            search: query.trim() || undefined,
          });
          setOptions(parseDesignationList(res));
        } catch (error) {
          setOptions([]);
          const message =
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Could not load designations.";
          onError?.(message);
        } finally {
          setIsSearching(false);
        }
      })();
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [bandId, department, query, prerequisitesMet, onError]);

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
  /** Only match API results — not the free-typed `value` (always equals `query` while typing). */
  const hasExactMatchInList = useMemo(
    () =>
      Boolean(trimmedQuery) &&
      options.some((item) => item.name.toLowerCase() === trimmedQuery.toLowerCase()),
    [options, trimmedQuery]
  );

  const showAddOption =
    canCreate &&
    Boolean(trimmedQuery) &&
    !hasExactMatchInList &&
    !isSearching &&
    prerequisitesMet;

  const selectDesignation = useCallback(
    (name: string) => {
      const error = designationLengthError(name);
      if (error) {
        setLengthError(error);
        onError?.(error);
        return;
      }
      setLengthError(null);
      onChange(name);
      setQuery(name);
      setIsOpen(false);
    },
    [onChange, onError]
  );

  const handleCreate = async () => {
    if (!trimmedQuery || !prerequisitesMet) return;
    const error = designationLengthError(trimmedQuery);
    if (error) {
      setLengthError(error);
      onError?.(error);
      return;
    }
    setIsCreating(true);
    try {
      const res = await hrmsService.createDesignation({
        band_id: bandId,
        department: department.trim(),
        name: trimmedQuery,
      });
      const created = parseDesignation(res);
      if (!created?.name) {
        throw new Error("Designation was created but the response was invalid.");
      }
      selectDesignation(created.name);
      setOptions((prev) => {
        if (prev.some((p) => p.id === created.id)) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      onCreated?.(created);
    } catch (error) {
      const message = toUserFriendlyApiErrorMessage(
        error,
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not create designation."
      );
      if (error instanceof ApiError && error.status === 400) {
        try {
          const res = await hrmsService.searchDesignations({
            band_id: bandId,
            department: department.trim(),
            search: trimmedQuery,
          });
          const refreshed = parseDesignationList(res);
          setOptions(refreshed);
          const hit = refreshed.find(
            (item) => item.name.toLowerCase() === trimmedQuery.toLowerCase()
          );
          if (hit) {
            selectDesignation(hit.name);
            onCreated?.(hit);
            return;
          }
        } catch {
          // fall through to toast
        }
      }
      onError?.(message);
    } finally {
      setIsCreating(false);
    }
  };

  const placeholder = !prerequisitesMet
    ? "Select band and department first"
    : "Search or select designation";

  return (
    <Field className="flex flex-col gap-1.5">
      <FieldLabel label="Designation" required={required} htmlFor={inputId} />
      <div ref={rootRef} className="relative">
        <Input
          id={inputId}
          type="text"
          value={query}
          disabled={isDisabled}
          required={required}
          aria-required={required || undefined}
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          maxLength={MAX_DESIGNATION_LENGTH}
          onFocus={() => {
            if (!isDisabled) setIsOpen(true);
          }}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setLengthError(designationLengthError(next));
            onChange(next);
            setIsOpen(true);
          }}
        />
        {lengthError ? (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {lengthError}
          </p>
        ) : error ? (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {isOpen && !isDisabled ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-wt-border bg-wt-surface-1 py-1 text-sm shadow-lg"
          >
            {isSearching ? (
              <li className="px-3 py-2 text-wt-text-muted">Searching…</li>
            ) : null}
            {!isSearching && options.length === 0 && !showAddOption ? (
              <li className="px-3 py-2 text-wt-text-muted">
                {trimmedQuery ? "No matches" : "Type to search designations"}
              </li>
            ) : null}
            {options.map((item) => (
              <li key={item.id}>
                <Button
                  type="button"
                  role="option"
                  variant="ghost"
                  aria-selected={value === item.name}
                  className={`block h-auto w-full justify-start rounded-none px-3 py-2 font-normal hover:bg-wt-surface-2 ${
                    value === item.name ? "bg-wt-surface-2 font-medium" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectDesignation(item.name)}
                >
                  {item.name}
                </Button>
              </li>
            ))}
            {showAddOption ? (
              <li className="border-t border-wt-border">
                <Button
                  type="button"
                  variant="ghost"
                  className="block h-auto w-full justify-start rounded-none px-3 py-2 text-[var(--wt-brand)] hover:bg-[var(--wt-brand-soft)]"
                  disabled={isCreating}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void handleCreate()}
                >
                  {isCreating ? "Adding…" : `Add "${trimmedQuery}" as new designation`}
                </Button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}
