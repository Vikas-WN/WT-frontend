"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileFieldGrid } from "@/components/employee-directory/ProfileFieldGrid";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import {
  buildProfileViewSections,
  type ProfileDisplaySection,
} from "@/utils/employeeDirectory";
import { cn } from "@/lib/utils";

export function ProfileSectionsView({
  profile,
  resumeShareHref,
  sections: sectionsOverride,
  includeDateOfBirth = false,
  currentAllocationSummary,
}: {
  profile: Record<string, unknown>;
  resumeShareHref?: string | null;
  sections?: ProfileDisplaySection[];
  /** When true (Personal → Profile), show Date of Birth. Directory HR view omits it. */
  includeDateOfBirth?: boolean;
  /** Current project allocation summary for Work Information. */
  currentAllocationSummary?: string | null;
  layout?: "stack" | "split";
}) {
  const sections =
    sectionsOverride ??
    buildProfileViewSections(profile, resumeShareHref, {
      includeDateOfBirth,
      currentAllocationSummary,
    });

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-stretch">
      {sections.map((section, index) => (
        <Card
          key={section.title}
          className={cn(
            "flex h-full w-full flex-col overflow-hidden p-0 wt-soft-in",
            CONTENT_CARD_CLASS
          )}
          style={{ animationDelay: `${Math.min(index, 4) * 40}ms` }}
        >
          <CardHeader className="space-y-1 px-5 py-4 sm:px-6">
            <CardTitle className="text-base tracking-tight">{section.title}</CardTitle>
            <p className="text-xs text-wt-text-muted">Key details for this section</p>
          </CardHeader>
          <Separator />
          <CardContent className="flex flex-1 flex-col px-5 py-4 sm:px-6">
            <ProfileFieldGrid entries={section.entries} variant="dashboard" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
