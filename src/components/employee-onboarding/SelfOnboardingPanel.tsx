"use client";

import { Button } from "@/components/ui/button";
import { SkillRatingsListInput } from "@/components/dashboard/ui/SkillRatingsListInput";
import {
  DateOfBirthConfirmField,
  isDobReadyToSave,
} from "@/components/dashboard/ui/DateOfBirthConfirmField";
import { useEffect, useMemo, useState } from "react";
import { hrmsService } from "@/services/hrms.service";
import { MAX_ONBOARD_FILE_BYTES, MAX_ONBOARD_TOTAL_BYTES } from "@/constants/dashboard";
import {
  AdaptiveSelectField,
  InputField,
  SelectField,
  FileField,
  TextAreaField,
} from "@/components/dashboard/ui/forms";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/dashboard/ui/forms";
import { isValidPersonName } from "@/utils/dashboard/validation";
import {
  digitsOnly,
  PHONE_COUNTRY_OPTIONS,
  formatPhoneNumberForApi,
  validatePhoneNumber,
} from "@/utils/phoneCountries";
import { validatePersonalEmail } from "@/utils/personalEmail";
import { validateResumeShareLink } from "@/utils/employeeResume";
import {
  createEmptySelfOnboardForm,
  loadSavedOnboardForm,
  saveOnboardFormDraft,
  clearOnboardFormDraft,
} from "@/utils/selfOnboardFormState";
import { SkillRating } from "@/types/onboard";
import { FALLBACK_ONBOARD_OPTIONS } from "@/utils/onboardFormOptions";
import { useOnboardOptions } from "@/hooks/useOnboardOptions";
import { toApiDateParam } from "@/utils/apiDate";

type OnboardFiles = {
  profile_photo: File | null;
  aadhaar: File | null;
  pan_card: File | null;
  reliving_letter: File | null;
  salary_slips: File | null;
};

const EMPTY_FILES: OnboardFiles = {
  profile_photo: null,
  aadhaar: null,
  pan_card: null,
  reliving_letter: null,
  salary_slips: null,
};

