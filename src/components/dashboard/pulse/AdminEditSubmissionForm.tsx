"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { ApiError } from "@/api/error";
import { cn } from "@/lib/utils";
import {
  BRAND_FOCUS_RING_CLASS,
  FORM_CONTROL_CLASS,
  INFO_BANNER_CLASS,
} from "@/components/dashboard/ui/uiLayout";
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
import type { AdminEditPayload, MonthlySubmissionItem } from "@/types/kpi";

type Ratings = Record<number, number | null>;

const FIELD_CLASS = cn(FORM_CONTROL_CLASS, "mt-1.5");
const TEXTAREA_CLASS = cn(FIELD_CLASS, "min-h-20 resize-y py-2.5");

function toMap<T>(rows: T[], id: (r: T) => number, rating: (r: T) => number): Ratings {
  return Object.fromEntries(rows.map((r) => [id(r), rating(r)]));
}

function fromRecord(record: Record<string, number> | undefined): Ratings {
  return Object.fromEntries(Object.entries(record ?? {}).map(([k, v]) => [Number(k), v]));
}

/** Only the ids whose rating was actually changed (and set). */
function changed(next: Ratings, initial: Ratings): { id: number; rating: number }[] {
  return Object.entries(next)
    .filter(([id, rating]) => rating != null && rating !== initial[Number(id)])
    .map(([id, rating]) => ({ id: Number(id), rating: rating as number }));
}

/** HR/Admin correction of anyone's part of a submitted review. Sends only
 *  what changed; the backend logs the edit with the reason and notifies the
 *  employee (and the manager, when their part changed). */
