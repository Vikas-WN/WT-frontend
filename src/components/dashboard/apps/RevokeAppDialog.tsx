"use client";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";

export function RevokeAppDialog({
  open,
  appName,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  appName: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <WtFormDialog
      open={open}
      title="Revoke app"
      description={`Revoke "${appName}"? The key will stop authenticating requests immediately. The row is soft-deleted and preserved for audit.`}
      onClose={onClose}
      onSubmit={onConfirm}
      submitLabel="Revoke"
      submittingLabel="Revoking…"
      loading={loading}
    >
      <p className="text-sm text-wt-text-muted">
        This cannot be undone via the UI. You can create a new key with the same roles if needed.
      </p>
    </WtFormDialog>
  );
}