export function SelfOnboardingPanel({
  workEmail,
  initialPersonalEmail = "",
  initialResumeShareLink = "",
  actionLoading,
  runAction,
  onSuccess,
}: {
  workEmail: string;
  initialPersonalEmail?: string;
  initialResumeShareLink?: string;
  actionLoading: boolean;
  runAction: (label: string, fn: () => Promise<void>) => void;
  onSuccess: () => Promise<void>;
}) {
  const [formKey, setFormKey] = useState(0);
  const [form, setForm] = useState(() => loadSavedOnboardForm() ?? createEmptySelfOnboardForm());
  const [files, setFiles] = useState<OnboardFiles>(EMPTY_FILES);
  const [dobConfirmed, setDobConfirmed] = useState(false);
  const onboardOptionsQ = useOnboardOptions();
  const options = onboardOptionsQ.data ?? FALLBACK_ONBOARD_OPTIONS;

  const email = useMemo(() => workEmail.trim(), [workEmail]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      personal_email: initialPersonalEmail.trim() || prev.personal_email,
      resume_share_link: initialResumeShareLink.trim() || prev.resume_share_link,
    }));
  }, [initialPersonalEmail, initialResumeShareLink]);

  useEffect(() => {
    saveOnboardFormDraft(form);
  }, [form]);

  const priorEmploymentDocsRequired = useMemo(() => {
    const raw = String(form.yoe ?? "").trim().replace(",", ".");
    if (!raw) return false;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0;
  }, [form.yoe]);

  const primarySkillOptions = useMemo(
    () => options.primary_skills.map((item) => ({ value: item.value, label: item.label })),
    [options.primary_skills]
  );

  const secondarySkillOptions = useMemo(
    () => options.secondary_skills.map((item) => ({ value: item.value, label: item.label })),
    [options.secondary_skills]
  );

  const resetForm = () => {
    clearOnboardFormDraft();
    setForm(createEmptySelfOnboardForm());
    setFiles(EMPTY_FILES);
    setDobConfirmed(false);
    setFormKey((key) => key + 1);
  };

  const submit = () => {
    void runAction("Submit onboarding", async () => {
      if (!email) {
        throw new Error("Unable to resolve logged-in email.");
      }

      const personalEmail = form.personal_email.trim();
      const personalEmailError = validatePersonalEmail(email, personalEmail, { required: true });
      if (personalEmailError) throw new Error(personalEmailError);

      const legalName = form.full_name.trim();
      if (!legalName || !isValidPersonName(legalName)) {
        throw new Error("Enter your full name as per ID (letters and spaces, 2–120 characters).");
      }

      const phoneCountry = form.phone_country.trim();
      if (!phoneCountry) throw new Error("Please select a country code.");
      const phoneError = validatePhoneNumber(phoneCountry, form.phone_number);
      if (phoneError) throw new Error(phoneError);
      const apiPhoneNumber = formatPhoneNumberForApi(phoneCountry, form.phone_number);
      if (!apiPhoneNumber) throw new Error("Enter a valid phone number.");

      const dateOfBirth = toApiDateParam(form.date_of_birth);
      if (!dateOfBirth) {
        throw new Error(
          form.date_of_birth.trim()
            ? "Please enter a valid date of birth in DD/MM/YYYY format."
            : "Date of birth is required. Use DD/MM/YYYY."
        );
      }
      if (!isDobReadyToSave(form.date_of_birth, dobConfirmed, false)) {
        throw new Error("Confirm your calculated age to lock your date of birth before submitting.");
      }

      const yoeRaw = form.yoe.trim();
      if (!yoeRaw) {
        throw new Error("Years of experience is required.");
      }
      const yoeValue = Number(yoeRaw);
      if (!Number.isFinite(yoeValue) || yoeValue < 0 || yoeValue > 50) {
        throw new Error("Years of experience must be between 0 and 50");
      }
      if (!Number.isInteger(Number(yoeRaw))) {
        throw new Error("Years of experience must be a whole number.");
      }

      const experience = form.experience.trim();
      if (priorEmploymentDocsRequired && !experience) {
        throw new Error("Experience summary is required when years of experience is greater than zero.");
      }

      const primarySkillLookup = new Map(
        options.primary_skills.map((item) => [item.value.toLowerCase(), item.value]),
      );
      const primarySkills: SkillRating[] = [];
      const seenPrimarySkills = new Set<string>();
      for (const rawSkill of form.primary_skills) {
        const skillName = String(rawSkill.skill ?? "").trim();
        if (!skillName) continue;
        const canonical = primarySkillLookup.get(skillName.toLowerCase()) ?? skillName;
        const dedupeKey = canonical.toLowerCase();
        if (!seenPrimarySkills.has(dedupeKey)) {
          seenPrimarySkills.add(dedupeKey);
          primarySkills.push({ ...rawSkill, skill: canonical });
        }
      }
      if (!primarySkills.length) {
        throw new Error("At least one primary skill is required.");
      }
      if (!form.secondary_skills.some((item) => String(item.skill ?? "").trim())) {
        throw new Error("At least one secondary skill is required.");
      }
      const missingSelfRating = [...form.primary_skills, ...form.secondary_skills].filter(
        (item) => {
          if (!String(item.skill ?? "").trim()) return false;
          const rating = Number(item.self_rating);
          return !Number.isFinite(rating) || rating < 1 || rating > 5;
        }
      );
      if (missingSelfRating.length) {
        throw new Error("Each skill must have a self rating between 1 and 5.");
      }

      const withNumericRatings = (skills: SkillRating[]) =>
        skills
          .filter((item) => String(item.skill ?? "").trim())
          .map((item) => ({
            ...item,
            skill: String(item.skill).trim(),
            self_rating: Number(item.self_rating),
          }));

      const resumeShareLink = form.resume_share_link.trim();
      const resumeLinkError = validateResumeShareLink(resumeShareLink);
      if (resumeLinkError) throw new Error(resumeLinkError);

      const emergencyNumber = form.emergency_contact_number.trim();
      if (emergencyNumber) {
        const digits = digitsOnly(emergencyNumber);
        if (digits.length < 7 || digits.length > 15) {
          throw new Error("Enter a valid emergency contact number (7-15 digits).");
        }
      }

      if (!files.profile_photo) throw new Error("Please upload profile photo.");
      if (!files.aadhaar) throw new Error("Please upload Aadhaar.");
      if (!files.pan_card) throw new Error("Please upload PAN card.");

      if (priorEmploymentDocsRequired) {
        if (!files.reliving_letter) {
          throw new Error("Please upload your relieving letter from the previous company.");
        }
        if (!files.salary_slips) {
          throw new Error("Please upload a payslip file in the payslip field.");
        }
      }

      if (files.profile_photo.type && !files.profile_photo.type.startsWith("image/")) {
        throw new Error("Profile photo must be an image file (jpg/png/webp).");
      }

      const selectedFiles: Array<[string, File]> = [];
      for (const [key, val] of Object.entries(files)) {
        if (val) selectedFiles.push([key, val as File]);
      }
      for (const [key, file] of selectedFiles) {
        if (file.size > MAX_ONBOARD_FILE_BYTES) {
          throw new Error(`${key.replaceAll("_", " ")} exceeds 10 MB. Please upload a smaller file.`);
        }
      }
      const totalBytes = selectedFiles.reduce((sum, [, file]) => sum + file.size, 0);
      if (totalBytes > MAX_ONBOARD_TOTAL_BYTES) {
        throw new Error("Total upload size exceeds 40 MB. Compress files and retry.");
      }

      const userData: Record<string, unknown> = {
        email,
        personal_email: personalEmail,
        name: legalName,
        phone_number: apiPhoneNumber,
        date_of_birth: dateOfBirth,
        date_of_birth_confirmed: true,
        resume_share_link: resumeShareLink,
      };

      if (yoeValue !== null)       userData.yoe = yoeValue;
      if (experience) userData.experience = experience;
      
      userData.primary_skills = withNumericRatings(primarySkills);
      userData.secondary_skills = withNumericRatings(form.secondary_skills);
      if (form.local_address.trim()) userData.local_address = form.local_address.trim();
      if (form.permanent_address.trim()) userData.permanent_address = form.permanent_address.trim();
      if (form.gender) userData.gender = form.gender;
      if (form.marital_status) userData.marital_status = form.marital_status;
      if (form.blood_group) userData.blood_group = form.blood_group;
      if (form.emergency_contact_name.trim()) {
        userData.emergency_contact_name = form.emergency_contact_name.trim();
      }
      if (emergencyNumber) userData.emergency_contact_number = emergencyNumber;

      const fd = new FormData();
      fd.append("user_data", JSON.stringify(userData));

      for (const [key, file] of Object.entries(files)) {
        if (key === "salary_slips") {
          if (file) fd.append("salary_slips", file as File);
          continue;
        }
        if (!file) continue;
        fd.append(key, file as File);
      }

      await hrmsService.completeMyOnboarding(fd);
      resetForm();
      await onSuccess();
    });
  };

  return (
    <div key={formKey} className="rounded-3xl border border-wt-border bg-wt-surface-1 p-5 shadow-[var(--wt-shadow-md)] wt-soft-in dark:shadow-none sm:p-7">
      <h3 className="text-lg font-semibold tracking-tight text-wt-text">Complete Your Onboarding</h3>
      <p className="mb-5 mt-1 text-sm text-wt-text-muted">
        Submit your onboarding survey to activate full portal access. Fields marked with * are required.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel label="Work Email" />
          <Input
            className="h-10 bg-muted text-muted-foreground"
            type="email"
            value={email}
            readOnly
            disabled
          />
        </div>
        <InputField
          label="Personal mail ID"
          type="email"
          required
          value={form.personal_email}
          onChange={(v) => setForm((p) => ({ ...p, personal_email: v }))}
        />
        <InputField
          label="Full name (as per ID)"
          required
          value={form.full_name}
          onChange={(v) => setForm((p) => ({ ...p, full_name: v }))}
        />
        <AdaptiveSelectField
          label="Country Code"
          required
          value={form.phone_country}
          placeholder="Select Country Code"
          searchPlaceholder="Search Country Code…"
          options={PHONE_COUNTRY_OPTIONS}
          onChange={(v) => setForm((p) => ({ ...p, phone_country: v }))}
        />
        <InputField
          label="Phone Number"
          type="tel"
          inputMode="numeric"
          required
          value={form.phone_number}
          onChange={(v) => setForm((p) => ({ ...p, phone_number: digitsOnly(v) }))}
        />
        <DateOfBirthConfirmField
          value={form.date_of_birth}
          confirmed={dobConfirmed}
          onChange={(v) => setForm((p) => ({ ...p, date_of_birth: v }))}
          onConfirmChange={setDobConfirmed}
        />
        <InputField
          label="Years of Experience (excluding internship)"
          description="Whole years only. Add the exact duration (years and months) in Experience summary."
          required
          type="number"
          value={form.yoe}
          onChange={(v) => setForm((p) => ({ ...p, yoe: v }))}
        />
        {priorEmploymentDocsRequired ? (
          <InputField
            label="Experience summary (excluding internship)"
            required
            placeholder="e.g. 2 years at XYZ Corp"
            value={form.experience}
            onChange={(v) => setForm((p) => ({ ...p, experience: v }))}
          />
        ) : null}
        <SkillRatingsListInput
          label="Primary Skills"
          required
          hint="Choose from the predefined list or create a new skill, then add a self rating."
          value={form.primary_skills}
          onChange={(v) => setForm((p) => ({ ...p, primary_skills: v }))}
          skillOptions={primarySkillOptions}
          allowCustomSkills
          className="sm:col-span-2"
        />
        <SkillRatingsListInput
          label="Secondary Skills"
          required
          hint="Choose from the predefined list or create a new skill, then add a self rating."
          value={form.secondary_skills}
          onChange={(v) => setForm((p) => ({ ...p, secondary_skills: v }))}
          skillOptions={secondarySkillOptions}
          allowCustomSkills
          className="sm:col-span-2"
        />

        <SelectField
          label="Gender"
          placeholder="Select"
          value={form.gender}
          options={options.genders}
          onChange={(v) => setForm((p) => ({ ...p, gender: v }))}
        />
        <SelectField
          label="Marital status"
          placeholder="Select"
          value={form.marital_status}
          options={options.marital_statuses}
          onChange={(v) => setForm((p) => ({ ...p, marital_status: v }))}
        />
        <SelectField
          label="Blood group"
          placeholder="Select"
          value={form.blood_group}
          options={options.blood_groups}
          onChange={(v) => setForm((p) => ({ ...p, blood_group: v }))}
        />
        <InputField
          label="Emergency contact name"
          value={form.emergency_contact_name}
          onChange={(v) => setForm((p) => ({ ...p, emergency_contact_name: v }))}
        />
        <InputField
          label="Emergency contact number"
          type="tel"
          inputMode="numeric"
          value={form.emergency_contact_number}
          onChange={(v) => setForm((p) => ({ ...p, emergency_contact_number: v }))}
          error={
            /[^0-9]/.test(form.emergency_contact_number)
              ? "Alphabets and other characters are not allowed."
              : null
          }
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <TextAreaField
          label="Local address"
          className="sm:col-span-2"
          rows={3}
          textareaClassName="max-h-36 overflow-y-auto"
          value={form.local_address}
          onChange={(v) => setForm((p) => ({ ...p, local_address: v }))}
        />
        <TextAreaField
          label="Permanent address"
          className="sm:col-span-2"
          rows={3}
          textareaClassName="max-h-36 overflow-y-auto"
          value={form.permanent_address}
          onChange={(v) => setForm((p) => ({ ...p, permanent_address: v }))}
        />
        <InputField
          label="Resume (Google Docs link)"
          type="url"
          required
          placeholder="https://docs.google.com/document/d/..."
          value={form.resume_share_link}
          onChange={(v) => setForm((p) => ({ ...p, resume_share_link: v }))}
        />
        <FileField
          label="Profile Photo"
          required
          accept="image/*"
          onPick={(file) => setFiles((p) => ({ ...p, profile_photo: file }))}
        />
        <FileField label="Aadhaar" required accept=".pdf,image/*" onPick={(file) => setFiles((p) => ({ ...p, aadhaar: file }))} />
        <FileField label="PAN Card" required accept=".pdf,image/*" onPick={(file) => setFiles((p) => ({ ...p, pan_card: file }))} />
      </div>
      {priorEmploymentDocsRequired ? (
        <div className="mt-4 rounded-xl border border-wt-border bg-wt-surface-2 p-4">
          <p className="text-sm font-medium text-wt-text mb-2">Prior employment (YoE &gt; 0)</p>
          <p className="text-xs text-wt-text-muted mb-3">
            Relieving letter and a payslip are required when years of experience is greater than zero.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <FileField
              label="Relieving letter (previous company)"
              required
              accept=".pdf,image/*"
              onPick={(file) => setFiles((p) => ({ ...p, reliving_letter: file }))}
            />
            <FileField
              label="Upload last 3 months's payslip"
              required
              accept=".pdf,image/*"
              onPick={(file) => setFiles((p) => ({ ...p, salary_slips: file }))}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-wt-text-muted">
          If your years of experience is above zero, add an experience summary, relieving letter, and payslip (fields
          appear when YoE &gt; 0).
        </p>
      )}
      <div className="mt-4">
        <Button variant="brand" type="button" className="px-3 py-2" onClick={submit} disabled={actionLoading}>
          Submit Onboarding Form
        </Button>
      </div>
    </div>
  );
}