export function AdminEditSubmissionForm({
  submission,
  onCancel,
  onSaved,
}: {
  submission: MonthlySubmissionItem;
  onCancel: () => void;
  onSaved: (updated: MonthlySubmissionItem) => void;
}) {
  const hasManager = Boolean(submission.manager_evaluation);
  const isApproved = submission.review_status === "APPROVED";

  const initial = useMemo(
    () => ({
      selfText: submission.self_review_text,
      empKpi: toMap(submission.kpi_ratings, (r) => r.kpi_id, (r) => r.rating),
      empValue: toMap(submission.value_ratings, (r) => r.value_id, (r) => r.rating),
      mgrKpi: fromRecord(submission.manager_evaluation?.kpi_ratings),
      mgrValue: fromRecord(submission.manager_evaluation?.value_ratings),
      mgrComments: submission.manager_evaluation?.comments ?? "",
    }),
    [submission]
  );

  const [selfText, setSelfText] = useState(initial.selfText);
  const [empKpi, setEmpKpi] = useState<Ratings>(initial.empKpi);
  const [empValue, setEmpValue] = useState<Ratings>(initial.empValue);
  const [mgrKpi, setMgrKpi] = useState<Ratings>(initial.mgrKpi);
  const [mgrValue, setMgrValue] = useState<Ratings>(initial.mgrValue);
  const [mgrComments, setMgrComments] = useState(initial.mgrComments);
  const [finalScore, setFinalScore] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = [
    ...submission.kpi_details.map((k) => ({
      key: `k${k.id}`,
      label: k.kpi_name,
      meta: `KPI · ${k.weightage}%`,
      emp: empKpi[k.id] ?? null,
      mgr: mgrKpi[k.id] ?? null,
      setEmp: (v: number) => setEmpKpi((p) => ({ ...p, [k.id]: v })),
      setMgr: (v: number) => setMgrKpi((p) => ({ ...p, [k.id]: v })),
    })),
    ...submission.value_details.map((v) => ({
      key: `v${v.id}`,
      label: v.name,
      meta: "Value",
      emp: empValue[v.id] ?? null,
      mgr: mgrValue[v.id] ?? null,
      setEmp: (r: number) => setEmpValue((p) => ({ ...p, [v.id]: r })),
      setMgr: (r: number) => setMgrValue((p) => ({ ...p, [v.id]: r })),
    })),
  ];

  const buildPayload = (): AdminEditPayload => {
    const payload: AdminEditPayload = { reason: reason.trim() };
    if (selfText.trim() !== initial.selfText.trim()) payload.self_review_text = selfText;
    const ek = changed(empKpi, initial.empKpi);
    if (ek.length) payload.kpi_ratings = ek.map(({ id, rating }) => ({ kpi_id: id, rating }));
    const ev = changed(empValue, initial.empValue);
    if (ev.length) payload.value_ratings = ev.map(({ id, rating }) => ({ value_id: id, rating, comment: "" }));
    if (hasManager) {
      const mk = changed(mgrKpi, initial.mgrKpi);
      if (mk.length) payload.manager_kpi_ratings = mk.map(({ id, rating }) => ({ kpi_id: id, rating }));
      const mv = changed(mgrValue, initial.mgrValue);
      if (mv.length)
        payload.manager_value_ratings = mv.map(({ id, rating }) => ({ value_id: id, rating, comment: "" }));
      if (mgrComments.trim() !== initial.mgrComments.trim()) payload.manager_comments = mgrComments;
    }
    if (isApproved && finalScore.trim()) payload.final_score = Number(finalScore);
    return payload;
  };

  const save = async () => {
    const payload = buildPayload();
    if (Object.keys(payload).length === 1) {
      notifyError("Nothing has changed yet.");
      return;
    }
    if (payload.reason.length < 10) {
      notifyError("Give a reason (at least 10 characters) for the change.");
      return;
    }
    if (payload.final_score !== undefined && !(payload.final_score >= 1 && payload.final_score <= 10)) {
      notifyError("Final score must be a number between 1 and 10.");
      return;
    }
    setSaving(true);
    try {
      const updated = await hrmsService.adminEditMonthlySubmission(submission.id, payload);
      notifySuccess("Changes saved. The employee has been notified.");
      onSaved(updated);
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : "Couldn't save the changes.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className={INFO_BANNER_CLASS}>
        Editing as HR. The review stays where it is in the workflow; the change is logged with your reason
        and the employee{hasManager ? " and manager are" : " is"} notified.
      </div>

      <div>
        <label className="text-sm font-semibold text-wt-text" htmlFor="edit-self-review">
          Employee self review
        </label>
        <textarea
          id="edit-self-review"
          value={selfText}
          onChange={(e) => setSelfText(e.target.value)}
          rows={4}
          className={TEXTAREA_CLASS}
        />
      </div>

      {rows.length > 0 ? (
        <ScrollableTable maxHeightClass="max-h-[min(50vh,420px)]">
          <WtTable>
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Employee</TableHead>
                <TableHead className="text-center">Manager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="whitespace-normal">
                    <p className="text-wt-text">{r.label}</p>
                    <p className="text-xs text-wt-text-faint">{r.meta}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <RatingSelect value={r.emp} onChange={r.setEmp} label={`Employee rating for ${r.label}`} />
                  </TableCell>
                  <TableCell className="text-center">
                    {hasManager ? (
                      <RatingSelect value={r.mgr} onChange={r.setMgr} label={`Manager rating for ${r.label}`} />
                    ) : (
                      <span className="text-xs text-wt-text-faint">Not rated yet</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </WtTable>
        </ScrollableTable>
      ) : null}

      {hasManager ? (
        <div>
          <label className="text-sm font-semibold text-wt-text" htmlFor="edit-manager-comments">
            Manager comments
          </label>
          <textarea
            id="edit-manager-comments"
            value={mgrComments}
            onChange={(e) => setMgrComments(e.target.value)}
            rows={2}
            className={TEXTAREA_CLASS}
          />
        </div>
      ) : null}

      {isApproved ? (
        <div>
          <label className="text-sm font-semibold text-wt-text" htmlFor="edit-final-score">
            Final score (optional)
          </label>
          <input
            id="edit-final-score"
            type="number"
            min={1}
            max={10}
            step={0.01}
            value={finalScore}
            onChange={(e) => setFinalScore(e.target.value)}
            placeholder={`Currently ${submission.final_score ?? "—"} · blank = recompute from the ratings`}
            className={FIELD_CLASS}
          />
        </div>
      ) : null}

      <div>
        <label className="text-sm font-semibold text-wt-text" htmlFor="edit-reason">
          Reason for the change <span className="text-rose-600">*</span>
        </label>
        <textarea
          id="edit-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Shared with the employee (min. 10 characters)."
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel Edit
        </Button>
        <Button type="button" onClick={() => void save()} disabled={saving}>
          <Save className="mr-1.5 size-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function RatingSelect({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        BRAND_FOCUS_RING_CLASS,
        "rounded-lg border border-wt-border bg-wt-surface-1 px-2 py-1 text-sm text-wt-text dark:border-wt-border-md dark:bg-wt-surface-2"
      )}
    >
      {value == null ? <option value="">—</option> : null}
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}
