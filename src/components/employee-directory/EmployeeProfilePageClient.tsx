"use client";

import { Button } from "@/components/ui/button";
import { SkillRatingsListInput } from "@/components/dashboard/ui/SkillRatingsListInput";
import {
  ProfileDetailsSkeleton,
  ProfileHeaderSkeleton,
} from "@/components/dashboard/ui/SectionSkeleton";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { HARDCODED_DEPARTMENT_OPTIONS } from "@/constants/dashboard";
import { useEmployeeDirectoryAccess } from "@/hooks/employee-directory/useEmployeeDirectoryAccess";
import {
  useEmployeeProfile,
  useUpdateEmployeeProfile,
} from "@/hooks/employee-directory/useEmployeeProfile";
import { hrmsService } from "@/services/hrms.service";
import { toPagedRows, toRows } from "@/utils/apiRows";
import { useEmployeeResumes } from "@/hooks/resumes/useEmployeeResumes";
import {
  cleanEmployeeName,
  editFormToUpdatePayload,
  formatProfileDisplayValue,
  pickDesignationForDisplay,
  pickProfileField,
  profileToEditForm,
  rowEmail,
  type EmployeeProfileEditForm,
} from "@/utils/employeeDirectory";
import { validateWorkEmail } from "@/utils/personalEmail";
import { useDesignationSelectOptions } from "@/hooks/useDesignationSelectOptions";
import { useOnboardOptions } from "@/hooks/useOnboardOptions";
import {
  bandDisplayLabel,
  bandSelectOptions,
  bandsForDepartment,
  isInternOnlyBand,
  isValidPersonName,
  designationLengthError,
} from "@/utils/dashboard/validation";
import {
  PHONE_COUNTRY_OPTIONS,
  defaultPhoneCountryIso,
  digitsOnly,
  validatePhoneNumber,
} from "@/utils/phoneCountries";
import {
  buildResumeShareLinkIndex,
  lookupResumeShareLink,
} from "@/utils/employeeResume";
import { canFetchEmployeeResumeApi, pickPortalRoles } from "@/utils/roles";
import { normalizeEmployeeStatusKey, isServingNoticeUserStatus } from "@/utils/userStatus";
import { useAuth } from "@/context/AuthContext";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useDashboardAction } from "@/components/dashboard/shared/useDashboardAction";
import { AdaptiveSelectField, DatePickerField, InputField } from "@/components/dashboard/ui/forms";
import { FALLBACK_ONBOARD_OPTIONS } from "@/utils/onboardFormOptions";
import { FormActionBar } from "@/components/dashboard/ui/FormActionBar";
import { FormSection, FormSubsection } from "@/components/dashboard/ui/FormSection";
import { EmployeeProfileHeaderCard } from "@/components/employee-directory/EmployeeProfileHeaderCard";
import { EmployeeProfileView } from "@/components/employee-directory/EmployeeProfileView";
import { EmployeePortalRoleSelect } from "@/components/employee-directory/EmployeePortalRoleSelect";
import { IconPencil } from "@/components/employee-directory/employeeDirectoryIcons";
import { buildProfileRowsFromEmployeeAllocations, formatCurrentAllocationSummary, selectProfileAllocationRows } from "@/utils/dashboard/projects";
import { isSystemProjectAllocationRow } from "@/utils/allocationList";
import { showErrorToast } from "@/lib/toast";
import { compareApiDates } from "@/utils/apiDate";
import {
  defaultLastWorkingDayFromResignation,
  previousWeekdayOrSame,
} from "@/utils/offboardingFormState";
const WORK_MODES = ["WFO", "WFH", "HYBRID"];
const WORK_LOCATIONS = ["OFFSHORE", "ONSITE", "HYBRID", "REMOTE"];
const USER_STATUSES = ["ACTIVE", "INACTIVE", "PENDING", "ONBOARDING", "INVITED", "SERVING_NOTICE"];

/** Validate exit dates when HR moves an employee onto Serving Notice from the profile editor. */
function servingNoticeExitDateError(resignationDate: string, lastWorkingDay: string): string | null {
  const resignation = resignationDate.trim();
  const lwd = lastWorkingDay.trim();
  if (!resignation && !lwd) {
    return "Resignation Date and Last Working Day are required before changing status to Serving Notice Period.";
  }
  if (!resignation) return "Resignation Date is required.";
  if (!lwd) return "Last Working Day is required.";
  if (compareApiDates(resignation, lwd) > 0) {
    return "Resignation Date must be on or before Last Working Day.";
  }
  return null;
}

