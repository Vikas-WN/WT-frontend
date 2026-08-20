"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownSelectField } from "@/components/dashboard/ui/forms";
import { ModalPanelContext } from "@/components/dashboard/ui/ModalPanelContext";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
  SECTION_DESCRIPTION_CLASS,
  SECTION_TITLE_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import { hrmsService } from "@/services/hrms.service";
import { formatApiDate, parseApiDate } from "@/utils/apiDate";
import { parseDesignationList } from "@/utils/masters";
import { formatUserTypeLabel } from "@/utils/offboardingFormState";

export type UserTypeTransitionConfirmPayload = {
  transitionDate: string;
  bandId?: number;
  role?: string;
};

type UserTypeTransitionDialogProps = {
  open: boolean;
  fromType: string;
  toType: string;
  saving?: boolean;
  /** When true, user must pick a band before confirming. */
  requireBand?: boolean;
  /** When true (typically with requireBand), user must pick a designation for the selected band. */
  requireDesignation?: boolean;
  department?: string;
  bandOptions?: Array<{ value: string; label: string }>;
  bandsLoading?: boolean;
  bandFieldLabel?: string;
  bandHelperText?: string;
  dateHelperText?: string;
  onClose: () => void;
  onConfirm: (payload: UserTypeTransitionConfirmPayload) => void | Promise<void>;
};

export function UserTypeTransitionDialog({
  open,
  fromType,
  toType,
  saving = false,
  requireBand = false,
  requireDesignation = false,
  department = "",
  bandOptions = [],
  bandsLoading = false,
  bandFieldLabel = "Band",
  bandHelperText,
  dateHelperText,
  onClose,
  onConfirm,
}: UserTypeTransitionDialogProps) {
  const [transitionDate, setTransitionDate] = useState(() => formatApiDate(new Date()));
  const [bandId, setBandId] = useState("");
  const [role, setRole] = useState("");
  const [designationOptions, setDesignationOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [designationsLoading, setDesignationsLoading] = useState(false);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTransitionDate(formatApiDate(new Date()));
    setBandId("");
    setRole("");
    setDesignationOptions([]);
  }, [open, fromType, toType]);

  useEffect(() => {
    if (!open || !requireBand || bandsLoading) return;
    if (bandOptions.length === 1 && !bandId) {
      setBandId(bandOptions[0]?.value ?? "");
    }
  }, [open, requireBand, bandsLoading, bandOptions, bandId]);

  useEffect(() => {
    if (!open || !requireDesignation) {
      setDesignationOptions([]);
      setDesignationsLoading(false);
      return;
    }
    const dept = department.trim();
    const selectedBandId = Number(bandId);
    if (!dept || !Number.isFinite(selectedBandId) || selectedBandId <= 0) {
      setDesignationOptions([]);
      setRole("");
      setDesignationsLoading(false);
      return;
    }

    let cancelled = false;
    setDesignationsLoading(true);
    setRole("");
    void (async () => {
      try {
        const res = await hrmsService.searchDesignations({
          band_id: selectedBandId,
          department: dept,
        });
        if (cancelled) return;
        const options = parseDesignationList(res).map((item) => ({
          value: item.name,
          label: item.name,
        }));
        setDesignationOptions(options);
        if (options.length === 1) {
          setRole(options[0]?.value ?? "");
        }
      } catch {
        if (!cancelled) setDesignationOptions([]);
      } finally {
        if (!cancelled) setDesignationsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, requireDesignation, department, bandId]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, saving]);

  const selectedDate = useMemo(() => parseApiDate(transitionDate) ?? undefined, [transitionDate]);

  if (!open || !mounted || typeof document === "undefined") return null;

  const bandReady = !requireBand || Boolean(bandId.trim());
  const canConfirm =
    Boolean(transitionDate.trim()) &&
    bandReady &&
    (!requireDesignation || Boolean(role.trim())) &&
    !saving &&
    !bandsLoading &&
    !(requireDesignation && designationsLoading);

  const defaultDateHelper =
    dateHelperText ??
    (String(toType).toUpperCase().replace(/[\s_-]+/g, "") === "FULLTIME"
      ? "Set the transition date for this employee's full-time start."
      : "Set the transition date for this user-type change.");

  return createPortal(
    <div className={MODAL_OVERLAY_CLASS} role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-type-transition-title"
        className={cn(MODAL_PANEL_CLASS, "wt-soft-in", "max-w-lg")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={MODAL_HEADER_CLASS}>
          <h2 id="user-type-transition-title" className={SECTION_TITLE_CLASS}>
            Confirm User Type Transition
          </h2>
          <p className={SECTION_DESCRIPTION_CLASS}>
            Changing from {formatUserTypeLabel(fromType)} to {formatUserTypeLabel(toType)}.
          </p>
          <p className={cn(SECTION_DESCRIPTION_CLASS, "mt-1")}>{defaultDateHelper}</p>
          {bandHelperText ? (
            <p className={cn(SECTION_DESCRIPTION_CLASS, "mt-2")}>{bandHelperText}</p>
          ) : null}
        </div>

        <div ref={setPortalHost} className={cn(MODAL_BODY_CLASS, "space-y-4")}>
          <ModalPanelContext.Provider value={portalHost}>
            {requireBand ? (
              <DropdownSelectField
                label={bandFieldLabel}
                value={bandId}
                onChange={(value) => {
                  setBandId(value);
                  setRole("");
                }}
                options={bandOptions}
                required
                placeholder={bandsLoading ? "Loading bands…" : "Select band"}
                disabled={saving || bandsLoading}
                loading={bandsLoading}
              />
            ) : null}
            {requireDesignation ? (
              <DropdownSelectField
                label="Designation"
                value={role}
                onChange={setRole}
                options={designationOptions}
                required
                placeholder={
                  !bandId.trim()
                    ? "Select a band first"
                    : !department.trim()
                      ? "Employee department is required"
                      : designationsLoading
                        ? "Loading designations…"
                        : designationOptions.length
                          ? "Select designation"
                          : "No designations for this band"
                }
                disabled={
                  saving ||
                  designationsLoading ||
                  !bandId.trim() ||
                  !department.trim() ||
                  !designationOptions.length
                }
                loading={designationsLoading}
              />
            ) : null}
            <div>
              <p className="mb-3 text-center text-sm font-medium text-wt-text">
                Transition Date
                <span className="text-destructive" aria-hidden>
                  {" "}
                  *
                </span>
              </p>
              <div className="flex w-full justify-center">
                <div className="inline-flex rounded-xl border border-wt-border bg-wt-surface-1 p-1 shadow-sm">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) setTransitionDate(formatApiDate(date));
                    }}
                    disabled={saving}
                    classNames={{ root: "w-fit bg-transparent p-2" }}
                  />
                </div>
              </div>
            </div>
          </ModalPanelContext.Provider>
        </div>

        <div className={MODAL_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand"
            disabled={!canConfirm}
            onClick={() => {
              const payload: UserTypeTransitionConfirmPayload = {
                transitionDate,
              };
              if (requireBand && bandId.trim()) {
                payload.bandId = Number(bandId);
              }
              if (requireDesignation && role.trim()) {
                payload.role = role.trim();
              }
              void onConfirm(payload);
            }}
          >
            {saving ? "Saving…" : "Confirm Transition"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
