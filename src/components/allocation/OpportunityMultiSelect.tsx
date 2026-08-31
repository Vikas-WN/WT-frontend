"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Popover } from "@base-ui/react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/dashboard/ui/forms";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { useModalPanel } from "@/components/dashboard/ui/ModalPanelContext";
import { useClientOpportunities } from "@/hooks/clients/useClientOpportunities";
import { formatOpportunityLabel } from "@/utils/opportunity";
import type { OpportunityRecord } from "@/types/opportunity";

function matchesOpportunity(row: OpportunityRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.opportunityName.toLowerCase().includes(q) ||
    (row.oppId ?? "").toLowerCase().includes(q) ||
    (row.currentStatus ?? "").toLowerCase().includes(q)
  );
}

export function OpportunityMultiSelect({
  clientId,
  value,
  onChange,
  disabled = false,
  required = false,
}: {
  clientId: string;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [popupWidth, setPopupWidth] = useState(280);
  const modalPanel = useModalPanel();

  const resolvedClientId = clientId.trim();
  const { data, isLoading, isError } = useClientOpportunities({
    clientId: resolvedClientId || null,
    enabled: Boolean(resolvedClientId) && !disabled,
  });
  const opportunities = data?.items ?? [];

  const selectedSet = useMemo(
    () => new Set(value.map((id) => id.trim()).filter(Boolean)),
    [value]
  );

  const filtered = useMemo(
    () => opportunities.filter((row) => matchesOpportunity(row, query)),
    [opportunities, query]
  );

  const selectedRows = useMemo(
    () =>
      value
        .map((id) => opportunities.find((row) => row.id === id))
        .filter((row): row is OpportunityRecord => Boolean(row)),
    [opportunities, value]
  );

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && triggerRef.current) {
      setPopupWidth(Math.max(triggerRef.current.offsetWidth, 280));
    }
  }

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }
    onChange([...value, id]);
  }

  const hasNoOpportunities =
    Boolean(resolvedClientId) && !isLoading && !isError && opportunities.length === 0;

  if (!resolvedClientId) {
    return (
      <label className="flex flex-col gap-1 text-xs text-wt-text-muted sm:col-span-2">
        <FieldLabel label="Opportunities" required={required} />
        <p className="rounded-lg border border-dashed border-wt-border px-3 py-2 text-sm text-wt-text-muted">
          Select a client to load opportunities.
        </p>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-xs text-wt-text-muted sm:col-span-2">
      <FieldLabel label="Opportunities" required={required} />
      <div className="relative">
        <Popover.Root
          open={open && !hasNoOpportunities}
          onOpenChange={(next) => {
            if (hasNoOpportunities) return;
            handleOpenChange(next);
          }}
        >
          <Popover.Trigger
            render={
              <Button
                ref={triggerRef}
                type="button"
                variant="outline"
                role="combobox"
                aria-required={required || undefined}
                disabled={disabled || isLoading || hasNoOpportunities}
                className="h-10 w-full justify-between rounded-lg border-wt-border bg-wt-surface-1 px-3 text-left text-sm font-normal text-wt-text"
              />
            }
          >
            <span className="truncate">
              {isLoading
                ? "Loading opportunities…"
                : isError
                  ? "Could not load opportunities"
                  : selectedRows.length
                    ? `${selectedRows.length} selected`
                    : opportunities.length
                      ? "Select opportunities"
                      : "No opportunities for this client"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-60" aria-hidden />
          </Popover.Trigger>

          <Popover.Portal container={modalPanel}>
            <Popover.Positioner
              side="bottom"
              sideOffset={6}
              align="start"
              collisionPadding={12}
              collisionAvoidance={{
                side: "flip",
                align: "shift",
                fallbackAxisSide: "end",
              }}
              positionMethod={modalPanel ? "absolute" : "fixed"}
              className="isolate z-[200]"
            >
              <Popover.Popup
                // Trigger width drives the popup, so clamp it to the viewport or a
                // wide trigger near the right edge pushes the list off screen.
                style={{ width: popupWidth, maxWidth: "calc(100vw - 1rem)" }}
                className="overflow-hidden rounded-xl border border-wt-border bg-wt-surface-1 shadow-lg"
              >
                <div className="flex items-center gap-2 border-b border-wt-border px-3 py-2">
                  <Search className="size-3.5 text-wt-text-muted" aria-hidden />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search opportunities…"
                    className="w-full bg-transparent text-sm text-wt-text outline-none placeholder:text-wt-text-muted"
                  />
                </div>
                <div className="wt-combobox-scroll max-h-56 overflow-y-auto p-1">
                  {filtered.length ? (
                    filtered.map((row) => {
                      const selected = selectedSet.has(row.id);
                      return (
                        <button
                          key={row.id}
                          type="button"
                          className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-wt-surface-2"
                          onClick={() => toggle(row.id)}
                        >
                          <span
                            className={`mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded border ${
                              selected
                                ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-white"
                                : "border-wt-border text-transparent"
                            }`}
                          >
                            <Check className="size-3" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-wt-text">
                              {row.opportunityName}
                            </span>
                            <span className="block truncate text-xs text-wt-text-muted">
                              {[row.oppId, formatOpportunityLabel(row.currentStatus)]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-4 text-sm text-wt-text-muted">
                      No matching opportunities.
                    </p>
                  )}
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>

        {selectedRows.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedRows.map((row) => (
              <span
                key={row.id}
                className={`inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-[11px] ${filledBadgeClass("info")}`}
              >
                <span className="truncate" title={row.opportunityName}>
                  {row.opportunityName}
                </span>
                <button
                  type="button"
                  className="shrink-0 opacity-70 hover:opacity-100"
                  aria-label={`Remove ${row.opportunityName}`}
                  onClick={() => toggle(row.id)}
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {hasNoOpportunities ? (
          <p className="mt-1.5 text-xs text-wt-text-muted">
            This client has no opportunities configured. You can still create the project.
          </p>
        ) : null}
      </div>
    </label>
  );
}
