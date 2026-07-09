import { bannerClass } from "@/components/dashboard/ui/bannerTones";

export function PortalLockedBanner() {
  return (
    <div className={bannerClass("warning")}>
      Your last working day has been reached. Your portal is now read-only after submitting the exit
      survey.
    </div>
  );
}
