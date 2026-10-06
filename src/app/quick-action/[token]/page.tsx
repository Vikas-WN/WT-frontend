import type { Metadata } from "next";

import { QuickActionClient } from "@/components/quick-action/QuickActionClient";

export const metadata: Metadata = {
  title: "Review request — WebTrak",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function QuickActionPage({ params }: PageProps) {
  const { token } = await params;
  return <QuickActionClient token={token} />;
}
