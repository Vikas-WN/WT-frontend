"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo, useRef, useState, useId } from "react";
import { hrmsService } from "@/services/hrms.service";
import { useDesignationSelectOptions } from "@/hooks/useDesignationSelectOptions";
import { FieldLabel, InputField, DropdownSelectField, DatePickerField, AdaptiveSelectField } from "@/components/dashboard/ui/forms";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CARD_FORM_GRID_CLASS, CARD_FORM_ACTIONS_CLASS, FORM_FIELD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { FormGridSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { isValidPersonName } from "@/utils/dashboard/validation";
import {
  bandSelectOptionsForUserType,
  designationLengthError,
  internBandDisplayLabel,
  resolveInternBandId,
} from "@/utils/dashboard/validation";
import { parseApiDate } from "@/utils/apiDate";
import { nameFromOnboardOptionLabel } from "@/utils/exitInterviewManagers";
import type { OnboardFormState } from "@/utils/onboardFormState";
import type { OnboardOptionsResponse } from "@/types/onboard-options";
import { useAuth } from "@/context/AuthContext";
import { PORTAL_ROLE_SELECT_OPTIONS, portalRoleOptionsForActor } from "@/utils/roles";
import {
  PHONE_COUNTRY_OPTIONS,
  defaultPhoneCountryIso,
  digitsOnly,
  formatPhoneNumberForApi,
  validatePhoneNumber,
} from "@/utils/phoneCountries";

function emailFromOnboardOptionLabel(label: string): string | undefined {
  const match = /\(([^)]*@[^)]*)\)\s*$/.exec(label.trim());
  return match?.[1]?.trim() || undefined;
}

type HrOnboardFormProps = {
  formKey: number;
  form: OnboardFormState;
  setForm: React.Dispatch<React.SetStateAction<OnboardFormState>>;
  options: OnboardOptionsResponse;
  bands: Array<Record<string, unknown>>;
  hasHrAccess: boolean;
  actionLoading: boolean;
  optionsLoading?: boolean;
  onSubmitSuccess: () => Promise<void>;
  onError: (message: string) => void;
  runAction: (label: string, fn: () => Promise<void>) => void;
};

function EmployeeIdField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const [invalidAttempt, setInvalidAttempt] = useState(false);

  return (
    <Field className={FORM_FIELD_CLASS}>
      <FieldLabel label="Employee ID" required htmlFor={fieldId} />
        <Input
          id={fieldId}
          value={value}
          placeholder="Only letters and numbers are allowed (no spaces or special characters)."
          autoComplete="off"
          aria-describedby={invalidAttempt ? `${hintId} ${errorId}` : hintId}
          aria-invalid={invalidAttempt || undefined}
          className="bg-wt-surface-1"
          onChange={(event) => {
            const raw = event.target.value;
            const cleaned = raw.replace(/[^A-Za-z0-9]/g, "");
            setInvalidAttempt(cleaned.length < raw.length);
            onChange(cleaned);
          }}
        />
        {invalidAttempt ? (
          <p
            id={errorId}
            role="alert"
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-100"
          >
            Special characters and spaces are not allowed in Employee ID.
          </p>
        ) : null}
    </Field>
  );
}

