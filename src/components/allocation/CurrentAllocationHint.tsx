"use client";

import { useEffect, useState } from "react";
import { hrmsService } from "@/services/hrms.service";
import { parseEmployeeAllocationsResponse } from "@/utils/allocationList";

export function CurrentAllocationHint({ email }: { email: string }) {
  const [percent, setPercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setPercent(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void hrmsService
      .getEmployeeAllocations({ userEmail: normalized })
      .then((res) => {
        if (cancelled) return;
        const parsed = parseEmployeeAllocationsResponse(res.data ?? res);
        setPercent(parsed.totalAllocatedPercent);
      })
      .catch(() => {
        if (!cancelled) setPercent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [email]);

  if (!email.trim()) return null;

  return (
    <p className="text-xs text-wt-text-muted">
      {loading
        ? "Loading current allocation…"
        : percent != null
          ? `Current allocation: ${percent}%`
          : "Current allocation: —"}
    </p>
  );
}
