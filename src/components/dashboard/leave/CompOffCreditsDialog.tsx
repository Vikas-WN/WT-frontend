"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Info } from "lucide-react";
import { compOffService } from "@/services/compOff.service";
import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";

interface CompOffCredit {
  workedDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
  remainingUnits: number;
  projectCode: string;
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
      const mapped: CompOffCredit[] = parsed.rows.map((r) => ({
        workedDate: String(r.worked_date ?? r.workedDate ?? ""),
        expiryDate: String(r.expiry_date ?? r.expiryDate ?? ""),
        daysUntilExpiry: Number(r.days_until_expiry ?? r.daysUntilExpiry ?? 0),
        status: String(r.status ?? "PENDING"),
        remainingUnits: Number(r.remaining_units ?? r.remainingUnits ?? 0),
        projectCode: String(r.project_code ?? r.projectCode ?? ""),
        workDescription: String(r.work_description ?? r.workDescription ?? ""),
      }));
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
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
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            &times;
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : credits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No comp off credits found.</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] font-semibold tracking-wider text-muted-foreground bg-muted/40 sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-left">Worked date</th>
                  <th className="px-3 py-2.5 text-left">Expiry date</th>
                  <th className="px-3 py-2.5 text-left">
                    Days left
                    <span title="Expiry is 60 days from the worked date, not from the submission date." className="inline-flex align-middle ml-1 cursor-help">
                      <Info className="size-3.5 text-muted-foreground/60" />
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left">Project</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((c, i) => {
                  const isExpiring = c.daysUntilExpiry > 0 && c.daysUntilExpiry <= 60;
                  const isExpired = c.daysUntilExpiry <= 0;
                  return (
                    <tr key={i} className={i % 2 === 1 ? "bg-muted/20" : ""}>
                      <td className="px-3 py-2.5 whitespace-nowrap">{c.workedDate}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{c.expiryDate}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {isExpired ? (
                          <span className="text-red-600 font-medium">Expired</span>
                        ) : (
                          <span className={`tabular-nums ${isExpiring ? "text-amber-600 font-medium" : ""}`}>
                            {isExpiring ? <AlertTriangle className="size-3.5 inline mr-1 text-amber-500" /> : null}
                            {c.daysUntilExpiry} days
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <RequestStatusBadge status={c.status} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{c.projectCode}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
