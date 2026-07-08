import { redirect } from "next/navigation";
import { DASHBOARD_ROUTES } from "@/constants/routes";

export default function ExitInterviewSubmissionsPage() {
  redirect(DASHBOARD_ROUTES.offboarding);
}
