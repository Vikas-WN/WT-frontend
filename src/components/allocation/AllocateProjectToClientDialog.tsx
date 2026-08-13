"use client";

import { useEffect, useMemo, useState } from "react";
import { SelectField } from "@/components/dashboard/ui/forms";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { useHrProjects, HR_PROJECTS_QUERY_KEY } from "@/hooks/allocation/useHrProjects";
import { hrmsService } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { isHrCreatedProjectCode } from "@/utils/projectPicker";
import type { ClientRecord } from "@/types/client";
import { useQueryClient } from "@tanstack/react-query";

export function AllocateProjectToClientDialog({
  open,
  client,
  onClose,
  onSaved,
}: {
  open: boolean;
  client: ClientRecord | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);

  const projectsQ = useHrProjects(open && Boolean(client));
  const pickerRows = projectsQ.data?.pickerRows ?? [];

  useEffect(() => {
    if (!open) {
      setProjectId("");
      setLoading(false);
    }
  }, [open]);

  const projectOptions = useMemo(() => {
    if (!client) return [];
    return pickerRows
      .filter((row) => {
        if (!row.id || !isHrCreatedProjectCode(row.code)) return false;
        // Only unallocated projects, or already linked to this client (idempotent).
        const sameNumericId =
          row.client_id != null &&
          /^\d+$/.test(String(client.id)) &&
          row.client_id === Number(client.id);
        const catalogClientName = row.client_name?.trim().toLowerCase() ?? "";
        const sameName = Boolean(catalogClientName) && catalogClientName === client.name.trim().toLowerCase();
        return row.client_id == null || sameNumericId || sameName;
      })
      .map((row) => ({
        value: String(row.id),
        label: row.name,
      }));
  }, [pickerRows, client]);

  async function handleSubmit() {
    if (!client) return;
    const id = Number(projectId);
    if (!Number.isFinite(id) || id <= 0) {
      showErrorToast("Select a project to allocate.");
      return;
    }

    setLoading(true);
    try {
      await hrmsService.allocateProjectToClient(id, client.id);
      showSuccessToast(`Project allocated to ${client.name}.`);
      await queryClient.invalidateQueries({ queryKey: HR_PROJECTS_QUERY_KEY });
      await onSaved();
      onClose();
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Could not allocate project to client."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <WtFormDialog
      open={open && Boolean(client)}
      title="Allocate project"
      description={
        client
          ? `Choose an unallocated project to link with ${client.name}.`
          : undefined
      }
      onClose={onClose}
      onSubmit={() => void handleSubmit()}
      submitLabel="Allocate project"
      submittingLabel="Allocating…"
      loading={loading}
      submitDisabled={!projectId || loading || projectsQ.isLoading}
      maxWidthClass="max-w-lg"
    >
      {client ? (
        <div className="mb-4 rounded-xl border border-wt-border bg-wt-surface-2/50 px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-muted">
            Client
          </p>
          <p className="mt-0.5 text-sm font-semibold text-wt-text">{client.name}</p>
          {client.accountManagerName || client.accountManagerEmail ? (
            <p className="mt-1 text-xs text-wt-text-muted">
              AM: {client.accountManagerName || client.accountManagerEmail}
            </p>
          ) : null}
        </div>
      ) : null}
      <FormSection title="Project">
        <SelectField
          label="Project"
          required
          value={projectId}
          loading={projectsQ.isLoading}
          loadingLabel="Loading projects…"
          placeholder={
            projectOptions.length
              ? "Search projects"
              : "No unallocated projects available"
          }
          options={projectOptions}
          onChange={setProjectId}
          disabled={loading || projectsQ.isLoading || !projectOptions.length}
        />
      </FormSection>
    </WtFormDialog>
  );
}
