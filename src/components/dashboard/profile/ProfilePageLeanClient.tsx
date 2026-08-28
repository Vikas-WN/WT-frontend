"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SkillRatingsListInput } from "@/components/dashboard/ui/SkillRatingsListInput";
import {
  DateOfBirthConfirmField,
  isDobReadyToSave,
} from "@/components/dashboard/ui/DateOfBirthConfirmField";
import { SkillRating } from "@/types/onboard";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { hrmsService } from "@/services/hrms.service";
import { ApiError } from "@/api/error";
import {
  formatActionErrorMessage,
  formatActionSuccessMessage,
} from "@/utils/actionToast";
import {
  MAX_ONBOARD_FILE_BYTES,
  MAX_ONBOARD_TOTAL_BYTES,
} from "@/constants/dashboard";
import { createEmptySelfProfileForm } from "@/utils/profileFormState";
import {
  PHONE_COUNTRY_OPTIONS,
  digitsOnly,
  formatPhoneNumberForApi,
  splitPhoneNumber,
  validatePhoneNumber,
} from "@/utils/phoneCountries";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { SelfOnboardingPanel } from "@/components/employee-onboarding/SelfOnboardingPanel";
import {
  InputField,
  SelectField,
  FileField,
} from "@/components/dashboard/ui/forms";
import { validateRequiredApiDate } from "@/utils/apiDate";
import { readProfileField } from "@/components/dashboard/ui/profile";
import { pickProfileField } from "@/utils/employeeDirectory";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { ProfileEmployeeTrainingsSection } from "@/components/dashboard/profile/ProfileEmployeeTrainingsSection";
import { ProfileAssignedProjectsSection } from "@/components/dashboard/profile/ProfileAssignedProjectsSection";
import {
  ProfileDetailsSkeleton,
  ProfileHeaderSkeleton,
  TableRowsSkeleton,
} from "@/components/dashboard/ui/SectionSkeleton";
import { shouldSkipSelfProfileFetch } from "@/utils/selfProfile";
import {
  buildProfileAssignedProjects,
  buildProfileRowsFromMyAllocationsDetail,
  formatCurrentAllocationSummary,
  selectProfileAllocationRows,
} from "@/utils/dashboard/projects";
import { OffboardedBanner } from "@/components/dashboard/shared/OffboardedBanner";
import { OnboardingPendingBanner } from "@/components/dashboard/shared/OnboardingPendingBanner";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { EmployeeProfileHeaderCard } from "@/components/employee-directory/EmployeeProfileHeaderCard";
import { ProfileSectionsView } from "@/components/employee-directory/ProfileSectionsView";
import { pickDesignationForDisplay } from "@/utils/employeeDirectory";

