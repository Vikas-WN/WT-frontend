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
      description={`Revoke "${appName}"?`}
      onClose={onClose}
      onSubmit={onConfirm}
      submitLabel="Revoke"
      submittingLabel="Revoking…"
      loading={loading}
    >
      <></>
    </WtFormDialog>
  );
}
