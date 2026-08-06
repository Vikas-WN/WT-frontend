import type { Metadata } from "next";
import { ExitSurveyMagicLinkClient } from "@/components/exit-interview/ExitSurveyMagicLinkClient";

export const metadata: Metadata = {
  title: "Exit Survey — WebTrak",
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function ExitSurveyMagicLinkPage({ params }: PageProps) {
  const { token } = await params;
  return <ExitSurveyMagicLinkClient token={token} />;
}
