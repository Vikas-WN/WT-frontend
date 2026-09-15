"use client";

import { useEffect, useState } from "react";
import { Award, Printer, X } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { Button } from "@/components/ui/button";
import {
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { hrmsService } from "@/services/hrms.service";
import { formatApiDateDisplay } from "@/utils/apiDate";
import type { CertificateOut } from "@/types/learning";

type Load<T> = { status: "loading" | "done" | "error"; data: T | null };

/** Local copy of the small async-fetch hook used across dashboard pages —
 *  kept file-local rather than shared (see HomePageClient's own copy). */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading", data: null });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await fn();
        if (alive) setState({ status: "done", data });
      } catch {
        if (alive) setState({ status: "error", data: null });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function CertificateModal({ trainingId, onClose }: { trainingId: string; onClose: () => void }) {
  const certificate = useLoad<CertificateOut>(
    () => hrmsService.getTrainingCertificate(trainingId).then((r) => {
      if (!r.data) throw new Error("No certificate data");
      return r.data;
    }),
    [trainingId]
  );

  return (
    <div className={MODAL_OVERLAY_CLASS} role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className={MODAL_PANEL_CLASS}>
        <div className="flex items-center justify-between border-b border-wt-border px-5 py-3 print:hidden">
          <h2 className="text-base font-semibold text-wt-text">Certificate</h2>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1.5 size-4" /> Print
            </Button>
            <Button type="button" size="icon-sm" variant="ghost" onClick={onClose} aria-label="Close">
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <div className="p-6">
          {certificate.status === "loading" ? (
            <SectionLoading label="" />
          ) : !certificate.data ? (
            <p className="text-sm text-wt-text-muted">Couldn&apos;t load your certificate.</p>
          ) : (
            <div className="rounded-2xl border-4 border-double border-wt-brand/40 p-10 text-center">
              <Award className="mx-auto size-10 text-wt-brand" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-wt-text-muted">
                Certificate of Completion
              </p>
              <p className="mt-6 text-sm text-wt-text-muted">This certifies that</p>
              <p className="mt-1 text-2xl font-semibold text-wt-text">{certificate.data.recipient_name}</p>
              {certificate.data.recipient_emp_id ? (
                <p className="text-xs text-wt-text-faint">{certificate.data.recipient_emp_id}</p>
              ) : null}
              <p className="mt-4 text-sm text-wt-text-muted">has successfully completed</p>
              <p className="mt-1 text-xl font-semibold text-wt-brand">{certificate.data.training_name}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-wt-text-faint">
                {certificate.data.category}
              </p>
              {certificate.data.final_score != null ? (
                <p className="mt-3 text-sm text-wt-text-muted">
                  Final score: <span className="font-semibold text-wt-text">{certificate.data.final_score}%</span>
                </p>
              ) : null}
              <div className="mt-8 flex items-center justify-center gap-8 text-xs text-wt-text-faint">
                <span>Completed {formatApiDateDisplay(certificate.data.completed_at)}</span>
                <span>Issued {formatApiDateDisplay(certificate.data.issued_at)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
