"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hrmsService, type LeaveRecipientOption } from "@/services/hrms.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldLabel } from "@/components/ui/field";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { unwrapLeaveOptionItems } from "@/utils/leaveApiOptions";
import { ChevronsUpDown, X, Check, Search, Loader2 } from "lucide-react";

function optionLabel(option: LeaveRecipientOption): string {
  const name = option.name?.trim() || option.email;
  const empId = option.emp_id?.trim();
  return empId ? `${name} (${empId})` : name;
}

function matchesQuery(option: LeaveRecipientOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    option.email.toLowerCase().includes(q) ||
    (option.name ?? "").toLowerCase().includes(q) ||
    (option.emp_id ?? "").toLowerCase().includes(q)
  );
}

export function LeaveAdditionalRecipientsSelector({
  selectedEmails,
  onChange,
  disabled = false,
}: {
  selectedEmails: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<LeaveRecipientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const loadOptions = useCallback(async (search?: string) => {
    setSearching(true);
    setError(null);
    try {
      const res = await hrmsService.getLeaveRecipientOptions(
        search?.trim() ? { search: search.trim() } : undefined
      );
      const items = unwrapLeaveOptionItems<LeaveRecipientOption>(res);
      setOptions(items);
    } catch (err) {
      setOptions([]);
      setError(err instanceof Error ? err.message : "Could not load employees.");
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void loadOptions(query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, query, loadOptions]);

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

  const selectedOptions = useMemo(() => {
    const byEmail = new Map(
      options.map((option) => [String(option.email).trim().toLowerCase(), option] as const)
    );
    return selectedEmails
      .map((email) => byEmail.get(email.trim().toLowerCase()))
      .filter((option): option is LeaveRecipientOption => Boolean(option));
  }, [options, selectedEmails]);

  const filteredOptions = useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query]
  );

  const toggleEmail = (email: string, checked: boolean) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    const next = new Set(selectedSet);
    if (checked) next.add(normalized);
    else next.delete(normalized);
    const ordered = options
      .map((row) => String(row.email ?? "").trim().toLowerCase())
      .filter((value) => next.has(value));
    for (const value of next) {
      if (!ordered.includes(value)) ordered.push(value);
    }
    onChange(ordered);
  };

  const removeEmail = (email: string) => {
    toggleEmail(email, false);
  };

  const triggerLabel = selectedEmails.length
    ? `${selectedEmails.length} employee${selectedEmails.length > 1 ? "s" : ""} selected`
    : "Select employees…";

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error && !options.length) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-2" ref={rootRef}>
      <FieldLabel>Leave Notification Recipients</FieldLabel>

      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="h-10 w-full justify-between px-3 text-sm font-normal text-muted-foreground"
        >
          <span className={selectedEmails.length ? "text-foreground" : ""}>
            {triggerLabel}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>

        {open ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search employees…"
                value={query}
                disabled={disabled}
                autoComplete="off"
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {searching ? (
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
                  No employees match your search.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {selectedOptions.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => {
            const label = optionLabel(option);
            return (
              <span
                key={option.email}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${filledBadgeClass("neutral")}`}
              >
                <span className="max-w-[180px] truncate">{label}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeEmail(option.email)}
                  className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={`Remove ${label}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <p className="text-[11px] text-muted-foreground/80 mt-0.5 tracking-normal">Optional · Notify additional teammates</p>
    </div>
  );
}
