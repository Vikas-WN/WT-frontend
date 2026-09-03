"use client";

import {
  TableBody,
  TableCell, TableHeader,
  TableRow,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { EmployeeStatusBadge } from "@/components/employee-directory/EmployeeStatusBadge";
import { EmployeeResumeLink } from "@/components/resumes/EmployeeResumeLink";
import {
  DETAIL_LABEL_CELL_CLASS,
  DETAIL_VALUE_CELL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import {
  formatProfileDisplayValue,
  type ProfileDisplayEntry,
  type UserTypeTransitionDisplayRow,
} from "@/utils/employeeDirectory";
import { cn } from "@/lib/utils";
function UserTypeHistoryTable({ rows } : { rows: UserTypeTransitionDisplayRow[] }) {
  if (!rows.length){
    return<>—</>
  }

  return(
      <div className="overflow-x-auto rounded-xl border border-wt-border">
        <WtTable>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableCell className="bg-wt-surface-2/60 px-3 py-2 text-xs font-semibold text-wt-text-muted">
                Previous User Type
              </TableCell>
              <TableCell className="bg-wt-surface-2/60 px-3 py-2 text-xs font-semibold text-wt-text-muted">
                New User Type
              </TableCell>
              <TableCell className="bg-wt-surface-2/60 px-3 py-2 text-xs font-semibold text-wt-text-muted">
                Effective Date
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
                <TableRow
                key={`${row.previousUserType}-${row.newUserType}-${row.effectiveDate}-${index}`}
                className="hover:bg-transparent"
                >
                  <TableCell className="px-3 py-2 text-sm text-wt-text">
                    {row.previousUserType}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-wt-text">
                    {row.newUserType}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-sm text-wt-text">
                    {row.effectiveDate}
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </WtTable>
      </div>
  )
}
function SkillsTable({ skills }: { skills: unknown }) {
  if (!Array.isArray(skills) || !skills.length) {
    return <span className="text-wt-text-faint">—</span>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-wt-border">
      <WtTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableCell className="bg-wt-surface-2/60 px-3 py-2 text-xs font-semibold text-wt-text-muted">
              Skill
            </TableCell>
            <TableCell className="bg-wt-surface-2/60 px-3 py-2 text-xs font-semibold text-wt-text-muted">
              Self Rating
            </TableCell>
            <TableCell className="bg-wt-surface-2/60 px-3 py-2 text-xs font-semibold text-wt-text-muted">
              Webknot Rating
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const rec = item as Record<string, unknown>;
            const skill = String(rec.skill ?? rec.name ?? "").trim();
            if (!skill) return null;
            const selfRating = rec.self_rating ?? rec.selfRating ?? rec.rating ?? rec.level;
            const webknotRating = rec.webknot_rating ?? rec.webknotRating;
            return (
              <TableRow key={`${skill}-${index}`} className="hover:bg-transparent">
                <TableCell className="px-3 py-2 text-sm text-wt-text">{skill}</TableCell>
                <TableCell className="px-3 py-2 text-sm text-wt-text text-center">
                  {selfRating !== undefined && selfRating !== null && String(selfRating).trim() !== "" ? `${selfRating}/5` : "—"}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm text-wt-text text-center">
                  {webknotRating !== undefined && webknotRating !== null && String(webknotRating).trim() !== "" ? `${webknotRating}/5` : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </WtTable>
    </div>
  );
}

function ProfileFieldValue({ entry }: { entry: ProfileDisplayEntry }) {
  if (entry.resumeShareHref !== undefined) {
    return <EmployeeResumeLink href={entry.resumeShareHref} />;
  }
  if (entry.asStatusBadge) {
    return <EmployeeStatusBadge status={String(entry.value ?? "")} />;
  }

  if (entry.asUserTypeHistoryTable) {
    return (
      <UserTypeHistoryTable
        rows={Array.isArray(entry.value)
          ? (entry.value as UserTypeTransitionDisplayRow[])
          : []}
      />
    );
  }

  if (entry.asSkillsTable) {
    return <SkillsTable skills={entry.value} />;
  }

  if (entry.asScrollableText) {
    const text = formatProfileDisplayValue(entry.value);
    if (text === "—") return <span className="text-wt-text-faint">—</span>;
    return (
      <div className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-wt-border bg-wt-surface-2/40 px-3 py-2 text-sm font-normal leading-relaxed text-wt-text">
        {text}
      </div>
    );
  }

  return <>{formatProfileDisplayValue(entry.value)}</>;
}

export function ProfileFieldGrid({
  entries,
  variant = "table",
}: {
  entries: ProfileDisplayEntry[];
  variant?: "default" | "dashboard" | "rows" | "table";
}) {
  if (!entries.length) {
    return <p className="text-sm text-wt-text-muted">No information available.</p>;
  }

  if (variant === "table") {
    return (
      <div className="overflow-x-auto rounded-2xl border border-wt-border">
        <WtTable>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.label} className="hover:bg-transparent">
                <TableCell
                  className={cn(DETAIL_LABEL_CELL_CLASS, "w-[34%] min-w-[10rem] bg-wt-surface-2/40")}
                >
                  {entry.label}
                </TableCell>
                <TableCell className={cn(DETAIL_VALUE_CELL_CLASS, "text-wt-text")}>
                  <ProfileFieldValue entry={entry} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </WtTable>
      </div>
    );
  }

  if (variant === "default" || variant === "dashboard") {
    return (
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        {entries.map((entry) => (
          <div
            key={entry.label}
            className={cn("min-w-0", entry.fullWidth ? "sm:col-span-2" : undefined)}
          >
            <dt className="text-sm font-medium text-wt-text-muted">{entry.label}</dt>
            <dd className="mt-1.5 text-sm font-medium text-wt-text break-words">
              <ProfileFieldValue entry={entry} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-wt-border">
      <WtTable>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.label} className="hover:bg-transparent">
              <TableCell className={cn(DETAIL_LABEL_CELL_CLASS, "bg-wt-surface-2/40")}>
                {entry.label}
              </TableCell>
              <TableCell className={DETAIL_VALUE_CELL_CLASS}>
                <ProfileFieldValue entry={entry} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </WtTable>
    </div>
  );
}