type BandOption = { value: string; label: string };

function ViewOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium leading-none text-wt-text">{label}</span>
      <div className="flex h-11 items-center rounded-xl border border-dashed border-wt-border bg-wt-surface-2/60 px-3.5 text-sm text-wt-text">
        <span className="min-w-0 truncate">{value.trim() || "—"}</span>
        <span className="ml-auto shrink-0 rounded-md bg-wt-surface-3 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-wt-text-muted">
          View only
        </span>
      </div>
      {hint ? <p className="text-xs text-wt-text-muted">{hint}</p> : null}
    </div>
  );
}

export function EmployeeProfilePageClient() {
  const params = useParams();
  const empId = decodeURIComponent(String(params?.empId ?? "").trim());
  const { user } = useAuth();
  const {
    authStatus,
    canView: canViewProfile,
    canEditProfile,
    canEdit: canEditDirectory,
    canEditProfileStatusOnly,
    canOpenProfileEditor,
    queriesEnabled,
    roles,
  } = useEmployeeDirectoryAccess();
  const { actionLoading, runAction } = useDashboardAction();
  const { data: profile, isLoading, isError, error, refetch } = useEmployeeProfile(empId, {
    enabled: queriesEnabled,
  });
  const { data: resumePayload } = useEmployeeResumes({
    enabled: queriesEnabled && canFetchEmployeeResumeApi(roles),
  });
  const updateMutation = useUpdateEmployeeProfile(empId);

  const statusOnlyEdit = canEditProfileStatusOnly && !canEditProfile;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EmployeeProfileEditForm | null>(null);
  const [bandRows, setBandRows] = useState<Array<Record<string, unknown>>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [allocationRows, setAllocationRows] = useState<Array<Record<string, unknown>>>([]);
  const [allocationsLoading, setAllocationsLoading] = useState(false);
  const { data: onboardOptions, isLoading: onboardOptionsLoading } = useOnboardOptions(
    queriesEnabled && isEditing && canEditProfile
  );

  const primarySkillOptions = useMemo(() => {
    const options = onboardOptions?.primary_skills?.length
      ? onboardOptions.primary_skills
      : FALLBACK_ONBOARD_OPTIONS.primary_skills;
    return options.map((option) => ({ value: option.value, label: option.label }));
  }, [onboardOptions?.primary_skills]);

  const primarySkillLookup = useMemo(
    () => new Map(primarySkillOptions.map((option) => [option.value.toLowerCase(), option.value])),
    [primarySkillOptions]
  );
  const normalizePrimarySkills = (skills: EmployeeProfileEditForm["primary_skills"]) => {
    const normalizedSkills: EmployeeProfileEditForm["primary_skills"] = [];
    for (const item of skills) {
      const skillName = String(item.skill ?? "").trim();
      if (!skillName) continue;
      const canonicalSkill = primarySkillLookup.get(skillName.toLowerCase());
      if (!canonicalSkill) {
        throw new Error("Selected primary skills must come from the predefined list.");
      }
      if (!normalizedSkills.some((existing) => existing.skill === canonicalSkill)) {
        normalizedSkills.push({ ...item, skill: canonicalSkill });
      }
    }
    return normalizedSkills;
  };
  const profileRecord = profile ?? {};
  const displayName = cleanEmployeeName(profileRecord) || "Employee";
  const department = String(pickProfileField(profileRecord, ["department"]) ?? "").trim();
  const email = String(pickProfileField(profileRecord, ["email"]) ?? "").trim();
  const isOwnProfile = Boolean(
    email && user?.email && email.trim().toLowerCase() === user.email.trim().toLowerCase()
  );
  /** HR/Admin must not change org-admin fields on their own directory profile. */
  const adminFieldsLocked = isOwnProfile;
  const selfAdminLockHint =
    "HR-controlled field — ask another HR or Admin to change this on your profile.";
  const phone = formatProfileDisplayValue(
    pickProfileField(profileRecord, ["phone_number", "phoneNumber"])
  );
  const profileUserId = String(
    profileRecord.user_id ?? profileRecord.userId ?? ""
  ).trim();
  const employeeRole = pickDesignationForDisplay(profileRecord);
  const isFulltimeEmployee =
    String(pickProfileField(profileRecord, ["user_type", "userType"]) ?? "")
      .toUpperCase()
      .replace(/[\s\-_]/g, "") === "FULLTIME";
  const isConsultantEmployee =
    String(pickProfileField(profileRecord, ["user_type", "userType"]) ?? "")
      .toUpperCase()
      .replace(/[\s\-_]/g, "") === "CONSULTANT";
  const currentProfileStatus = String(
    pickProfileField(profileRecord, ["user_status", "status", "userStatus"]) ?? ""
  ).trim();
  const transitioningToServingNotice =
    Boolean(editForm) &&
    isServingNoticeUserStatus(editForm?.user_status) &&
    !isServingNoticeUserStatus(currentProfileStatus);

  const resumeShareHref = useMemo(() => {
    const index = buildResumeShareLinkIndex(resumePayload?.rows ?? []);
    return lookupResumeShareLink(index, {
      empId,
      userId: String(profileRecord.user_id ?? profileRecord.userId ?? "").trim(),
      email: rowEmail(profileRecord),
    });
  }, [resumePayload, empId, profileRecord]);
  const empIdDisplay = formatProfileDisplayValue(
    pickProfileField(profileRecord, ["emp_id", "empId"])
  );

  useEffect(() => {
    if (!isEditing || !canEditProfile) return;
    let cancelled = false;
    void (async () => {
      try {
        const [bandsRes, departmentsRes] = await Promise.all([
          hrmsService.getBands(),
          hrmsService.getDepartments(),
        ]);
        if (cancelled) return;
        const rows = toRows((bandsRes as { data?: unknown }).data ?? bandsRes);
        setBandRows(rows);

        let departments = Array.from(
          new Set(
            toPagedRows((departmentsRes as { data?: unknown }).data ?? departmentsRes)
              .map((row) =>
                String(
                  row.department ??
                    row.department_name ??
                    row.departmentName ??
                    row.name ??
                    row.value ??
                    ""
                ).trim()
              )
              .filter((value) => Boolean(value))
          )
        ).sort();

        if (!departments.length) {
          departments = Array.from(
            new Set(
              rows
                .map((row) => String(row.stream ?? row.department ?? "").trim())
                .filter((value) => Boolean(value))
            )
          ).sort();
        }

        setDepartmentOptions(
          Array.from(new Set([...HARDCODED_DEPARTMENT_OPTIONS, ...departments])).sort()
        );
      } catch {
        if (!cancelled) {
          setBandRows([]);
          setDepartmentOptions([...HARDCODED_DEPARTMENT_OPTIONS]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditing, canEditProfile]);

  useEffect(() => {
    if (!queriesEnabled || isLoading || !email.trim()) {
      setAllocationRows([]);
      return;
    }
    let cancelled = false;
    setAllocationsLoading(true);
    void (async () => {
      try {
        const res = await hrmsService.getEmployeeAllocations({
          userEmail: email.trim(),
          scope: "current_and_future",
        });
        if (cancelled) return;
        const rows = selectProfileAllocationRows(
          buildProfileRowsFromEmployeeAllocations(res.data ?? res).filter(
            (row) => !isSystemProjectAllocationRow(row)
          )
        );
        setAllocationRows(rows);
      } catch {
        if (!cancelled) setAllocationRows([]);
      } finally {
        if (!cancelled) setAllocationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queriesEnabled, isLoading, email, empId]);

  const bandSelectOptionsList = useMemo(() => {
    const dept = editForm?.department?.trim() ?? "";
    let filtered = bandsForDepartment(bandRows, dept);
    if (isFulltimeEmployee) {
      filtered = filtered.filter((row) => !isInternOnlyBand(bandDisplayLabel(row)));
    }
    const options: BandOption[] = bandSelectOptions(filtered);
    const currentId = editForm?.band_id?.trim();
    if (currentId && !options.some((band) => band.value === currentId)) {
      const bandName = String(
        pickProfileField(profileRecord, ["band", "band_name", "bandName"]) ?? ""
      ).trim();
      options.unshift({ value: currentId, label: bandName || currentId });
    }
    return options;
  }, [bandRows, editForm?.band_id, editForm?.department, profileRecord, isFulltimeEmployee]);

  const bandSelectValue = editForm?.band_id?.trim() ?? "";
  const designationBandId = Number(bandSelectValue) || 0;
  const departmentForDesignations = editForm?.department?.trim() ?? "";

  /** Consultants have no band — union designations across non-intern bands for the department. */
  const consultantDesignationBandIds = useMemo(() => {
    if (!isConsultantEmployee) return undefined;
    const dept = editForm?.department?.trim() ?? "";
    if (!dept) return [];
    return bandsForDepartment(bandRows, dept)
      .filter((row) => !isInternOnlyBand(bandDisplayLabel(row)))
      .map((row) => Number(row.id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }, [isConsultantEmployee, editForm?.department, bandRows]);

  const {
    options: designationOptions,
    loading: designationLoading,
  } = useDesignationSelectOptions(
    departmentForDesignations,
    isConsultantEmployee ? 0 : designationBandId,
    consultantDesignationBandIds
  );

  useEffect(() => {
    if (!isEditing || !editForm || isConsultantEmployee) return;
    const dept = editForm.department.trim();
    if (!dept) return;
    const currentBandId = editForm.band_id.trim();
    if (!currentBandId) return;
    const stillValid = bandSelectOptionsList.some((option) => option.value === currentBandId);
    if (!stillValid) {
      setEditForm((prev) => (prev ? { ...prev, band_id: "", role: "" } : prev));
    }
  }, [bandSelectOptionsList, editForm, isEditing, isConsultantEmployee]);

  useEffect(() => {
    if (!isEditing || designationLoading) return;
    if (designationOptions.length === 1) {
      const onlyRole = designationOptions[0]?.value ?? "";
      if (!onlyRole) return;
      setEditForm((prev) => {
        if (!prev) return prev;
        return prev.role === onlyRole ? prev : { ...prev, role: onlyRole };
      });
      return;
    }
    setEditForm((prev) => {
      if (!prev || !prev.role) return prev;
      const validRoles = new Set(designationOptions.map((option) => option.value).filter(Boolean));
      if (designationOptions.length > 0 && !validRoles.has(prev.role)) {
        return { ...prev, role: "" };
      }
      return prev;
    });
  }, [designationOptions, designationLoading, isEditing]);

  const departmentSelectOptions = useMemo(() => {
    const deps = [...departmentOptions];
    const current = editForm?.department?.trim();
    if (current && !deps.includes(current)) deps.unshift(current);
    return deps;
  }, [departmentOptions, editForm?.department]);

  const workModeOptions = useMemo(() => {
    const current = editForm?.work_mode?.trim();
    if (current && !WORK_MODES.includes(current)) {
      return [current, ...WORK_MODES];
    }
    return WORK_MODES;
  }, [editForm?.work_mode]);

  const openEditor = () => {
    const next = profileToEditForm(profileRecord);
    // Band is not applicable for consultants — keep the edit form empty for that field.
    if (isConsultantEmployee) next.band_id = "";
    setEditForm(next);
    setIsEditing(true);
  };

  const cancelEditor = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const saveProfile = () => {
    if (!editForm || !empId) return;
    const lengthError = designationLengthError(editForm.role);
    if (!statusOnlyEdit && lengthError) {
      showErrorToast(lengthError);
      return;
    }
    void runAction(
      statusOnlyEdit ? "Update employee status" : "Update employee profile",
      async () => {
        if (transitioningToServingNotice) {
          const exitDateError = servingNoticeExitDateError(
            editForm.resignation_date,
            editForm.last_working_day
          );
          if (exitDateError) throw new Error(exitDateError);

          const resignationDate = editForm.resignation_date.trim();
          const lastWorkingDay = editForm.last_working_day.trim();
          await hrmsService.offboardEmployee(empId, {
            resignation_date: resignationDate,
            last_working_day: lastWorkingDay,
            exit_type: "VOLUNTARY",
          });

          if (!statusOnlyEdit) {
            if (!isValidPersonName(editForm.name.trim())) {
              throw new Error("Name should be 2–120 characters and contain letters (and spaces) only.");
            }
            const workEmailError = validateWorkEmail(editForm.email);
            if (workEmailError) throw new Error(workEmailError);
            const phoneCountry = editForm.phone_country?.trim();
            if (!phoneCountry) throw new Error("Please select a country code.");
            const phoneError = validatePhoneNumber(phoneCountry, editForm.phone_number);
            if (phoneError) throw new Error(phoneError);
            if (designationLoading) {
              throw new Error("Designations are still loading. Please wait a moment.");
            }
            if (!editForm.role.trim()) {
              throw new Error("Designation is required.");
            }
            const designationError = designationLengthError(editForm.role);
            if (designationError) throw new Error(designationError);
            if (!designationOptions.some((option) => option.value === editForm.role.trim())) {
              throw new Error(
                isConsultantEmployee
                  ? "Selected designation is not valid for the chosen department."
                  : "Selected designation is not valid for the chosen department and band."
              );
            }
            if (onboardOptionsLoading) {
              throw new Error("Primary skills are still loading. Please wait a moment.");
            }
            const primarySkills = normalizePrimarySkills(editForm.primary_skills);
            const missingSelfRating = [...editForm.primary_skills, ...editForm.secondary_skills].filter(
              (item) => {
                if (!String(item.skill ?? "").trim()) return false;
                const rating = Number(item.self_rating);
                return !Number.isFinite(rating) || rating < 1 || rating > 5;
              }
            );
            if (missingSelfRating.length) {
              throw new Error("Each skill must have a self rating between 1 and 5.");
            }
            const normalizedEditForm = {
              ...editForm,
              primary_skills: primarySkills,
              // Status already applied by offboarding.
              user_status: "SERVING_NOTICE",
            };
            const payload = editFormToUpdatePayload(normalizedEditForm, {
              statusOnly: false,
              omitBand: isConsultantEmployee,
            });
            // Avoid a second SERVING_NOTICE transition check without attrition race.
            delete payload.user_status;
            await updateMutation.mutateAsync(payload);
          }

          await refetch();
          setIsEditing(false);
          setEditForm(null);
          return;
        }

        if (!statusOnlyEdit) {
          if (!isValidPersonName(editForm.name.trim())) {
            throw new Error("Name should be 2–120 characters and contain letters (and spaces) only.");
          }
          const workEmailError = validateWorkEmail(editForm.email);
          if (workEmailError) throw new Error(workEmailError);
          // Personal email is view-only for HR/Admin — do not validate or require it here.
          const phoneCountry = editForm.phone_country?.trim();
          if (!phoneCountry) throw new Error("Please select a country code.");
          const phoneError = validatePhoneNumber(
            phoneCountry,
            editForm.phone_number
          );
          if (phoneError) throw new Error(phoneError);
          if (designationLoading) {
            throw new Error("Designations are still loading. Please wait a moment.");
          }
          if (!editForm.role.trim()) {
            throw new Error("Designation is required.");
          }
          const designationError = designationLengthError(editForm.role);
          if (designationError) throw new Error(designationError);
          if (!designationOptions.some((option) => option.value === editForm.role.trim())) {
            throw new Error(
              isConsultantEmployee
                ? "Selected designation is not valid for the chosen department."
                : "Selected designation is not valid for the chosen department and band."
            );
          }
          if (onboardOptionsLoading) {
            throw new Error("Primary skills are still loading. Please wait a moment.");
          }
          const primarySkills = normalizePrimarySkills(editForm.primary_skills);
          const missingSelfRating = [...editForm.primary_skills, ...editForm.secondary_skills].filter(
            (item) => {
              if (!String(item.skill ?? "").trim()) return false;
              const rating = Number(item.self_rating);
              return !Number.isFinite(rating) || rating < 1 || rating > 5;
            }
          );
          if (missingSelfRating.length) {
            throw new Error("Each skill must have a self rating between 1 and 5.");
          }
          const normalizedEditForm = { ...editForm, primary_skills: primarySkills };
          await updateMutation.mutateAsync(
            editFormToUpdatePayload(normalizedEditForm, {
              statusOnly: statusOnlyEdit,
              omitBand: isConsultantEmployee,
            })
          );
          await refetch();
          setIsEditing(false);
          setEditForm(null);
          return;
        }
        await updateMutation.mutateAsync(
          editFormToUpdatePayload(editForm, {
            statusOnly: statusOnlyEdit,
            omitBand: isConsultantEmployee,
          })
        );
        await refetch();
        setIsEditing(false);
        setEditForm(null);
      }
    );
  };

  if (authStatus !== "loading" && !canViewProfile) {
    return (
      <DashboardPageShell>
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 shadow-sm">
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="mt-2 text-sm text-wt-text-muted">
            Employee profiles in the directory are available to HR and admin users only.
          </p>
          <Link href={DASHBOARD_ROUTES.profile} className="mt-4 inline-block text-sm text-[var(--wt-brand)] hover:underline">
            Back To Home
          </Link>
        </div>
      </DashboardPageShell>
    );
  }

  if (!empId) {
    return (
      <DashboardPageShell>
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 text-sm text-wt-text-muted shadow-sm">
          Invalid employee ID.
          <Link href={DASHBOARD_ROUTES["employee-directory"]} className="ml-2 text-[var(--wt-brand)] hover:underline">
            Back to directory
          </Link>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell className="employee-profile-page">
      <div className="employee-profile-scroll-root w-full">
        <Link
          href={DASHBOARD_ROUTES["employee-directory"]}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--wt-brand)] hover:underline"
        >
          ← Back to directory
        </Link>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            <ProfileHeaderSkeleton />
            <ProfileDetailsSkeleton rows={10} />
          </div>
        ) : null}

        {isError ? (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p>Could not load profile.{error instanceof Error ? ` ${error.message}` : ""}</p>
            <Button
              variant="ghost"
              size="xs"
              type="button"
              className="mt-3 px-3 py-1.5 text-xs"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="mt-6 space-y-4">
            {isEditing && editForm ? (
              <div className="space-y-6">
                <EmployeeProfileHeaderCard
                  profile={profileRecord}
                  displayName={displayName}
                  designation={employeeRole}
                  department={department}
                  empId={empIdDisplay}
                  email={email}
                  phone={phone}
                  resumeShareHref={resumeShareHref}
                  editModeLabel="Edit Mode"
                />

                {(() => {
                  const saving = actionLoading || updateMutation.isPending;
                  return (
                <>
                {statusOnlyEdit ? (
                  <FormSection
                    title="Employee Status"
                    description={
                      adminFieldsLocked
                        ? "You cannot change your own account status. Ask another HR or Admin user."
                        : "Update the employee account status. Other profile fields cannot be changed from this role."
                    }
                  >
                    <div className={transitioningToServingNotice ? "max-w-xl" : "max-w-sm"}>
                      {adminFieldsLocked ? (
                        <ViewOnlyField
                          label="Status"
                          value={editForm.user_status}
                          hint={selfAdminLockHint}
                        />
                      ) : (
                        <AdaptiveSelectField
                          label="Status"
                          required
                          value={editForm.user_status}
                          options={USER_STATUSES}
                          onChange={(v) => setEditForm({ ...editForm, user_status: v })}
                          disabled={saving}
                        />
                      )}
                      {transitioningToServingNotice ? (
                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <DatePickerField
                            label="Resignation Date"
                            required
                            value={editForm.resignation_date}
                            onChange={(v) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      resignation_date: v,
                                      last_working_day: v.trim()
                                        ? defaultLastWorkingDayFromResignation(v)
                                        : "",
                                    }
                                  : prev
                              )
                            }
                            disabled={saving}
                          />
                          <DatePickerField
                            label="Last Working Day"
                            required
                            value={editForm.last_working_day}
                            onChange={(v) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, last_working_day: previousWeekdayOrSame(v) }
                                  : prev
                              )
                            }
                            disabled={saving}
                          />
                          <p className="sm:col-span-2 text-xs text-wt-text-muted">
                            Resignation Date and Last Working Day are mandatory when moving an
                            employee to Serving Notice Period.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </FormSection>
                ) : (
                  <FormSection
                    title="Information"
                    description={
                      adminFieldsLocked
                        ? "Department, band, designation, and other HR-controlled fields are view-only on your own profile."
                        : "Employment details, department, and work arrangement."
                    }
                  >
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                      <InputField
                        label="Name"
                        required
                        value={editForm.name}
                        onChange={(v) => setEditForm({ ...editForm, name: v })}
                        disabled={saving}
                      />
                      {adminFieldsLocked ? (
                        <ViewOnlyField
                          label="Work Email"
                          value={editForm.email}
                          hint={selfAdminLockHint}
                        />
                      ) : (
                        <InputField
                          label="Work Email"
                          type="email"
                          required
                          value={editForm.email}
                          onChange={(v) => setEditForm({ ...editForm, email: v })}
                          disabled={saving}
                        />
                      )}
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium leading-none text-wt-text">
                          Personal Email
                        </span>
                        <div className="flex h-11 items-center rounded-xl border border-dashed border-wt-border bg-wt-surface-2/60 px-3.5 text-sm text-wt-text">
                          <span className="min-w-0 truncate">
                            {editForm.personal_email.trim() || "Not provided"}
                          </span>
                          <span className="ml-auto shrink-0 rounded-md bg-wt-surface-3 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-wt-text-muted">
                            View only
                          </span>
                        </div>
                        <p className="text-xs text-wt-text-muted">
                          Employees manage their personal email — HR/Admin can view it only.
                        </p>
                      </div>
                      <AdaptiveSelectField
                        label="Country Code"
                        required
                        value={editForm.phone_country ?? defaultPhoneCountryIso()}
                        placeholder="Select Country Code"
                        searchPlaceholder="Search Country Code…"
                        options={PHONE_COUNTRY_OPTIONS}
                        onChange={(v) => setEditForm({ ...editForm, phone_country: v })}
                        disabled={saving}
                      />
                      <InputField
                        label="Phone Number"
                        type="tel"
                        required
                        value={editForm.phone_number}
                        onChange={(v) => setEditForm({ ...editForm, phone_number: digitsOnly(v) })}
                        disabled={saving}
                      />
                      {adminFieldsLocked ? (
                        <ViewOnlyField
                          label="Department"
                          value={editForm.department}
                          hint={selfAdminLockHint}
                        />
                      ) : (
                        <AdaptiveSelectField
                          label="Department"
                          required
                          value={editForm.department}
                          placeholder="Select Department"
                          searchPlaceholder="Search Departments…"
                          options={departmentSelectOptions}
                          onChange={(v) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, department: v, band_id: "", role: "" } : prev
                            )
                          }
                          disabled={saving}
                        />
                      )}
                      {adminFieldsLocked ? (
                        <ViewOnlyField
                          label="Status"
                          value={editForm.user_status}
                          hint={selfAdminLockHint}
                        />
                      ) : (
                        <AdaptiveSelectField
                          label="Status"
                          required
                          value={editForm.user_status}
                          options={USER_STATUSES}
                          onChange={(v) => setEditForm({ ...editForm, user_status: v })}
                          disabled={saving}
                        />
                      )}
                      {transitioningToServingNotice ? (
                        <>
                          <DatePickerField
                            label="Resignation Date"
                            required
                            value={editForm.resignation_date}
                            onChange={(v) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      resignation_date: v,
                                      last_working_day: v.trim()
                                        ? defaultLastWorkingDayFromResignation(v)
                                        : "",
                                    }
                                  : prev
                              )
                            }
                            disabled={saving}
                          />
                          <DatePickerField
                            label="Last Working Day"
                            required
                            value={editForm.last_working_day}
                            onChange={(v) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, last_working_day: previousWeekdayOrSame(v) }
                                  : prev
                              )
                            }
                            disabled={saving}
                          />
                          <p className="sm:col-span-2 text-xs text-wt-text-muted">
                            Resignation Date and Last Working Day are mandatory when moving an
                            employee to Serving Notice Period.
                          </p>
                        </>
                      ) : null}
                      {adminFieldsLocked ? (
                        <ViewOnlyField
                          label="Work Mode"
                          value={editForm.work_mode}
                          hint={selfAdminLockHint}
                        />
                      ) : (
                        <AdaptiveSelectField
                          label="Work Mode"
                          required
                          value={editForm.work_mode}
                          options={workModeOptions}
                          onChange={(v) => setEditForm({ ...editForm, work_mode: v })}
                          disabled={saving}
                        />
                      )}
                      {adminFieldsLocked ? (
                        <ViewOnlyField
                          label="Work Location"
                          value={editForm.work_location_type}
                          hint={selfAdminLockHint}
                        />
                      ) : (
                        <AdaptiveSelectField
                          label="Work Location"
                          required
                          value={editForm.work_location_type}
                          options={WORK_LOCATIONS}
                          onChange={(v) => setEditForm({ ...editForm, work_location_type: v })}
                          disabled={saving}
                        />
                      )}
                      {!isConsultantEmployee ? (
                        adminFieldsLocked ? (
                          <ViewOnlyField
                            label="Band"
                            value={
                              bandSelectOptionsList.find((o) => o.value === bandSelectValue)?.label ??
                              bandSelectValue
                            }
                            hint={selfAdminLockHint}
                          />
                        ) : (
                          <AdaptiveSelectField
                            label="Band"
                            required
                            value={bandSelectValue}
                            placeholder={
                              !editForm.department.trim()
                                ? "Select Department First"
                                : bandSelectOptionsList.length
                                  ? "Select Band"
                                  : "No Bands Available"
                            }
                            searchPlaceholder="Search Bands…"
                            options={bandSelectOptionsList}
                            onChange={(id) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, band_id: id, role: "" } : prev
                              )
                            }
                            disabled={
                              saving || !editForm.department.trim() || !bandSelectOptionsList.length
                            }
                          />
                        )
                      ) : null}
                      {adminFieldsLocked ? (
                        <ViewOnlyField
                          label="Designation"
                          value={editForm.role}
                          hint={selfAdminLockHint}
                        />
                      ) : (
                        <AdaptiveSelectField
                          label="Designation"
                          required
                          value={editForm.role}
                          loading={designationLoading}
                          loadingLabel="Loading Designations…"
                          placeholder={
                            !editForm.department.trim()
                              ? "Select Department First"
                              : isConsultantEmployee
                                ? designationLoading
                                  ? "Loading Designations…"
                                  : designationOptions.length
                                    ? "Select Designation"
                                    : consultantDesignationBandIds?.length
                                      ? "No Designations For This Department"
                                      : "No Bands Available"
                                : designationBandId <= 0
                                  ? "Select Department And Band First"
                                  : designationLoading
                                    ? "Loading Designations…"
                                    : designationOptions.length
                                      ? "Select Designation"
                                      : "No Designations For This Band"
                          }
                          searchPlaceholder="Search Designations…"
                          options={designationOptions}
                          onChange={(role) =>
                            setEditForm((prev) => (prev ? { ...prev, role } : prev))
                          }
                          disabled={
                            saving ||
                            !editForm.department.trim() ||
                            designationLoading ||
                            !designationOptions.length ||
                            (!isConsultantEmployee && designationBandId <= 0)
                          }
                          error={designationLengthError(editForm.role)}
                        />
                      )}
                    </div>

                    <FormSubsection title="Skills">
                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                        <SkillRatingsListInput
                          label="Primary Skills"
                          hint="Optional. Add any skills and ratings you want to save."
                          value={editForm.primary_skills}
                          onChange={(skills) =>
                            setEditForm((prev) => (prev ? { ...prev, primary_skills: skills } : prev))
                          }
                          disabled={saving}
                          showWebknotRating
                          className="sm:col-span-3"
                        />
                        <SkillRatingsListInput
                          label="Secondary Skills"
                          hint="Optional. Add any supporting skills and ratings you want to save."
                          value={editForm.secondary_skills}
                          onChange={(skills) =>
                            setEditForm((prev) => (prev ? { ...prev, secondary_skills: skills } : prev))
                          }
                          disabled={saving}
                          showWebknotRating
                          className="sm:col-span-3"
                        />
                      </div>
                    </FormSubsection>
                  </FormSection>
                )}

                <FormActionBar
                  hint={
                    adminFieldsLocked
                      ? "HR-controlled fields on your own profile are view-only. Contact details and skills can still be updated."
                      : statusOnlyEdit
                        ? "Only the employee status will be updated."
                        : "Review your updates, then save to apply changes to this profile."
                  }
                  saving={saving}
                  onCancel={cancelEditor}
                  onSave={saveProfile}
                />
                </>
                );
              })()
            }
              </div>
            ) : (
              <>
              <EmployeeProfileView
                profile={profileRecord}
                displayName={displayName}
                designation={employeeRole}
                department={department}
                empId={empId}
                empIdDisplay={empIdDisplay}
                email={email}
                phone={phone}
                profileUserId={profileUserId}
                resumeShareHref={resumeShareHref}
                queriesEnabled={queriesEnabled}
                allocationRows={allocationRows}
                allocationsLoading={allocationsLoading}
                currentAllocationSummary={formatCurrentAllocationSummary(allocationRows)}
                headerAction={
                  canOpenProfileEditor ? (
                    <Button
                      variant="brand"
                      size="sm"
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm"
                      onClick={openEditor}
                    >
                      <IconPencil />
                      {statusOnlyEdit ? "Edit Status" : "Edit Profile"}
                    </Button>
                  ) : null
                }
              />
              {canEditDirectory && email ? (
                <FormSection
                  title="Portal Role"
                  description={
                    isOwnProfile
                      ? "You cannot change your own portal role. Ask another HR or Admin user."
                      : normalizeEmployeeStatusKey(
                            profileRecord.status ??
                              profileRecord.user_status ??
                              profileRecord.userStatus
                          ) === "INVITED"
                        ? "Locked while Invited — change after onboarding completes."
                        : "Set this employee's portal access role."
                  }
                  className="!p-4 sm:!p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <EmployeePortalRoleSelect
                      email={email}
                      portalRoles={pickPortalRoles(profileRecord)}
                      employeeStatus={
                        profileRecord.status ??
                        profileRecord.user_status ??
                        profileRecord.userStatus
                      }
                      canEdit={!isOwnProfile}
                    />
                  </div>
                </FormSection>
              ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </DashboardPageShell>
  );
}
