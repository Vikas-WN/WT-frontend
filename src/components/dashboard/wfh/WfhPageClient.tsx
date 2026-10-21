"use client";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { OnboardingGate } from "@/components/dashboard/shared/OnboardingGate";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { WfhExceptionModal } from "@/components/dashboard/wfh/WfhExceptionModal";
import { WfhRequestSection } from "@/components/dashboard/wfh/WfhRequestSection";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { WFH_PAGE_COPY } from "@/constants/wfhRequest";
import { useWfhPage } from "@/hooks/wfh/useWfhPage";
import { cn } from "@/lib/utils";

/** Work from home: apply for a day, track and withdraw your requests, or ask HR for a custom exception. */
export function WfhPageClient() {
  const { requiresSelfOnboarding } = useDashboardAccess();
  const page = useWfhPage();

  return (
    <DashboardPageShell>
      <OnboardingGate requiresSelfOnboarding={requiresSelfOnboarding}>
        <PageHero raw title={WFH_PAGE_COPY.title} description={WFH_PAGE_COPY.description} />
        <section className={cn(CONTENT_CARD_CLASS, "p-5 sm:p-6")}>
          <WfhRequestSection
            showHrReviewNotice={page.submitsToHrForReview}
            tab={page.tab}
            onTabChange={page.setTab}
            actions={page.actions}
            busy={page.busy}
            form={{
              form: page.form,
              onFormChange: page.setForm,
              managerEmails: page.managerEmails,
              onManagerEmailsChange: page.setManagerEmails,
              editing: page.editing,
              busy: page.busy,
              projectsLoading: page.allocationsLoading,
              requiresClientApproval: page.requiresClientApproval,
              routesToHr: page.routesToHr,
              onOpenException: () => page.setExceptionOpen(true),
            }}
            history={page.history}
          />
        </section>
        <WfhExceptionModal open={page.exceptionOpen} onClose={() => page.setExceptionOpen(false)} onSubmit={page.submitException} />
        <ConfirmDialog
          open={Boolean(page.confirmState)}
          title={page.confirmState?.title ?? ""}
          description={page.confirmState?.description}
          confirmLabel={page.confirmState?.confirmLabel ?? "Confirm"}
          tone={page.confirmState?.tone ?? "default"}
          loading={page.busy}
          onCancel={page.closeConfirm}
          onConfirm={page.confirmPending}
        />
      </OnboardingGate>
    </DashboardPageShell>
  );
}