export function ProfilePageLeanClient() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const userRoles = useMemo(() => user?.roles ?? [], [user?.roles]);
  const {
    requiresSelfOnboarding,
    isOffboarded,
    employeeSelfServeProfile,
    profile: employeeProfile,
    profileLoading: isProfileLoading,
    loadMyProfile,
  } = useDashboardAccess();

  const [actionLoading, setActionLoading] = useState(false);

  const [profileAssignedProjects, setProfileAssignedProjects] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [profileAssignedProjectsLoading, setProfileAssignedProjectsLoading] =
    useState(false);

  const [selfProfileForm, setSelfProfileForm] = useState(
    createEmptySelfProfileForm,
  );
  const [selfProfileEmploymentFiles, setSelfProfileEmploymentFiles] = useState<{
    reliving_letter: File | null;
    salary_slips: File | null;
  }>({
    reliving_letter: null,
    salary_slips: null,
  });
  const [selfProfilePic, setSelfProfilePic] = useState<File | null>(null);
  const [isEditingOwnProfile, setIsEditingOwnProfile] = useState(false);
  const [dobConfirmed, setDobConfirmed] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (shouldSkipSelfProfileFetch(userRoles)) {
      router.replace(DASHBOARD_ROUTES["leave-team"]);
      return;
    }
    const id = window.setTimeout(() => {
      void loadMyProfile();
    }, 0);
    return () => window.clearTimeout(id);
  }, [user, userRoles, loadMyProfile, router]);

  useEffect(() => {
    if (!user || isProfileLoading || requiresSelfOnboarding) return;
    const load = async () => {
      setProfileAssignedProjectsLoading(true);
      try {
        const [detailRes, assignedRes, myAllocationsRes] = await Promise.allSettled([
          hrmsService.getMyAllocationsDetail(),
          hrmsService.getAssignedProjects(),
          hrmsService.getMyAllocations(),
        ]);

        if (detailRes.status === "fulfilled") {
          const fromDetail = selectProfileAllocationRows(
            buildProfileRowsFromMyAllocationsDetail(
              detailRes.value.data ?? detailRes.value,
            ),
          );
          if (fromDetail.length) {
            setProfileAssignedProjects(fromDetail);
            return;
          }
        }

        const assignedInput =
          assignedRes.status === "fulfilled"
            ? (assignedRes.value.data ?? assignedRes.value)
            : [];
        const allocationInput =
          myAllocationsRes.status === "fulfilled"
            ? (myAllocationsRes.value.data ?? myAllocationsRes.value)
            : undefined;
        setProfileAssignedProjects(
          selectProfileAllocationRows(
            buildProfileAssignedProjects(assignedInput, allocationInput),
          ),
        );
      } finally {
        setProfileAssignedProjectsLoading(false);
      }
    };
    void load();
  }, [user, isProfileLoading, requiresSelfOnboarding]);

  const priorEmploymentDocsForProfile = useMemo(() => {
    const raw = String(selfProfileForm.yoe ?? "")
      .trim()
      .replace(",", ".");
    if (!raw) return false;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) && n > 0;
  }, [selfProfileForm.yoe]);

  async function runAction(label: string, fn: () => Promise<void>) {
    setActionLoading(true);
    try {
      await fn();
      showSuccessToast(formatActionSuccessMessage(label));
    } catch (error) {
      const backendMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "";
      showErrorToast(formatActionErrorMessage(label, backendMessage));
    } finally {
      setActionLoading(false);
    }
  }

  const handleOnboardingSuccess = useCallback(async () => {
    // Completing onboarding ends the invite session — require a fresh sign-in.
    await logout();
  }, [logout]);

  const openOwnProfileEditor = () => {
    const profile = employeeProfile ?? {};
    const toSkillRatings = (raw: unknown): SkillRating[] => {
      if (!Array.isArray(raw)) return [];
      return raw
        .map((item) => {
          if (item && typeof item === "object") {
            const row = item as Record<string, unknown>;
            const skill = String(row.skill ?? "").trim();
            if (!skill) return null;
            const selfRating = Number(row.self_rating ?? row.selfRating ?? row.rating ?? 3);
            const wk = row.webknot_rating ?? row.webknotRating;
            return {
              skill,
              self_rating: Number.isFinite(selfRating) ? selfRating : 3,
              webknot_rating: wk == null || wk === "" ? null : Number(wk),
            } as SkillRating;
          }
          const skill = String(item ?? "").trim();
          return skill ? ({ skill, self_rating: 3, webknot_rating: null } as SkillRating) : null;
        })
        .filter((item): item is SkillRating => Boolean(item));
    };
    const primarySkills = toSkillRatings(profile.primary_skills ?? profile.primarySkills ?? []);
    const secondarySkills = toSkillRatings(profile.secondary_skills ?? profile.secondarySkills ?? []);

    const rawPhone = String(profile.phone_number ?? profile.phoneNumber ?? "").trim();
    const phoneParts = rawPhone ? splitPhoneNumber(rawPhone) : { countryIso: "", nationalNumber: "" };

    const profileDob = String(
      pickProfileField(profile, ["date_of_birth", "dob", "dateOfBirth"]) ?? "",
    ).trim();
    const dobLocked = Boolean(
      profile.date_of_birth_locked ?? profile.dateOfBirthLocked ?? profileDob
    );
    setSelfProfileForm({
      phone_country: phoneParts.countryIso,
      phone_number: phoneParts.nationalNumber,
      primary_skills: primarySkills,
      secondary_skills: secondarySkills,
      yoe: String(profile.yoe ?? "").trim(),
      date_of_birth: profileDob,
    });
    setDobConfirmed(dobLocked);
    setSelfProfileEmploymentFiles({
      reliving_letter: null,
      salary_slips: null,
    });
    setSelfProfilePic(null);
    setIsEditingOwnProfile(true);
  };

  const profileDisplayName =
    String(employeeProfile?.name ?? user?.name ?? "").trim() || "Profile";
  const currentProfilePhotoName = useMemo(() => {
    if (selfProfilePic?.name) return selfProfilePic.name;
    const raw = String(employeeProfile?.profile_photo ?? employeeProfile?.profilePhoto ?? "").trim();
    if (!raw) return "";
    const parts = raw.split("/");
    return parts[parts.length - 1] ?? raw;
  }, [employeeProfile?.profilePhoto, employeeProfile?.profile_photo, selfProfilePic?.name]);

  const renderEditPanel = () => {
    return (
    <div className="rounded-3xl border border-wt-border bg-wt-surface-1 p-6 shadow-[var(--wt-shadow-md)] wt-soft-in dark:shadow-none md:p-10">
      <h3 className="text-lg font-semibold tracking-tight text-wt-text">Edit Profile</h3>
      <p className="mb-5 mt-1 text-sm text-wt-text-muted">
        Keep your skills and personal details current. Date of birth locks after you confirm your age.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Country Code"
          required
          value={selfProfileForm.phone_country ?? ""}
          options={PHONE_COUNTRY_OPTIONS}
          onChange={(v) =>
            setSelfProfileForm((p) => ({ ...p, phone_country: v }))
          }
          placeholder="Search Country Code"
        />
        <InputField
          label="Phone Number"
          required
          value={selfProfileForm.phone_number}
          onChange={(v) =>
            setSelfProfileForm((p) => ({ ...p, phone_number: digitsOnly(v) }))
          }
        />
        <SkillRatingsListInput
          label="Primary Skills"
          required
          hint="At least one skill with a self rating"
          value={selfProfileForm.primary_skills}
          onChange={(v) => setSelfProfileForm((prev) => ({ ...prev, primary_skills: v }))}
          className="sm:col-span-2"
        />
        <SkillRatingsListInput
          label="Secondary Skills"
          required
          hint="At least one skill with a self rating"
          value={selfProfileForm.secondary_skills}
          onChange={(v) => setSelfProfileForm((prev) => ({ ...prev, secondary_skills: v }))}
          className="sm:col-span-2"
        />
        <InputField
          label="Years of Experience (excluding internship)"
          required
          value={selfProfileForm.yoe}
          onChange={(v) => setSelfProfileForm((p) => ({ ...p, yoe: v }))}
        />
        <DateOfBirthConfirmField
          value={selfProfileForm.date_of_birth}
          confirmed={dobConfirmed}
          locked={Boolean(employeeProfile?.date_of_birth_locked ?? employeeProfile?.dateOfBirthLocked)}
          onChange={(v) => setSelfProfileForm((p) => ({ ...p, date_of_birth: v }))}
          onConfirmChange={setDobConfirmed}
        />
      </div>
      {priorEmploymentDocsForProfile ? (
        <div className="mt-4 rounded-xl border border-wt-border bg-wt-surface-2 p-4">
          <p className="mb-2 text-sm font-medium text-wt-text">
            Prior employment (YoE &gt; 0)
          </p>
          <p className="mb-3 text-xs text-wt-text-muted">
            Relieving letter and a payslip are required when years of experience
            is greater than zero.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FileField
              label="Relieving letter (previous company)"
              required
              accept=".pdf,image/*"
              onPick={(file) =>
                setSelfProfileEmploymentFiles((p) => ({
                  ...p,
                  reliving_letter: file,
                }))
              }
            />
            <FileField
              label="Upload last 3 months's payslip"
              required
              accept=".pdf,image/*"
              onPick={(file) =>
                setSelfProfileEmploymentFiles((p) => ({
                  ...p,
                  salary_slips: file,
                }))
              }
            />
          </div>
        </div>
      ) : null}
      <div className="mt-3">
        <FileField
          label={currentProfilePhotoName ? "Profile Picture" : "Profile Picture (required)"}
          required={!currentProfilePhotoName}
          accept="image/*"
          onPick={setSelfProfilePic}
          currentFileName={currentProfilePhotoName || undefined}
        />
      </div>
      <div className="mt-4">
        <Button
          variant="brand"
          type="button"
          className="px-3 py-2"
          onClick={() =>
            runAction("Update my profile", async () => {
              const primarySkills = selfProfileForm.primary_skills.filter((item) => String(item.skill ?? "").trim());
              const secondarySkills = selfProfileForm.secondary_skills.filter((item) => String(item.skill ?? "").trim());
              if (!primarySkills.length) {
                throw new Error("At least one primary skill is required.");
              }
              if (!secondarySkills.length) {
                throw new Error("At least one secondary skill is required.");
              }
              const dobLocked = Boolean(
                employeeProfile?.date_of_birth_locked ?? employeeProfile?.dateOfBirthLocked
              );
              if (!isDobReadyToSave(selfProfileForm.date_of_birth, dobConfirmed, dobLocked)) {
                throw new Error(
                  dobLocked
                    ? "Date of birth is required."
                    : "Confirm your calculated age to lock your date of birth before saving."
                );
              }
              const selectedPhoneCountry = selfProfileForm.phone_country?.trim();
              if (!selectedPhoneCountry) {
                throw new Error("Please select a country code.");
              }
              const phoneValidationError = validatePhoneNumber(
                selectedPhoneCountry,
                selfProfileForm.phone_number,
              );
              if (phoneValidationError) {
                throw new Error(phoneValidationError);
              }
              const formattedPhoneNumber = formatPhoneNumberForApi(
                selectedPhoneCountry,
                selfProfileForm.phone_number,
              );
              if (!selfProfilePic && !currentProfilePhotoName) {
                throw new Error(
                  "Profile picture is mandatory. Please upload your profile picture.",
                );
              }
              if (priorEmploymentDocsForProfile) {
                if (!selfProfileEmploymentFiles.reliving_letter) {
                  throw new Error(
                    "Please upload your relieving letter from the previous company.",
                  );
                }
                if (!selfProfileEmploymentFiles.salary_slips) {
                  throw new Error(
                    "Please upload a payslip file in the payslip field.",
                  );
                }
              }
              const files = [
                selfProfileEmploymentFiles.reliving_letter,
                selfProfileEmploymentFiles.salary_slips,
                selfProfilePic,
              ].filter((f): f is File => Boolean(f));
              for (const file of files) {
                if (file.size > MAX_ONBOARD_FILE_BYTES) {
                  throw new Error(
                    "A selected file exceeds 2 MB. Please upload a smaller file.",
                  );
                }
              }
              const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
              if (totalBytes > MAX_ONBOARD_TOTAL_BYTES) {
                throw new Error(
                  "Total upload size exceeds 6 MB. Compress files and retry.",
                );
              }
              const fd = new FormData();
              if (!String(selfProfileForm.yoe ?? "").trim()) {
                throw new Error("Years of experience is required.");
              }
              const yoeValue = Number(selfProfileForm.yoe);
              if (!Number.isFinite(yoeValue) || yoeValue < 0) {
                throw new Error("Years of experience must be a valid number.");
              }
              if (!Number.isInteger(Number(selfProfileForm.yoe))) {
                throw new Error("Years of experience must be a whole number.");
              }
              const profilePayload: Record<string, unknown> = {
                phone_number: formattedPhoneNumber,
                primary_skills: primarySkills,
                secondary_skills: secondarySkills,
                experience:
                  yoeValue > 0 ? `${yoeValue} years` : null,
                yoe: yoeValue,
              };
              const dobResult = validateRequiredApiDate(
                selfProfileForm.date_of_birth,
                "Date of birth"
              );
              if (!dobResult.ok) {
                throw new Error(dobResult.error);
              }
              profilePayload.date_of_birth = dobResult.date;
              if (!dobLocked) {
                profilePayload.date_of_birth_confirmed = true;
              }
              fd.append("body", JSON.stringify(profilePayload));
              if (selfProfilePic) fd.append("profilePic", selfProfilePic);
              if (selfProfileEmploymentFiles.reliving_letter) {
                fd.append(
                  "reliving_letter",
                  selfProfileEmploymentFiles.reliving_letter,
                );
              }
              if (selfProfileEmploymentFiles.salary_slips) {
                fd.append(
                  "salary_slips[]",
                  selfProfileEmploymentFiles.salary_slips,
                );
              }
              await hrmsService.updateMyProfile(fd);
              setSelfProfileForm(createEmptySelfProfileForm());
              setSelfProfileEmploymentFiles({
                reliving_letter: null,
                salary_slips: null,
              });
              setSelfProfilePic(null);
              setIsEditingOwnProfile(false);
              await loadMyProfile();
            })
          }
          disabled={actionLoading}
        >
          Save Profile Changes
        </Button>
        <Button
          variant="ghost"
          type="button"
          className="ml-2 px-3 py-2"
          onClick={() => setIsEditingOwnProfile(false)}
          disabled={actionLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
  };

  return (
    <>
      <DashboardPageShell>
        <section className="w-full">
          {isOffboarded ? <OffboardedBanner /> : null}
          {!isProfileLoading && !isOffboarded && requiresSelfOnboarding ? (
            <OnboardingPendingBanner />
          ) : null}
          {!isProfileLoading &&
          !isOffboarded &&
          employeeSelfServeProfile &&
          requiresSelfOnboarding ? (
            <SelfOnboardingPanel
              key={[
                String(employeeProfile?.emp_id ?? user?.email ?? "onboard"),
                String(employeeProfile?.personal_email ?? "").trim(),
                String(
                  employeeProfile?.resume_share_link ??
                    employeeProfile?.resumeShareLink ??
                    "",
                ).trim(),
              ].join("|")}
              workEmail={user?.email ?? ""}
              initialPersonalEmail={String(
                employeeProfile?.personal_email ?? "",
              ).trim()}
              initialResumeShareLink={String(
                employeeProfile?.resume_share_link ??
                  employeeProfile?.resumeShareLink ??
                  "",
              ).trim()}
              actionLoading={actionLoading}
              runAction={(label, fn) => {
                void runAction(label, fn);
              }}
              onSuccess={handleOnboardingSuccess}
            />
          ) : null}

          {!isOffboarded &&
          (!employeeSelfServeProfile ||
            !requiresSelfOnboarding ||
            isProfileLoading) ? (
            isEditingOwnProfile && !isProfileLoading ? (
              renderEditPanel()
            ) : (
              <div className="rounded-xl border border-wt-border bg-wt-surface-1 p-10 md:p-12">
                {isProfileLoading ? (
                  <>
                    <ProfileHeaderSkeleton />
                    <div className="mt-6">
                      <ProfileDetailsSkeleton />
                    </div>
                    <div className="mt-8 border-t border-wt-border pt-6">
                      <h4 className="mb-3 text-sm font-semibold text-wt-text">
                        Project Details
                      </h4>
                      <TableRowsSkeleton rows={3} columns={5} />
                    </div>
                  </>
                ) : (
                  <div className="w-full space-y-4">
                    <EmployeeProfileHeaderCard
                      profile={employeeProfile ?? {}}
                      displayName={profileDisplayName}
                      designation={pickDesignationForDisplay(employeeProfile ?? {})}
                      department={String(
                        readProfileField(employeeProfile, "department") ?? "",
                      )}
                      empId={String(
                        readProfileField(employeeProfile, "emp_id", "empId") ??
                          "",
                      )}
                      email={String(
                        employeeProfile?.email ?? user?.email ?? "",
                      )}
                      phone={String(
                        readProfileField(
                          employeeProfile,
                          "phone_number",
                          "phoneNumber",
                        ) ?? "",
                      )}
                      resumeShareHref={
                        readProfileField(
                          employeeProfile,
                          "resume_share_link",
                          "resumeShareLink",
                        ) || null
                      }
                      headerAction={
                        employeeSelfServeProfile ? (
                          <Button
                            variant="brand"
                            type="button"
                            className="px-4 py-2.5"
                            onClick={openOwnProfileEditor}
                            disabled={actionLoading}
                          >
                            Edit Profile
                          </Button>
                        ) : undefined
                      }
                    />
                    <ProfileSectionsView
                      profile={employeeProfile ?? {}}
                      includeDateOfBirth
                      resumeShareHref={
                        readProfileField(
                          employeeProfile,
                          "resume_share_link",
                          "resumeShareLink",
                        ) || null
                      }
                      currentAllocationSummary={formatCurrentAllocationSummary(
                        profileAssignedProjects,
                      )}
                    />
                    {!requiresSelfOnboarding ? (
                      <ProfileAssignedProjectsSection
                        rows={profileAssignedProjects}
                        loading={profileAssignedProjectsLoading}
                      />
                    ) : null}
                    {!requiresSelfOnboarding ? (
                      <ProfileEmployeeTrainingsSection enabled />
                    ) : null}
                  </div>
                )}
              </div>
            )
          ) : null}
        </section>
      </DashboardPageShell>
    </>
  );
}
