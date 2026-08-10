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
  pickEmployeeRole,
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
import { normalizeEmployeeStatusKey } from "@/utils/userStatus";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useDashboardAction } from "@/components/dashboard/shared/useDashboardAction";
import { AdaptiveSelectField, InputField } from "@/components/dashboard/ui/forms";
import { FALLBACK_ONBOARD_OPTIONS } from "@/utils/onboardFormOptions";
import { FormActionBar } from "@/components/dashboard/ui/FormActionBar";
import { FormSection, FormSubsection } from "@/components/dashboard/ui/FormSection";
import { EmployeeProfileHeaderCard } from "@/components/employee-directory/EmployeeProfileHeaderCard";
import { EmployeeProfileView } from "@/components/employee-directory/EmployeeProfileView";
import { EmployeePortalRoleSelect } from "@/components/employee-directory/EmployeePortalRoleSelect";
import { IconPencil } from "@/components/employee-directory/employeeDirectoryIcons";
import { buildProfileRowsFromEmployeeAllocations, formatCurrentAllocationSummary, selectProfileAllocationRows } from "@/utils/dashboard/projects";
import { isSystemProjectAllocationRow } from "@/utils/allocationList";
const WORK_MODES = ["WFO", "WFH", "HYBRID"];
const WORK_LOCATIONS = ["OFFSHORE", "ONSITE", "HYBRID", "REMOTE"];
const USER_STATUSES = ["ACTIVE", "INACTIVE", "PENDING", "ONBOARDING", "INVITED", "SERVING_NOTICE"];

type BandOption = { value: string; label: string };

export function EmployeeProfilePageClient() {
  const params = useParams();
  const empId = decodeURIComponent(String(params?.empId ?? "").trim());
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
  const phone = formatProfileDisplayValue(
    pickProfileField(profileRecord, ["phone_number", "phoneNumber"])
  );
  const profileUserId = String(
    profileRecord.user_id ?? profileRecord.userId ?? ""
  ).trim();
  const employeeRole = pickEmployeeRole(profileRecord);
  const isFulltimeEmployee =
    String(pickProfileField(profileRecord, ["user_type", "userType"]) ?? "")
      .toUpperCase()
      .replace(/[\s\-_]/g, "") === "FULLTIME";
  const isConsultantEmployee =
    String(pickProfileField(profileRecord, ["user_type", "userType"]) ?? "")
      .toUpperCase()
      .replace(/[\s\-_]/g, "") === "CONSULTANT";

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
  const {
    options: designationOptions,
    loading: designationLoading,
  } = useDesignationSelectOptions(departmentForDesignations, designationBandId);

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
    if (!isEditing || designationLoading || isConsultantEmployee) return;
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
  }, [designationOptions, designationLoading, isEditing, isConsultantEmployee]);

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
    void runAction(
      statusOnlyEdit ? "Update employee status" : "Update employee profile",
      async () => {
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
          if (!isConsultantEmployee && designationLoading) {
            throw new Error("Designations are still loading. Please wait a moment.");
          }
          if (!editForm.role.trim()) {
            throw new Error("Designation is required.");
          }
          if (
            !isConsultantEmployee &&
            !designationOptions.some((option) => option.value === editForm.role.trim())
          ) {
            throw new Error(
              "Selected designation is not valid for the chosen department and band."
            );
          }
          if (onboardOptionsLoading) {
            throw new Error("Primary skills are still loading. Please wait a moment.");
          }
          const primarySkills = normalizePrimarySkills(editForm.primary_skills);
          const missingSelfRating = [...editForm.primary_skills, ...editForm.secondary_skills].filter(
            (item) =>
              String(item.skill ?? "").trim() &&
              (!Number.isFinite(item.self_rating) || item.self_rating < 1 || item.self_rating > 5)
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
                    description="Update the employee account status. Other profile fields cannot be changed from this role."
                  >
                    <div className="max-w-sm">
                      <AdaptiveSelectField
                        label="Status"
                        required
                        value={editForm.user_status}
                        options={USER_STATUSES}
                        onChange={(v) => setEditForm({ ...editForm, user_status: v })}
                        disabled={saving}
                      />
                    </div>
                  </FormSection>
                ) : (
                  <FormSection
                    title="Information"
                    description="Employment details, department, and work arrangement."
                  >
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                      <InputField
                        label="Name"
                        required
                        value={editForm.name}
                        onChange={(v) => setEditForm({ ...editForm, name: v })}
                        disabled={saving}
                      />
                      <InputField
                        label="Work Email"
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(v) => setEditForm({ ...editForm, email: v })}
                        disabled={saving}
                      />
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
                      <AdaptiveSelectField
                        label="Status"
                        required
                        value={editForm.user_status}
                        options={USER_STATUSES}
                        onChange={(v) => setEditForm({ ...editForm, user_status: v })}
                        disabled={saving}
                      />
                      <AdaptiveSelectField
                        label="Work Mode"
                        required
                        value={editForm.work_mode}
                        options={workModeOptions}
                        onChange={(v) => setEditForm({ ...editForm, work_mode: v })}
                        disabled={saving}
                      />
                      <AdaptiveSelectField
                        label="Work Location"
                        required
                        value={editForm.work_location_type}
                        options={WORK_LOCATIONS}
                        onChange={(v) => setEditForm({ ...editForm, work_location_type: v })}
                        disabled={saving}
                      />
                      {!isConsultantEmployee ? (
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
                      ) : null}
                      {isConsultantEmployee ? (
                        <InputField
                          label="Designation"
                          required
                          value={editForm.role}
                          onChange={(role) =>
                            setEditForm((prev) => (prev ? { ...prev, role } : prev))
                          }
                          disabled={saving}
                        />
                      ) : (
                        <AdaptiveSelectField
                          label="Designation"
                          required
                          value={editForm.role}
                          loading={designationLoading}
                          loadingLabel="Loading Designations…"
                          placeholder={
                            !editForm.department.trim() || designationBandId <= 0
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
                            designationBandId <= 0 ||
                            designationLoading ||
                            !designationOptions.length
                          }
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
                    statusOnlyEdit
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
                    normalizeEmployeeStatusKey(
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
                      canEdit
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
