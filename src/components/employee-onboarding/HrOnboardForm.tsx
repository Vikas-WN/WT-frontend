"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useId } from "react";
import { hrmsService } from "@/services/hrms.service";
import { FieldLabel, InputField, SelectField, DropdownSelectField, DatePickerField } from "@/components/dashboard/ui/forms";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CARD_FORM_GRID_CLASS, CARD_FORM_ACTIONS_CLASS, FORM_FIELD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { FormGridSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { isValidPersonName } from "@/utils/dashboard/validation";
import {
  bandDisplayLabel,
  bandSelectOptionsForUserType,
  bandsForDepartment,
  internBandDisplayLabel,
  resolveInternBandId,
} from "@/utils/dashboard/validation";
import { parseApiDate } from "@/utils/apiDate";
import { parseDesignationList } from "@/utils/masters";
import type { OnboardFormState } from "@/utils/onboardFormState";
import type { OnboardOptionsResponse } from "@/types/onboard-options";
import { PORTAL_ROLE_SELECT_OPTIONS } from "@/utils/roles";

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

const EMPLOYEE_ID_HINT =
  "Only letters and numbers are allowed (no spaces or special characters).";

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

function validateWorkStep(form: OnboardFormState, internBandId: number, defaultConsultantBandId: number) {
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
  if (!form.user_type) throw new Error("User Type is required.");
  if (!department) throw new Error("Department is required.");
  if (!role) {
    throw new Error(" No designation configured for the selected band");
  }
  if (!form.work_mode) throw new Error("Work Mode is required.");
  if (!form.work_location_type) throw new Error("Work Location is required.");
  if (!form.category) throw new Error("Category is required.");
  if (!Number.isFinite(reportingManagerId) || reportingManagerId <= 0) {
    throw new Error("Reporting Manager is required.");
  }
  if (!isValidPersonName(name)) {
    throw new Error("Name should be 2–120 characters and contain letters (and spaces) only.");
  }

  const bandId =
    form.user_type === "CONSULTANT"
      ? defaultConsultantBandId
      : form.user_type === "INTERN"
        ? internBandId
        : Number(form.band_id);
  if (!Number.isFinite(bandId) || bandId <= 0) {
    throw new Error("Please select a valid Band.");
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

  return { empId, email, name, department, role, bandId, reportingManagerId };
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
  const internBandId = useMemo(() => resolveInternBandId(bands), [bands]);
  const defaultConsultantBandId = useMemo(() => {
    const first = bands[0];
    const id = first?.id != null ? Number(first.id) : NaN;
    return Number.isFinite(id) && id > 0 ? id : 0;
  }, [bands]);

  const bandOptions = useMemo(
    () => bandSelectOptionsForUserType(bands, form.department, form.user_type, internBandId),
    [bands, form.department, form.user_type, internBandId]
  );

  const internBandLabel = useMemo(
    () => internBandDisplayLabel(bands, internBandId),
    [bands, internBandId]
  );

  const departmentBands = useMemo(
    () => bandsForDepartment(bands, form.department),
    [bands, form.department]
  );

  const designationBandId = useMemo(() => {
    if (form.user_type === "CONSULTANT") return defaultConsultantBandId;
    if (form.user_type === "INTERN") return internBandId;
    return Number(form.band_id);
  }, [defaultConsultantBandId, form.band_id, form.user_type, internBandId]);

  const reportingManagerOptions = useMemo(
    () =>
      options.reporting_managers.map((rm) => ({
        ...rm,
        label: rm.label.length > 72 ? `${rm.label.slice(0, 72)}…` : rm.label,
      })),
    [options.reporting_managers]
  );

  const department = form.department.trim();
  const designationsQ = useQuery({
    queryKey: ["masters", "designations", department, designationBandId],
    enabled: designationBandId > 0 && Boolean(department),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const res = await hrmsService.searchDesignations({
        band_id: designationBandId,
        department,
      });
      return parseDesignationList(res).map((item) => ({
        value: item.name,
        label: item.name,
      }));
    },
  });

  const designationOptions = designationsQ.data ?? [];
  const designationLoading = designationsQ.isLoading || designationsQ.isFetching;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!designationsQ.isError) return;
    onErrorRef.current(
      designationsQ.error instanceof Error
        ? designationsQ.error.message
        : "Could not load designations for this band."
    );
  }, [designationsQ.isError, designationsQ.error]);

  useEffect(() => {
    if (form.user_type !== "INTERN" || internBandId <= 0) return;
    setForm((prev) => (prev.band_id === internBandId ? prev : { ...prev, band_id: internBandId }));
  }, [form.user_type, internBandId, setForm]);

  useEffect(() => {
    if (designationLoading) return;
    if (designationOptions.length === 1) {
      const onlyRole = designationOptions[0]?.value ?? "";
      if (onlyRole && form.role !== onlyRole) {
        setForm((prev) => ({ ...prev, role: onlyRole }));
      }
      return;
    }
    if (!form.role) return;
    const validRoles = new Set(designationOptions.map((option) => option.value).filter(Boolean));
    if (designationOptions.length > 0 && !validRoles.has(form.role)) {
      setForm((prev) => ({ ...prev, role: "" }));
    }
  }, [designationOptions, designationLoading, form.role, setForm]);

  useEffect(() => {
    if (!form.department.trim()) return;
    if (form.user_type === "INTERN") return;
    const currentBandId = Number(form.band_id);
    if (!currentBandId) return;
    const stillValid = departmentBands.some((row) => Number(row.id) === currentBandId);
    if (!stillValid) {
      setForm((prev) => ({ ...prev, band_id: 0, role: "" }));
    }
  }, [departmentBands, form.band_id, form.department, form.user_type, setForm]);

  function submit() {
    if (designationLoading) {
      onError("Designations are still loading. Please wait a moment.");
      return;
    }
    if (!designationOptions.length) {
      onError(
        "No designation is configured for the selected band. Please choose a different department or band."
      );
      return;
    }

    void runAction("Create And Invite Employee", async () => {
      const { empId, email, name, department, role, bandId, reportingManagerId } = validateWorkStep(
        form,
        internBandId,
        defaultConsultantBandId
      );

      const basePayload: Record<string, unknown> = {
        emp_id: empId,
        email,
        name,
        user_type: form.user_type,
        department,
        role,
        portal_role: form.portal_role || "ROLE_EMPLOYEE",
        band_id: bandId,
        work_mode: form.work_mode,
        work_location_type: form.work_location_type,
        category: form.category,
        reporting_manager_id: reportingManagerId,
        ...(form.holiday_calendar_id.trim()
          ? { holiday_calendar_id: Number(form.holiday_calendar_id) }
          : {}),
      };
      if (form.holiday_calendar_id.trim()) {
        const calendarId = Number(form.holiday_calendar_id.trim());
        if (Number.isFinite(calendarId) && calendarId > 0) {
          basePayload.holiday_calendar_id = calendarId;
        }
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
        <DropdownSelectField
          label="User Type"
          required
          placeholder="Select"
          value={form.user_type}
          options={options.user_types}
          onChange={(v) =>
            setForm((p) => {
              const ut = v as "FULLTIME" | "INTERN" | "CONSULTANT";
              if (ut === "INTERN") {
                return { ...p, user_type: ut, band_id: internBandId, role: "" };
              }
              return { ...p, user_type: ut, role: "" };
            })
          }
        />
        <DropdownSelectField
          label="Portal Role"
          required
          placeholder="Select"
          value={form.portal_role || "ROLE_EMPLOYEE"}
          options={[...PORTAL_ROLE_SELECT_OPTIONS]}
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
            !form.department.trim() || designationBandId <= 0
              ? "Select Department And Band First"
              : designationLoading
                ? "Loading Designations…"
                : designationOptions.length
                  ? "Select"
                  : "No Designations For This Band"
          }
          disabled={
            !form.department.trim() ||
            designationBandId <= 0 ||
            designationLoading ||
            !designationOptions.length
          }
          options={designationOptions}
          onChange={(role) => setForm((p) => ({ ...p, role }))}
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
          className="[&_[data-slot=select-content]]:max-w-[min(calc(100vw-2rem),28rem)] [&_[data-slot=select-item]]:max-w-full [&_[data-slot=select-item]_span]:truncate"
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
