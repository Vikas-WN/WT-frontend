"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeStatusBadge } from "@/components/employee-directory/EmployeeStatusBadge";
import { resolveProfilePhotoSrc, avatarInitials, avatarGradientStyle } from "@/components/dashboard/ui/profile";
import { EmployeeResumeLink } from "@/components/resumes/EmployeeResumeLink";
import {
  formatProfileDisplayValue,
  pickProfileField,
  rowIsBirthdayToday,
} from "@/utils/employeeDirectory";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import { Cake, FileText, Mail, Phone } from "lucide-react";

function ProfileHeaderAvatar({
  profile,
  displayName,
  isBirthday,
}: {
  profile: Record<string, unknown>;
  displayName: string;
  isBirthday?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoSrc = resolveProfilePhotoSrc(profile);
  const showFallback = !photoSrc || imageFailed;
  const gradientSeed = String(
    profile.emp_id ?? profile.empId ?? profile.email ?? profile.work_email ?? ""
  ).trim();

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/25 shadow-sm ring-1 ring-black/10 sm:h-[5.5rem] sm:w-[5.5rem]",
          isBirthday && "wt-birthday-avatar"
        )}
        style={showFallback ? avatarGradientStyle(displayName, gradientSeed) : undefined}
      >
        {photoSrc && !imageFailed ? (
          <img
            src={photoSrc}
            alt={`${displayName} profile`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-2xl font-semibold text-white drop-shadow-sm">{avatarInitials(displayName)}</span>
        )}
      </div>
      {isBirthday ? (
        <span className="wt-birthday-badge" title="Birthday today" aria-label="Birthday today">
          <span className="wt-birthday-cake" aria-hidden>
            🎂
          </span>
          <span className="wt-birthday-popper" aria-hidden>
            🎉
          </span>
        </span>
      ) : null}
    </div>
  );
}

function MetaChip({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 max-w-full items-start gap-2.5 rounded-xl border border-wt-border/80 bg-wt-surface-2/45 px-3 py-2.5">
      {icon ? (
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-wt-surface-1 text-[var(--wt-brand)] shadow-sm">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-wt-text-faint">
          {label}
        </span>
        <span className="mt-0.5 block text-sm font-medium text-wt-text break-all">{value}</span>
      </span>
    </div>
  );
}

export function EmployeeProfileHeaderCard({
  profile,
  displayName,
  designation,
  department,
  empId,
  email,
  phone,
  resumeShareHref,
  headerAction,
  editModeLabel,
}: {
  profile: Record<string, unknown>;
  displayName: string;
  designation: string;
  department: string;
  empId: string;
  email: string;
  phone: string;
  resumeShareHref?: string | null;
  headerAction?: ReactNode;
  editModeLabel?: string | null;
}) {
  const roleLine =
    designation ||
    formatProfileDisplayValue(
      pickProfileField(profile, ["role", "designation", "designation_name"])
    );
  const departmentLine =
    department || formatProfileDisplayValue(pickProfileField(profile, ["department"]));
  const subtitle = [roleLine !== "—" ? roleLine : "", departmentLine !== "—" ? departmentLine : ""]
    .filter(Boolean)
    .join(" · ");

  const status = String(
    pickProfileField(profile, ["user_status", "status", "userStatus"]) ?? ""
  ).trim();
  const isBirthday = rowIsBirthdayToday(profile);

  const metaItems = [
    {
      key: "emp-id",
      label: "Employee ID",
      value: empId || "—",
    },
    {
      key: "email",
      icon: <Mail className="h-3.5 w-3.5" aria-hidden />,
      label: "Work Email",
      value: email ? (
        <a href={`mailto:${email}`} className="text-[var(--wt-brand)] hover:underline">
          {email}
        </a>
      ) : (
        "—"
      ),
    },
    {
      key: "phone",
      icon: <Phone className="h-3.5 w-3.5" aria-hidden />,
      label: "Phone",
      value:
        phone && phone !== "—" ? (
          <a href={`tel:${phone}`} className="hover:underline">
            {phone}
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "resume",
      icon: <FileText className="h-3.5 w-3.5" aria-hidden />,
      label: "Resume",
      value: <EmployeeResumeLink href={resumeShareHref} />,
    },
  ];

  return (
    <Card className={cn("w-full overflow-hidden p-0 wt-soft-in", CONTENT_CARD_CLASS)}>
      <div className="h-1.5 w-full bg-gradient-to-r from-[var(--wt-brand)] via-[color-mix(in_srgb,var(--wt-brand)_55%,#f59e0b)] to-emerald-400" />
      <CardContent className="px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <ProfileHeaderAvatar profile={profile} displayName={displayName} isBirthday={isBirthday} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {editModeLabel ? (
                  <span className="mb-1.5 inline-flex rounded-md bg-[var(--wt-brand)] px-2 py-0.5 text-xs font-semibold text-white">
                    {editModeLabel}
                  </span>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="truncate text-xl font-bold tracking-tight text-wt-text sm:text-2xl"
                    title={displayName}
                  >
                    {displayName}
                  </h1>
                  {status ? <EmployeeStatusBadge status={status} /> : null}
                  {isBirthday ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      <Cake className="size-3" aria-hidden />
                      Birthday today
                    </span>
                  ) : null}
                </div>
                {subtitle ? (
                  <p className="mt-1 text-sm text-wt-text-muted">{subtitle}</p>
                ) : null}
              </div>
              {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {metaItems.map((item) => (
                <MetaChip key={item.key} icon={item.icon} label={item.label} value={item.value} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
