"use client";

import { Button } from "@/components/ui/button";
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
import { validatePersonalEmail, validateWorkEmail } from "@/utils/personalEmail";
import { useDesignationSelectOptions } from "@/hooks/useDesignationSelectOptions";
import { useOnboardOptions } from "@/hooks/useOnboardOptions";
import {
  bandDisplayLabel,
  bandSelectOptions,
  bandsForDepartment,
  isInternOnlyBand,
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
import { SkillsMultiSelectField } from "@/components/dashboard/ui/SkillsMultiSelectField";
import { FALLBACK_ONBOARD_OPTIONS } from "@/utils/onboardFormOptions";
import { FormActionBar } from "@/components/dashboard/ui/FormActionBar";
import { FormSection, FormSubsection } from "@/components/dashboard/ui/FormSection";
import { EmployeeProfileHeaderCard } from "@/components/employee-directory/EmployeeProfileHeaderCard";
import { EmployeeProfileView } from "@/components/employee-directory/EmployeeProfileView";
import { EmployeePortalRoleSelect } from "@/components/employee-directory/EmployeePortalRoleSelect";
import { IconPencil } from "@/components/employee-directory/employeeDirectoryIcons";
const WORK_MODES = ["WFO", "WFH", "HYBRID"];
const WORK_LOCATIONS = ["OFFSHORE", "ONSITE", "HYBRID", "REMOTE"];
const USER_STATUSES = ["ACTIVE", "INACTIVE", "PENDING", "ONBOARDING"];
const SKILL_RATINGS = ["1", "2", "3", "4", "5"];

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
  const { data: onboardOptions, isLoading: onboardOptionsLoading } = useOnboardOptions(
    queriesEnabled && isEditing && canEditProfile
  );

  const primarySkillOptions = useMemo(() => {
    const options = onboardOptions?.primary_skills?.length
      ? onboardOptions.primary_skills
      : FALLBACK_ONBOARD_OPTIONS.primary_skills;
    return options.map((option) => ({ value: option.value, label: option.label }));
  }, [onboardOptions?.primary_skills]);

  const allowedPrimarySkills = useMemo(
    () => new Set(primarySkillOptions.map((option) => option.value)),
    [primarySkillOptions]
  );
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
    if (!isEditing || !editForm) return;
    const dept = editForm.department.trim();
    if (!dept) return;
    const currentBandId = editForm.band_id.trim();
    if (!currentBandId) return;
    const stillValid = bandSelectOptionsList.some((option) => option.value === currentBandId);
    if (!stillValid) {
      setEditForm((prev) => (prev ? { ...prev, band_id: "", role: "" } : prev));
    }
  }, [bandSelectOptionsList, editForm, isEditing]);

  useEffect(() => {
    if (!isEditing || !editForm || designationLoading) return;
    if (designationOptions.length === 1) {
      const onlyRole = designationOptions[0]?.value ?? "";
      if (onlyRole && editForm.role !== onlyRole) {
        setEditForm((prev) => (prev ? { ...prev, role: onlyRole } : prev));
      }
      return;
    }
    if (!editForm.role) return;
    const validRoles = new Set(designationOptions.map((option) => option.value).filter(Boolean));
    if (designationOptions.length > 0 && !validRoles.has(editForm.role)) {
      setEditForm((prev) => (prev ? { ...prev, role: "" } : prev));
    }
  }, [designationOptions, designationLoading, editForm, isEditing]);

  useEffect(() => {
    if (!isEditing || !editForm || onboardOptionsLoading || !allowedPrimarySkills.size) return;
    const filtered = editForm.primary_skills.filter((skill) => allowedPrimarySkills.has(skill));
    if (filtered.length !== editForm.primary_skills.length) {
      setEditForm((prev) => (prev ? { ...prev, primary_skills: filtered } : prev));
    }
  }, [allowedPrimarySkills, editForm, isEditing, onboardOptionsLoading]);

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
    setEditForm(profileToEditForm(profileRecord));
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
          const workEmailError = validateWorkEmail(editForm.email);
          if (workEmailError) throw new Error(workEmailError);
          const personalError = validatePersonalEmail(editForm.email, editForm.personal_email, {
            required: false,
          });
          if (personalError) throw new Error(personalError);
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
          if (!designationOptions.some((option) => option.value === editForm.role.trim())) {
            throw new Error(
              "Selected designation is not valid for the chosen department and band."
            );
          }
          if (onboardOptionsLoading) {
            throw new Error("Primary skills are still loading. Please wait a moment.");
          }
          if (!editForm.primary_skills.length) {
            throw new Error("At least one primary skill is required.");
          }
          const invalidSkills = editForm.primary_skills.filter(
            (skill) => !allowedPrimarySkills.has(skill)
          );
          if (invalidSkills.length) {
            throw new Error("Selected primary skills must come from the predefined list.");
          }
          if (editForm.secondary_skill.trim() && !editForm.secondary_rating.trim()) {
            throw new Error("Please select a rating for the secondary skill.");
          }
        }
        await updateMutation.mutateAsync(
          editFormToUpdatePayload(editForm, { statusOnly: statusOnlyEdit })
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
                        disabled={saving || !editForm.department.trim() || !bandSelectOptionsList.length}
                      />
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
                    </div>

                    <FormSubsection title="Skills">
                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
                        <SkillsMultiSelectField
                          label="Primary Skills"
                          required
                          className="w-full max-w-sm"
                          value={editForm.primary_skills}
                          options={primarySkillOptions}
                          loading={onboardOptionsLoading}
                          loadingLabel="Loading Primary Skills…"
                          placeholder="Select Primary Skills"
                          onChange={(skills) =>
                            setEditForm((prev) => (prev ? { ...prev, primary_skills: skills } : prev))
                          }
                          disabled={saving}
                        />
                        <InputField
                          label="Secondary Skill"
                          value={editForm.secondary_skill}
                          onChange={(v) => setEditForm({ ...editForm, secondary_skill: v })}
                          disabled={saving}
                        />
                        <AdaptiveSelectField
                          label="Secondary Skill Rating"
                          value={editForm.secondary_rating}
                          placeholder="Select Rating"
                          options={SKILL_RATINGS}
                          onChange={(v) => setEditForm({ ...editForm, secondary_rating: v })}
                          disabled={saving}
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
                      ? "Portal role is locked while this employee is Invited. It can be changed after onboarding is complete."
                      : "Set this employee's portal access role from user_roles."
                  }
                >
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
