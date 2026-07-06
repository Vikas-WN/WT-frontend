"use client";

import { useMemo } from "react";
import { useClients } from "@/hooks/clients/useClients";
import { FieldLabel, SearchableSelectCombobox } from "@/components/dashboard/ui/forms";

export function ClientSelect({
  value,
  onChange,
  onClientSelected,
  required = false,
  activeOnly = true,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onClientSelected?: (client: {
    id: number;
    name: string;
    accountManagerEmail: string | null;
    deliveryManagerEmail: string | null;
  }) => void;
  required?: boolean;
  activeOnly?: boolean;
  disabled?: boolean;
}) {
  const { data: clients = [], isLoading, isError } = useClients({ activeOnly });

  const selectOptions = useMemo(() => {
    const placeholder = isLoading
      ? "Loading clients…"
      : isError
        ? "Could not load clients"
        : clients.length
          ? "Select client"
          : "No clients found";
    const rows = clients.map((client) => ({
      value: String(client.id),
      label: client.name,
    }));
    return [{ value: "", label: placeholder }, ...rows];
  }, [clients, isLoading, isError]);

  return (
    <label className="text-xs text-wt-text-muted flex flex-col gap-1">
      <FieldLabel label="Client" required={required} />
      <SearchableSelectCombobox
        value={value}
        onChange={(next) => {
          onChange(next);
          const client = clients.find((row) => String(row.id) === next);
          if (client && onClientSelected) {
            onClientSelected({
              id: client.id,
              name: client.name,
              accountManagerEmail: client.accountManagerEmail,
              deliveryManagerEmail: client.deliveryManagerEmail,
            });
          }
        }}
        options={selectOptions}
        placeholder="Search clients…"
        required={required}
        disabled={disabled || isLoading}
        aria-label="Client"
      />
    </label>
  );
}
