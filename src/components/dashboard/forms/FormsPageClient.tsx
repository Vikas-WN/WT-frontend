"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { FormBuilderDialog } from "@/components/dashboard/forms/FormBuilderDialog";
import { FormCard } from "@/components/dashboard/forms/FormCard";
import { FormFillDialog } from "@/components/dashboard/forms/FormFillDialog";
import { FormResponsesDialog } from "@/components/dashboard/forms/FormResponsesDialog";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ManagementListContent } from "@/components/dashboard/ui/ManagementListCard";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { PageTabs } from "@/components/dashboard/ui/PageTabs";
import { Button } from "@/components/ui/button";
import { ANNOUNCEMENT_POSTER_ROLES } from "@/constants/announcements";
import { FORM_COPY } from "@/constants/forms";
import { useAuth } from "@/context/AuthContext";
import { useManagedForms, useMyForms } from "@/hooks/forms/useForms";

type Tab = "to-fill" | "sent";

export function FormsPageClient() {
  const { user } = useAuth();
  const canSend = ANNOUNCEMENT_POSTER_ROLES.some((role) => (user?.roles ?? []).includes(role));
  const focusedId = Number(useSearchParams().get("formId")) || null;

  const [tab, setTab] = useState<Tab>("to-fill");
  const [building, setBuilding] = useState(false);
  const [filling, setFilling] = useState<number | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);

  const mine = useMyForms();
  const sent = useManagedForms(canSend);
  const todo = useMemo(() => (mine.data ?? []).filter((f) => !f.submitted && !f.is_closed).length, [mine.data]);

  // Arriving from a notification: open that form once.
  const opened = useRef<number | null>(null);
  useEffect(() => {
    if (!focusedId || opened.current === focusedId || !(mine.data ?? []).some((f) => f.id === focusedId)) return;
    opened.current = focusedId;
    setFilling(focusedId);
  }, [focusedId, mine.data]);

  return (
    <DashboardPageShell>
      <PageHero
        title={FORM_COPY.pageTitle}
        description={FORM_COPY.pageDescription}
        action={
          canSend ? (
            <Button type="button" variant="brand" onClick={() => setBuilding(true)}>
              <Plus className="size-4" /> {FORM_COPY.create}
            </Button>
          ) : undefined
        }
      />
      {canSend ? (
        <PageTabs
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
          items={[
            { value: "to-fill", label: todo > 0 ? `${FORM_COPY.tabToFill} (${todo})` : FORM_COPY.tabToFill },
            { value: "sent", label: FORM_COPY.tabSent },
          ]}
        />
      ) : null}

      {tab === "sent" && canSend ? (
        <ManagementListContent isLoading={sent.isLoading} isEmpty={(sent.data ?? []).length === 0} emptyTitle={FORM_COPY.emptySentTitle} emptyDescription={FORM_COPY.emptySentDescription}>
          <div className="space-y-3">
            {(sent.data ?? []).map((form) => (
              <FormCard key={form.id} form={form} mode="sent" onOpen={(f) => setViewing(f.id)} />
            ))}
          </div>
        </ManagementListContent>
      ) : (
        <ManagementListContent isLoading={mine.isLoading} isEmpty={(mine.data ?? []).length === 0} emptyTitle={FORM_COPY.emptyToFillTitle} emptyDescription={FORM_COPY.emptyToFillDescription}>
          <div className="space-y-3">
            {(mine.data ?? []).map((form) => (
              <FormCard key={form.id} form={form} mode="mine" highlighted={form.id === focusedId} onOpen={(f) => setFilling(f.id)} />
            ))}
          </div>
        </ManagementListContent>
      )}

      {building ? <FormBuilderDialog onClose={() => setBuilding(false)} /> : null}
      {filling != null ? <FormFillDialog formId={filling} onClose={() => setFilling(null)} /> : null}
      {viewing != null ? <FormResponsesDialog formId={viewing} onClose={() => setViewing(null)} /> : null}
    </DashboardPageShell>
  );
}
