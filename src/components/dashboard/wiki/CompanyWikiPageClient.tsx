"use client";

import { WikiSpacePageClient } from "@/components/dashboard/wiki/WikiSpacePageClient";

export function CompanyWikiPageClient() {
  return (
    <WikiSpacePageClient
      space="WIKI"
      title="Company Wiki"
      description="KT docs, how-tos, and team notes — anyone can add or improve a page."
    />
  );
}