function validateWorkStep(
  form: OnboardFormState,
  internBandId: number,
  ctx?: {
    designationLoading?: boolean;
    designationOptionsCount?: number;
  }
) {
  const empId = form.emp_id.trim();
  const email = form.email.trim().toLowerCase();
  const name = form.name.trim();
  const department = form.department.trim();
  const role = form.role.trim();
  const reportingManagerId = Number(form.reporting_manager_id);

  if (!empId) throw new Error("Employee ID is required.");
  if (empId.length > 50) throw new Error("Employee ID must be at most 50 characters.");
  if (!/^[A-Za-z0-9]+$/.test(empId)) {
    throw new Error("Employee ID must contain only letters and numbers (no spaces or special characters).");
  }
  if (!email || !name) throw new Error("Work Email and Name are required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid Work Email.");
  }
  if (!isValidPersonName(name)) {
    throw new Error("Name should be 2–120 characters and contain letters (and spaces) only.");
  }
  const phoneCountry = form.phone_country?.trim() || defaultPhoneCountryIso();
  if (!phoneCountry) throw new Error("Please select a country code.");
  const phoneError = validatePhoneNumber(phoneCountry, form.phone_number);
  if (phoneError) throw new Error(phoneError);
  const phoneNumber = formatPhoneNumberForApi(phoneCountry, form.phone_number);
  if (!phoneNumber) throw new Error("Phone Number is required.");
  if (!form.user_type) throw new Error("User Type is required.");
  const portalRole = form.portal_role.trim();
  if (!portalRole) throw new Error("Portal Role is required.");
  const allowedPortalRoles = new Set(
    PORTAL_ROLE_SELECT_OPTIONS.map((option) => option.value)
  );
  if (!allowedPortalRoles.has(portalRole as (typeof PORTAL_ROLE_SELECT_OPTIONS)[number]["value"])) {
    throw new Error("Please select a valid Portal Role.");
  }
  if (!department) throw new Error("Department is required.");

  const isConsultant = form.user_type === "CONSULTANT";
  const bandId =
    form.user_type === "INTERN"
      ? internBandId
      : isConsultant
        ? null
        : Number(form.band_id);
  if (!isConsultant && (!Number.isFinite(bandId) || Number(bandId) <= 0)) {
    throw new Error("Please select a valid Band.");
  }

  if (!form.work_mode) throw new Error("Work Mode is required.");
  if (!form.work_location_type) throw new Error("Work Location is required.");
  if (!form.category) throw new Error("Category is required.");
  if (!Number.isFinite(reportingManagerId) || reportingManagerId <= 0) {
    throw new Error("Reporting Manager is required.");
  }

  if (form.user_type === "INTERN") {
    if (!form.doi.trim()) throw new Error("Date of Internship is required for interns.");
    if (!parseApiDate(form.doi)) {
      throw new Error("Please enter a valid internship date in DD/MM/YYYY format.");
    }
    const durationRaw = form.internship_duration.trim();
    if (!durationRaw) {
      throw new Error("Internship Duration is required for interns.");
    }
    if (!/^\d+$/.test(durationRaw)) {
      throw new Error("Internship Duration must be a whole number. Only numeric values are allowed.");
    }
    const durationMonths = Number(durationRaw);
    if (durationMonths < 1 || durationMonths > 60) {
      throw new Error("Please enter a valid internship duration in months (1–60).");
    }
  } else if (!form.doj.trim()) {
    throw new Error("Date of Joining is required.");
  }

  if (ctx?.designationLoading) {
    throw new Error("Designations are still loading. Please wait a moment.");
  }
  if (ctx?.designationOptionsCount === 0) {
    throw new Error(
      isConsultant
        ? "No designation is configured for the selected department. Please choose a different department."
        : "No designation is configured for the selected band. Please choose a different department or band."
    );
  }
  if (!role) throw new Error("Designation is required.");
  const designationError = designationLengthError(role);
  if (designationError) throw new Error(designationError);

  return { empId, email, name, department, role, bandId, reportingManagerId, portalRole, phoneNumber };
}

