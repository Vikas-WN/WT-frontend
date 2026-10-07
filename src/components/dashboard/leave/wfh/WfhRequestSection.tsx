"use client";

import type { ComponentProps } from "react";

import { HrReviewNoticeBanner } from "@/components/hr-review/HrReviewNoticeBanner";
import { MyLeaveRequestsView } from "@/components/dashboard/leave/MyLeaveRequestsView";
import { WfhApplyForm } from "@/components/dashboard/leave/wfh/WfhApplyForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WFH_COPY } from "@/constants/wfhRequest";
import type { WfhRequestActions } from "@/components/dashboard/leave/wfh/useWfhRequestActions";

type WfhTab = "request" | "view";
type HistoryProps = ComponentProps<typeof MyLeaveRequestsView>;
type FormProps = ComponentProps<typeof WfhApplyForm>;

interface WfhRequestSectionProps {
  showHrReviewNotice: boolean;
  tab: WfhTab;
  onTabChange: (tab: WfhTab) => void;
  actions: WfhRequestActions;
  /** The apply form, minus the handlers this section wires from `actions`. */
  form: Omit<FormProps, "onSubmit" | "onCancelEdit">;
  /** The history table, minus the handlers this section wires from `actions`. */
  history: Omit<HistoryProps, "onEdit" | "onRevoke" | "onRefresh" | "showRequestType" | "actionLoading">;
  busy: boolean;
}

/** The employee's Work-From-Home tab: apply for a day, or review past requests. */
export function WfhRequestSection({
  showHrReviewNotice,
  tab,
  onTabChange,
  actions,
  form,
  history,
  busy,
}: WfhRequestSectionProps) {
  return (
    <div className="space-y-6">
      {showHrReviewNotice ? <HrReviewNoticeBanner /> : null}
      <Tabs value={tab} onValueChange={(v) => onTabChange(v as WfhTab)} orientation="horizontal">
        <TabsList variant="line" className="w-full justify-start border-b border-wt-border/80">
          <TabsTrigger value="request">{WFH_COPY.applyTab}</TabsTrigger>
          <TabsTrigger value="view">{WFH_COPY.historyTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="request" className="pt-6">
          <WfhApplyForm {...form} onSubmit={actions.submit} onCancelEdit={actions.cancelEdit} />
        </TabsContent>
        <TabsContent value="view" className="pt-3">
          <MyLeaveRequestsView
            {...history}
            showRequestType
            actionLoading={busy}
            onRefresh={actions.refresh}
            onEdit={actions.editRow}
            onRevoke={actions.revokeRow}
            onCancel={actions.cancelRow}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
