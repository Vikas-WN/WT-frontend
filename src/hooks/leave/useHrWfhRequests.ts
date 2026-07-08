"use client";

import { useCallback, useState } from "react";
import { listScopedUserRequests } from "@/utils/userRequest";
import { enrichWfhRequestRows } from "@/utils/wfhRequestEnrichment";

export type HrWfhRequestFilters = {
  fromDate: string;
  toDate: string;
};

export function defaultHrWfhRequestFilters(): HrWfhRequestFilters {
  const today = new Date();
  const future = new Date(today);
  future.setFullYear(future.getFullYear() + 2);
  return {
    fromDate: `${today.getFullYear()}-01-01`,
    toDate: future.toISOString().slice(0, 10),
  };
}

export function useHrWfhRequests() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HrWfhRequestFilters>(() => defaultHrWfhRequestFilters());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await listScopedUserRequests({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        requestType: "WFH",
        size: 500,
      });
      const wfhOnly = fetched.filter(
        (row) => String(row.request_type ?? row.requestType ?? "").trim().toUpperCase() === "WFH"
      );
      const enriched = await enrichWfhRequestRows(wfhOnly);
      setRows(enriched);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters.fromDate, filters.toDate]);

  return { rows, loading, filters, setFilters, load };
}