export function HrOnboardForm({
  formKey,
  form,
  setForm,
  options,
  bands,
  actionLoading,
  optionsLoading = false,
  onSubmitSuccess,
  onError,
  runAction,
}: HrOnboardFormProps) {
  const { user } = useAuth();
  const portalRoleOptions = useMemo(() => portalRoleOptionsForActor(user?.roles ?? []), [user?.roles]);
  const internBandId = useMemo(() => resolveInternBandId(bands), [bands]);

  const bandOptions = useMemo(
    () => bandSelectOptionsForUserType(bands, form.department, form.user_type, internBandId),
    [bands, form.department, form.user_type, internBandId]
  );

  const internBandLabel = useMemo(
    () => internBandDisplayLabel(bands, internBandId),
    [bands, internBandId]
  );

  const isConsultant = form.user_type === "CONSULTANT";

  const designationBandId = useMemo(() => {
    if (form.user_type === "CONSULTANT") return 0;
    if (form.user_type === "INTERN") return internBandId;
    return Number(form.band_id);
  }, [form.band_id, form.user_type, internBandId]);

  /** Consultants have no band on the profile — load designations across department bands. */
  const consultantDesignationBandIds = useMemo(
    () =>
      isConsultant
        ? bandOptions.map((option) => Number(option.value)).filter((id) => Number.isFinite(id) && id > 0)
        : undefined,
    [bandOptions, isConsultant]
  );

  const reportingManagerOptions = useMemo(
    () =>
      options.reporting_managers.map((rm) => {
        const name = nameFromOnboardOptionLabel(rm.label);
        const email = emailFromOnboardOptionLabel(rm.label);
        const label = name.length > 72 ? `${name.slice(0, 72)}…` : name;
        return {
          value: rm.value,
          label,
          ...(email ? { title: email } : {}),
        };
      }),
    [options.reporting_managers]
  );

  const department = form.department.trim();
  const {
    options: designationOptions,
    loading: designationLoading,
    isError: designationQueryError,
    error: designationQueryErrorDetail,
  } = useDesignationSelectOptions(department, designationBandId, consultantDesignationBandIds);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const designationFieldError = designationLengthError(form.role);

  useEffect(() => {
    if (!designationQueryError) return;
    onErrorRef.current(
      designationQueryErrorDetail instanceof Error
        ? designationQueryErrorDetail.message
        : "Could not load designations for this band."
    );
  }, [designationQueryError, designationQueryErrorDetail]);

  useEffect(() => {
    if (form.user_type !== "INTERN" || internBandId <= 0) return;
    setForm((prev) => (prev.band_id === internBandId ? prev : { ...prev, band_id: internBandId }));
  }, [form.user_type, internBandId, setForm]);

  // Reacts only to the designation options themselves (band/department changes) —
  // not to form.role — so clearing the field (e.g. via Backspace) isn't immediately
  // fought by this effect snapping the single/only option back in.
  useEffect(() => {
    if (designationLoading) return;
    if (designationOptions.length === 1) {
      const onlyRole = designationOptions[0]?.value ?? "";
      if (!onlyRole) return;
      setForm((prev) => (prev.role === onlyRole ? prev : { ...prev, role: onlyRole }));
      return;
    }
    setForm((prev) => {
      if (!prev.role) return prev;
      const validRoles = new Set(designationOptions.map((option) => option.value).filter(Boolean));
      if (designationOptions.length > 0 && !validRoles.has(prev.role)) {
        return { ...prev, role: "" };
      }
      return prev;
    });
  }, [designationOptions, designationLoading, setForm]);

  useEffect(() => {
    if (!form.department.trim()) return;
    if (form.user_type === "INTERN" || form.user_type === "CONSULTANT") return;
    const currentBandId = Number(form.band_id);
    if (!currentBandId) return;
    const stillValid = bandOptions.some((option) => Number(option.value) === currentBandId);
    if (!stillValid) {
      setForm((prev) => ({ ...prev, band_id: 0, role: "" }));
    }
  }, [bandOptions, form.band_id, form.department, form.user_type, setForm]);

  function submit() {
    const lengthError = designationLengthError(form.role);
    if (lengthError) {
      onError?.(lengthError);
      return;
    }

    void runAction("Create And Invite Employee", async () => {
      const {
        empId,
        email,
        name,
        department,
        role,
        bandId,
        reportingManagerId,
        portalRole,
        phoneNumber,
      } = validateWorkStep(form, internBandId, {
          designationLoading,
          designationOptionsCount: designationOptions.length,
        });

      const basePayload: Record<string, unknown> = {
        emp_id: empId,
        email,
        name,
        user_type: form.user_type,
        department,
        role,
        portal_role: portalRole,
        phone_number: phoneNumber,
        work_mode: form.work_mode,
        work_location_type: form.work_location_type,
        category: form.category,
        reporting_manager_id: reportingManagerId,
      };
      if (bandId != null) {
        basePayload.band_id = bandId;
      }
      if (form.user_type === "INTERN") {
        await hrmsService.createOnboard({
          ...basePayload,
          doj: null,
          doi: form.doi.trim(),
          internship_duration: Number(form.internship_duration.trim()),
        });
      } else {
        await hrmsService.createOnboard({
          ...basePayload,
          doj: form.doj.trim(),
          doi: null,
          internship_duration: null,
        });
      }

      await onSubmitSuccess();
    });
  }

  return (
    <Card className="p-0">
      <CardHeader>
        <CardTitle>Information</CardTitle>
        <CardDescription>
          Complete the required work fields to create and invite the employee. Employee portal
          roles complete personal details during self-service onboarding; Manager and other staff
          roles skip that flow and are activated immediately.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent>
        {optionsLoading ? (
          <FormGridSkeleton fields={12} />
        ) : (
          <>
            <div key={`${formKey}-work`} className={CARD_FORM_GRID_CLASS}>
        <EmployeeIdField
          value={form.emp_id}
          onChange={(v) => setForm((p) => ({ ...p, emp_id: v }))}
        />
        <InputField
          label="Work Email"
          type="email"
          required
          value={form.email}
          onChange={(v) => setForm((p) => ({ ...p, email: v }))}
        />
        <InputField
          label="Name"
          required
          value={form.name}
          onChange={(v) => setForm((p) => ({ ...p, name: v }))}
        />
        <AdaptiveSelectField
          label="Country Code"
          required
          value={form.phone_country || defaultPhoneCountryIso()}
          placeholder="Select Country Code"
          searchPlaceholder="Search Country Code…"
          options={PHONE_COUNTRY_OPTIONS}
          onChange={(v) => setForm((p) => ({ ...p, phone_country: v }))}
        />
        <InputField
          label="Phone Number"
          type="tel"
          required
          value={form.phone_number}
          onChange={(v) => setForm((p) => ({ ...p, phone_number: digitsOnly(v) }))}
        />
        <DropdownSelectField
          label="User Type"
          required
          placeholder="Select"
          value={form.user_type}
          options={options.user_types}
          onChange={(v) =>
            setForm((p) => {
              const ut = String(v ?? "").trim();
              if (!ut) {
                return { ...p, user_type: "", band_id: 0, role: "" };
              }
              if (ut === "INTERN") {
                return { ...p, user_type: ut, band_id: internBandId, role: "" };
              }
              return { ...p, user_type: ut, band_id: 0, role: "" };
            })
          }
        />
        <DropdownSelectField
          label="Portal Role"
          required
          placeholder="Select"
          value={form.portal_role}
          options={portalRoleOptions}
          onChange={(v) => setForm((p) => ({ ...p, portal_role: v }))}
        />
        <DropdownSelectField
          label="Department"
          required
          placeholder="Select"
          value={form.department}
          options={options.departments}
          onChange={(v) =>
            setForm((p) => ({
              ...p,
              department: v,
              band_id: p.user_type === "INTERN" ? internBandId : 0,
              role: "",
            }))
          }
        />
        {form.user_type !== "CONSULTANT" ? (
          form.user_type === "INTERN" ? (
            <DropdownSelectField
              label="Band"
              required
              placeholder={!form.department.trim() ? "Select Department First" : "Select"}
              value={form.department.trim() && form.band_id > 0 ? String(form.band_id) : ""}
              disabled
              options={
                form.band_id > 0
                  ? [{ value: String(form.band_id), label: internBandLabel || "B8 - Intern" }]
                  : []
              }
              onChange={() => {}}
            />
          ) : (
            <DropdownSelectField
              label="Band"
              required
              placeholder={
                !form.department.trim()
                  ? "Select Department First"
                  : bandOptions.length
                    ? "Select"
                    : "No Bands Available"
              }
              value={form.band_id ? String(form.band_id) : ""}
              disabled={!form.department.trim() || !bandOptions.length}
              options={bandOptions}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  band_id: Number(v) || 0,
                  role: "",
                }))
              }
            />
          )
        ) : null}
        <DropdownSelectField
          label="Designation"
          required
          value={form.role}
          loading={designationLoading}
          loadingLabel="Loading designations…"
          placeholder={
            !form.department.trim()
              ? "Select Department First"
              : isConsultant
                ? designationLoading
                  ? "Loading Designations…"
                  : designationOptions.length
                    ? "Select"
                    : consultantDesignationBandIds?.length
                      ? "No Designations For This Department"
                      : "No Bands Available"
                : designationBandId <= 0
                  ? "Select Department And Band First"
                  : designationLoading
                    ? "Loading Designations…"
                    : designationOptions.length
                      ? "Select"
                      : "No Designations For This Band"
          }
          disabled={
            !form.department.trim() ||
            designationLoading ||
            !designationOptions.length ||
            (!isConsultant && designationBandId <= 0)
          }
          options={designationOptions}
          onChange={(role) => setForm((p) => ({ ...p, role }))}
          error={designationFieldError}
        />
        <DropdownSelectField
          label="Work Mode"
          required
          placeholder="Select"
          value={form.work_mode}
          options={options.work_modes}
          onChange={(v) => setForm((p) => ({ ...p, work_mode: v }))}
        />
        <DropdownSelectField
          label="Work Location"
          required
          placeholder="Select"
          value={form.work_location_type}
          options={options.work_location_types}
          onChange={(v) => setForm((p) => ({ ...p, work_location_type: v }))}
        />
        <DropdownSelectField
          label="Category"
          required
          placeholder="Select"
          value={form.category}
          options={options.categories}
          onChange={(v) => setForm((p) => ({ ...p, category: v }))}
        />
        <DropdownSelectField
          label="Reporting Manager"
          required
          placeholder={
            reportingManagerOptions.length ? "Select" : "No Employees Available"
          }
          value={form.reporting_manager_id}
          disabled={!reportingManagerOptions.length}
          options={reportingManagerOptions}
          onChange={(v) => setForm((p) => ({ ...p, reporting_manager_id: v }))}
        />
        {form.user_type === "INTERN" ? (
          <>
            <DatePickerField
              label="Date of Internship"
              required
              value={form.doi}
              onChange={(v) => setForm((p) => ({ ...p, doi: v }))}
            />
            <InputField
              label="Internship Duration (Months)"
              required
              value={form.internship_duration}
              onChange={(v) => setForm((p) => ({ ...p, internship_duration: v.replace(/\D/g, "") }))}
            />
          </>
        ) : (
          <DatePickerField
            label="Date of Joining"
            required
            value={form.doj}
            onChange={(v) => setForm((p) => ({ ...p, doj: v }))}
          />
        )}
            </div>

            <div className={CARD_FORM_ACTIONS_CLASS}>
              <Button
                variant="brand"
                type="button"
                className="px-3 py-2"
                disabled={actionLoading}
                onClick={submit}
              >
                Create And Invite Employee
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
