"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { compOffService } from "@/services/compOff.service";
import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";

interface CompOffCredit {
  workedDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
  remainingUnits: number;
  projectName: string;
  workDescription: string;
}

export function CompOffCreditsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [credits, setCredits] = useState<CompOffCredit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    compOffService.getExpiry().then((res) => {
      const parsed = compOffService.parseExpiryResponse(res);
      const mapped: CompOffCredit[] = parsed.rows.map((r) => {
        const projectCode = String(r.project_code ?? r.projectCode ?? "").trim();
        const projectName = String(r.project_name ?? r.projectName ?? "").trim();
        return {
          workedDate: String(r.worked_date ?? r.workedDate ?? ""),
          expiryDate: String(r.expiry_date ?? r.expiryDate ?? ""),
          daysUntilExpiry: Number(r.days_until_expiry ?? r.daysUntilExpiry ?? 0),
          status: String(r.status ?? "PENDING"),
          remainingUnits: Number(r.remaining_units ?? r.remainingUnits ?? 0),
          projectName: projectName || projectCode || "—",
          workDescription: String(r.work_description ?? r.workDescription ?? ""),
        };
      });
      setCredits(mapped);
    }).catch(() => {
      setCredits([]);
    }).finally(() => {
      setLoading(false);
    });
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 dark:bg-black/70"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-wt-text">My Comp Off Credits</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-wt-text-muted" />
          </div>
        ) : credits.length === 0 ? (
          <p className="py-6 text-center text-sm text-wt-text-muted">No comp off credits found.</p>
        ) : (
          <ScrollableTable maxHeightClass="max-h-[60vh]">
            <WtTable>
              <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Worked date</TableHead>
                  <TableHead>Expiry date</TableHead>
                  <TableHead>
                    Days left
                    <span title="Expiry is 60 days from the worked date, not from the submission date." className="ml-1 inline-flex cursor-help align-middle">
                      <Info className="size-3.5 text-wt-text-faint" />
                    </span>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map((c) => {
                  const isExpiring = c.daysUntilExpiry > 0 && c.daysUntilExpiry <= 60;
                  const isExpired = c.daysUntilExpiry <= 0;
                  return (
                    <TableRow key={`${c.workedDate}-${c.projectName}`}>
                      <TableCell>{c.workedDate}</TableCell>
                      <TableCell>{c.expiryDate}</TableCell>
                      <TableCell>
                        {isExpired ? (
                          <span className="font-medium text-rose-600 dark:text-rose-400">Expired</span>
                        ) : (
                          <span className={cn("tabular-nums", isExpiring && "font-medium text-amber-700 dark:text-amber-400")}>
                            {isExpiring ? <AlertTriangle className="mr-1 inline size-3.5 text-amber-600 dark:text-amber-400" /> : null}
                            {c.daysUntilExpiry} days
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RequestStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-wt-text-muted">{c.projectName}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </WtTable>
          </ScrollableTable>
        )}

        <div className="flex justify-end border-t border-wt-border pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
