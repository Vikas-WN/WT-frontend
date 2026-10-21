"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeStatusBadge } from "@/components/employee-directory/EmployeeStatusBadge";
import { resolveProfilePhotoSrc, avatarInitials, avatarGradientStyle } from "@/components/dashboard/ui/profile";
import { EmployeeResumeLink } from "@/components/resumes/EmployeeResumeLink";
import {
  formatProfileDisplayValue,
  pickDesignationForDisplay,
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
    pickDesignationForDisplay(profile) ||
    "—";
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
      <div className="h-28 w-full bg-[var(--wt-navy)] sm:h-32" aria-hidden />
      <CardContent className="px-5 pb-0 pt-0 sm:px-8">
        <div className="-mt-12 flex flex-col items-center gap-4 text-center sm:-mt-14 sm:flex-row sm:items-end sm:gap-6 sm:text-left">
          <div className="rounded-full bg-wt-surface-1 p-1.5">
            <ProfileHeaderAvatar profile={profile} displayName={displayName} isBirthday={isBirthday} />
          </div>
          <div className="min-w-0 w-full flex-1 pb-1 sm:pb-2">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                {editModeLabel ? (
                  <span className="mb-1.5 inline-flex rounded-md bg-[var(--wt-brand)] px-2 py-0.5 text-xs font-semibold text-[var(--wt-brand-text)]">
                    {editModeLabel}
                  </span>
                ) : null}
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                  <h1 className="text-2xl font-bold tracking-tight text-wt-text [overflow-wrap:anywhere] sm:text-[1.75rem]" title={displayName}>
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
                {subtitle ? <p className="mt-1 text-base text-wt-text-muted">{subtitle}</p> : null}
              </div>
              {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
            </div>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-wt-border py-5 text-left sm:grid-cols-2 xl:grid-cols-4">
          {metaItems.map((item) => (
            <div key={item.key} className="min-w-0">
              <dt className="text-sm text-wt-text-muted">{item.label}</dt>
              <dd className={cn("mt-0.5 font-semibold text-wt-text [overflow-wrap:anywhere]", item.key === "emp-id" && "font-mono")}>{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
