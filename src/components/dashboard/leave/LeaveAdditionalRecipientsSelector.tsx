"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FieldLabel } from "@/components/ui/field";
import { useEmployeeManagers } from "@/hooks/leave/useEmployeeManagers";
import type { LeaveManagerOption } from "@/services/hrms.service";
import { ChevronsUpDown, X, Check, Search, Loader2 } from "lucide-react";

function optionLabel(option: LeaveManagerOption): string {
  return option.name?.trim() || option.email;
}

function matchesQuery(option: LeaveManagerOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    option.email.toLowerCase().includes(q) ||
    (option.name ?? "").toLowerCase().includes(q) ||
    (option.employee_id ?? "").toLowerCase().includes(q)
  );
}

function SecondaryManagersLabel() {
  return (
    <FieldLabel>
      Secondary Managers
      <span className="text-destructive" aria-hidden>
        *
      </span>
    </FieldLabel>
  );
}

export function LeaveAdditionalRecipientsSelector({
  selectedEmails,
  onChange,
  excludedEmails = [],
  disabled = false,
}: {
  selectedEmails: string[];
  onChange: (emails: string[]) => void;
  excludedEmails?: string[];
  disabled?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  const managersQ = useEmployeeManagers(debouncedQuery, true);
  const options = managersQ.data ?? [];
  const loading = managersQ.isLoading && !managersQ.data;
  const searching = managersQ.isFetching && Boolean(managersQ.data);
  const error =
    managersQ.error instanceof Error ? managersQ.error.message : null;

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedSet = useMemo(
    () => new Set(selectedEmails.map((email) => email.trim().toLowerCase()).filter(Boolean)),
    [selectedEmails]
  );
  const excludedSet = useMemo(
    () => new Set(excludedEmails.map((email) => email.trim().toLowerCase()).filter(Boolean)),
    [excludedEmails]
  );

  const selectedOptions = useMemo(() => {
    const byEmail = new Map(
      options.map((option) => [String(option.email).trim().toLowerCase(), option] as const)
    );
    return selectedEmails
      .map((email) => {
        const opt = byEmail.get(email.trim().toLowerCase());
        return { email: email.trim(), label: opt?.name?.trim() || email.trim() };
      })
      .filter((option) => Boolean(option.email));
  }, [options, selectedEmails]);

  const filteredOptions = useMemo(
    () =>
      options.filter(
        (option) =>
          !excludedSet.has(String(option.email ?? "").trim().toLowerCase()) &&
          matchesQuery(option, query)
      ),
    [excludedSet, options, query]
  );

  const toggleEmail = (email: string, checked: boolean) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || excludedSet.has(normalized)) return;
    const next = new Set(selectedSet);
    if (checked) next.add(normalized);
    else next.delete(normalized);
    const ordered = selectedEmails
      .map((value) => value.trim().toLowerCase())
      .filter((value) => next.has(value));
    for (const value of next) {
      if (!ordered.includes(value)) {
        const match = options.find(
          (row) => String(row.email ?? "").trim().toLowerCase() === value
        );
        ordered.push(String(match?.email ?? value).trim());
      }
    }
    onChange(ordered);
  };

  const removeEmail = (email: string) => {
    toggleEmail(email, false);
  };

  if (error && !options.length) {
    return (
      <div className="space-y-2">
        <SecondaryManagersLabel />
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void managersQ.refetch()}
          className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={rootRef}>
      <SecondaryManagersLabel />

      <div className="relative">
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="flex h-auto min-h-10 w-full items-center gap-1.5 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 disabled:bg-input/50 cursor-pointer"
        >
          <div className="flex flex-1 flex-wrap items-center gap-1">
            {loading && !selectedOptions.length ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Loading Managers…
              </span>
            ) : selectedOptions.length ? (
              selectedOptions.map(({ email, label: optionName }) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="max-w-[160px] truncate pl-2 pr-1 text-xs font-normal gap-1 cursor-default"
                >
                  <span className="truncate">{optionName}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${optionName}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEmail(email);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        removeEmail(email);
                      }
                    }}
                    className="inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">Select Managers…</span>
            )}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>

        {open ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search Managers…"
                value={query}
                disabled={disabled}
                autoComplete="off"
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {loading || (searching && !filteredOptions.length) ? (
                <div className="flex items-center justify-center gap-2 px-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Searching</span>
                </div>
              ) : filteredOptions.length ? (
                filteredOptions.map((option) => {
                  const email = String(option.email ?? "").trim();
                  if (!email) return null;
                  const checked = selectedSet.has(email.toLowerCase());
                  return (
                    <label
                      key={email}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="size-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleEmail(email, !checked)}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium">{optionLabel(option)}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {email}
                        </span>
                      </span>
                      {checked ? (
                        <Check className="size-4 shrink-0 text-primary" />
                      ) : null}
                    </label>
                  );
                })
              ) : (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No Managers Match Your Search.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {error && options.length ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
