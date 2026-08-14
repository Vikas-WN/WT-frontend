import { redirect } from "next/navigation";
import { PULSE_EXTERNAL_URL } from "@/constants/dashboardNavigation";

export default function PulsePage() {
  redirect(PULSE_EXTERNAL_URL);
}
