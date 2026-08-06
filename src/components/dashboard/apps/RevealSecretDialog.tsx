"use client";

import { useState } from "react";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { Button } from "@/components/ui/button";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

export function RevealSecretDialog({
  open,
  fullKey,
  onClose,
}: {
  open: boolean;
  fullKey: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!fullKey) return;
    try {
      await navigator.clipboard.writeText(fullKey);
      setCopied(true);
      showSuccessToast("Key copied to clipboard");
    } catch {
      showErrorToast("Copy failed — select the value manually");
    }
  };

  return (
    <WtFormDialog
      open={open}
      title="One-time key"
      description="Copy the full key now — it will not be shown again after you close this dialog."
      onClose={onClose}
      onSubmit={onClose}
      submitLabel="I've Saved My Key"
      submitDisabled={!copied}
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          For security, the full value is only displayed here. Store it in your secret manager before dismissing this dialog.
        </div>
        <div className="rounded-lg border border-wt-border bg-wt-surface-2 p-3">
          <code className="block break-all font-mono text-sm text-wt-text">{fullKey}</code>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? "Copied" : "Copy to clipboard"}
          </Button>
        </div>
      </div>
    </WtFormDialog>
  );
}
