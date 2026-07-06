"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAllocationEmployees } from "@/hooks/useAllocationEmployees";
import { FieldLabel } from "@/components/dashboard/ui/forms";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

function matchesEmployee(
  employee: { employeeEmail: string; employeeName: string },
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    employee.employeeEmail.toLowerCase().includes(q) ||
    employee.employeeName.toLowerCase().includes(q)
  );
}

export function InternalEmployeesMultiSelect({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (emails: string[]) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { data: employees = [], isLoading, isError } = useAllocationEmployees();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(
    () => new Set(value.map((email) => email.trim().toLowerCase()).filter(Boolean)),
    [value]
  );

  const filteredEmployees = useMemo(
    () => employees.filter((employee) => matchesEmployee(employee, query)),
    [employees, query]
  );

  const selectedEmployees = useMemo(
    () =>
      value
        .map((email) => employees.find((row) => row.employeeEmail === email))
        .filter((row): row is NonNullable<typeof row> => Boolean(row)),
    [employees, value]
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

  const toggleEmail = (email: string, checked: boolean) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    const next = new Set(selectedSet);
    if (checked) next.add(normalized);
    else next.delete(normalized);

    const ordered = value.filter((item) => next.has(item.trim().toLowerCase()));
    for (const employee of employees) {
      const emailKey = employee.employeeEmail.trim().toLowerCase();
      if (next.has(emailKey) && !ordered.some((item) => item.trim().toLowerCase() === emailKey)) {
        ordered.push(employee.employeeEmail);
      }
    }
    onChange(ordered);
  };

  const triggerLabel = value.length
    ? `${value.length} selected`
    : placeholder ?? `Search and select ${label.toLowerCase()}…`;

  return (
    <div className="space-y-2" ref={rootRef}>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={required || undefined}
          disabled={disabled || isLoading || isError}
          onClick={() => setOpen((current) => !current)}
          className="h-10 w-full justify-between px-3 text-sm font-normal text-muted-foreground"
        >
          <span className={value.length ? "text-foreground" : ""}>
            {isLoading ? "Loading employees…" : isError ? "Could not load employees" : triggerLabel}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>

        {open ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
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
              {filteredEmployees.length ? (
                filteredEmployees.map((employee) => {
                  const checked = selectedSet.has(employee.employeeEmail.toLowerCase());
                  return (
                    <label
                      key={employee.employeeEmail}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="size-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleEmail(employee.employeeEmail, !checked)}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium block truncate">{employee.employeeName}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {employee.employeeEmail}
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

      {selectedEmployees.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedEmployees.map((employee) => (
            <span
              key={employee.employeeEmail}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${filledBadgeClass("neutral")}`}
            >
              <span className="max-w-[220px] truncate">{employee.employeeName}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleEmail(employee.employeeEmail, false)}
                className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={`Remove ${employee.employeeName}`}
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
