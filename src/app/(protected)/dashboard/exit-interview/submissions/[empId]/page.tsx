"use client";

import { useParams } from "next/navigation";
import { ExitInterviewSubmissionDetailPageClient } from "@/components/exit-interview/ExitInterviewSubmissionDetailPageClient";

export default function ExitInterviewSubmissionDetailPage() {
  const params = useParams();
  const lookupId = decodeURIComponent(String(params?.empId ?? "").trim());

  return <ExitInterviewSubmissionDetailPageClient lookupId={lookupId} />;
}
