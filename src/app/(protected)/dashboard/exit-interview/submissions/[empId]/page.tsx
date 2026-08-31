"use client";

import { useParams } from "next/navigation";
import { ExitInterviewSubmissionDetailPageClient } from "@/components/exit-interview/ExitInterviewSubmissionDetailPageClient";

export default function ExitInterviewSubmissionDetailPage() {
  const params = useParams();
  // useParams already decodes the route segment; decoding again corrupts ids containing "%".
  const lookupId = String(params?.empId ?? "").trim();

  return <ExitInterviewSubmissionDetailPageClient lookupId={lookupId} />;
}
