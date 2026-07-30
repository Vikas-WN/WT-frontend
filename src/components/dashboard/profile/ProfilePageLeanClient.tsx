"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  defaultPhoneCountryIso,
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
  DatePickerField,
} from "@/components/dashboard/ui/forms";
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
import { pickEmployeeRole } from "@/utils/employeeDirectory";

export function ProfilePageLeanClient() {
  const { user, refresh: refreshSession } = useAuth();
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
    await refreshSession();
    await loadMyProfile();
    router.replace("/dashboard/overview", { scroll: false });
  }, [refreshSession, loadMyProfile, router]);

  const openOwnProfileEditor = () => {
    const profile = employeeProfile ?? {};
    const primarySkillsRaw =
      profile.primary_skills ?? profile.primarySkills ?? [];
    const primarySkills = Array.isArray(primarySkillsRaw)
      ? primarySkillsRaw
          .map((item) => String(item).trim())
          .filter(Boolean)
          .join(", ")
      : String(primarySkillsRaw ?? "").trim();
    const secondarySkillsRaw =
      (profile.secondary_skills as
        | Array<Record<string, unknown>>
        | undefined) ??
      (profile.secondarySkills as Array<Record<string, unknown>> | undefined) ??
      [];
    const firstSecondary = Array.isArray(secondarySkillsRaw)
      ? secondarySkillsRaw[0]
      : undefined;

    const phoneParts = splitPhoneNumber(
      String(profile.phone_number ?? profile.phoneNumber ?? "").trim(),
    );

    const profileDob = String(
      pickProfileField(profile, ["date_of_birth", "dob", "dateOfBirth"]) ?? "",
    ).trim();
    setSelfProfileForm({
      phone_country: phoneParts.countryIso,
      phone_number: phoneParts.nationalNumber,
      primary_skills: primarySkills,
      secondary_skill: String(firstSecondary?.skill ?? "").trim(),
      secondary_rating: String(firstSecondary?.rating ?? "").trim(),
      yoe: String(profile.yoe ?? "").trim(),
      date_of_birth: profileDob,
    });
    setSelfProfileEmploymentFiles({
      reliving_letter: null,
      salary_slips: null,
    });
    setSelfProfilePic(null);
    setIsEditingOwnProfile(true);
  };

  const profileDisplayName =
    String(employeeProfile?.name ?? user?.name ?? "").trim() || "Profile";

  const renderEditPanel = () => (
    <div className="rounded-xl border border-wt-border bg-wt-surface-1 p-10 md:p-12">
      <h3 className="mb-1 font-semibold">Edit Profile</h3>
      <p className="mb-4 text-sm text-wt-text-muted">
        You are onboarded. Update your profile details anytime.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Country Code"
          value={selfProfileForm.phone_country ?? defaultPhoneCountryIso()}
          options={PHONE_COUNTRY_OPTIONS}
          onChange={(v) =>
            setSelfProfileForm((p) => ({ ...p, phone_country: v }))
          }
          placeholder="Search Country Code"
        />
        <InputField
          label="Phone Number"
          type="tel"
          value={selfProfileForm.phone_number}
          onChange={(v) =>
            setSelfProfileForm((p) => ({ ...p, phone_number: digitsOnly(v) }))
          }
          placeholder="Enter phone number"
        />
        <InputField
          label="Primary Skills (comma separated)"
          value={selfProfileForm.primary_skills}
          onChange={(v) =>
            setSelfProfileForm((p) => ({ ...p, primary_skills: v }))
          }
        />
        <InputField
          label="Secondary Skill"
          value={selfProfileForm.secondary_skill}
          onChange={(v) =>
            setSelfProfileForm((p) => ({ ...p, secondary_skill: v }))
          }
        />
        <SelectField
          label="Secondary Skill Rating"
          placeholder="Select rating"
          value={selfProfileForm.secondary_rating}
          options={["1", "2", "3", "4", "5"]}
          onChange={(v) =>
            setSelfProfileForm((p) => ({ ...p, secondary_rating: v }))
          }
        />
        <InputField
          label="Years of Experience (excluding internship)"
          required
          value={selfProfileForm.yoe}
          onChange={(v) => setSelfProfileForm((p) => ({ ...p, yoe: v }))}
        />
        <DatePickerField
          label="Date of Birth"
          value={selfProfileForm.date_of_birth}
          onChange={(v) =>
            setSelfProfileForm((p) => ({ ...p, date_of_birth: v }))
          }
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
          label="Profile Picture (required)"
          required
          accept="image/*"
          onPick={setSelfProfilePic}
        />
      </div>
      <div className="mt-4">
        <Button
          variant="brand"
          type="button"
          className="px-3 py-2"
          onClick={() =>
            runAction("Update my profile", async () => {
              const primarySkills = selfProfileForm.primary_skills
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
              const selectedPhoneCountry =
                selfProfileForm.phone_country ?? defaultPhoneCountryIso();
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
              if (!selfProfilePic) {
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
                primary_skills: primarySkills.length ? primarySkills : null,
                secondary_skills: selfProfileForm.secondary_skill
                  ? [
                      {
                        skill: selfProfileForm.secondary_skill.trim(),
                        rating: Number(selfProfileForm.secondary_rating),
                      },
                    ]
                  : [],
                experience:
                  yoeValue > 0 ? `${yoeValue} years` : null,
                yoe: yoeValue,
              };
              if (selfProfileForm.date_of_birth.trim()) {
                profilePayload.date_of_birth =
                  selfProfileForm.date_of_birth.trim();
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
                      designation={pickEmployeeRole(employeeProfile ?? {})}
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
