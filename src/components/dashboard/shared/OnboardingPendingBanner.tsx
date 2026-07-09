import { BANNER_BODY_CLASS, BANNER_TITLE_CLASS, bannerLargeClass } from "@/components/dashboard/ui/bannerTones";

export function OnboardingPendingBanner() {
  return (
    <section className={bannerLargeClass("warning")}>
      <h3 className={BANNER_TITLE_CLASS}>Onboarding Pending</h3>
      <p className={BANNER_BODY_CLASS}>
        Open <strong>Profile</strong> at the bottom of the sidebar to complete onboarding and unlock
        full access.
      </p>
    </section>
  );
}
