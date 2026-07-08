import { redirect } from "next/navigation";
import { DASHBOARD_ROUTES } from "@/constants/routes";

export default async function ExitInterviewSubmissionDetailPage() {
  redirect(DASHBOARD_ROUTES.offboarding);
}
