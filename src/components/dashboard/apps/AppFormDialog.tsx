"use client";

import { useEffect, useState } from "react";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ASSIGNABLE_APP_ROLES } from "@/constants/appKeyRoles";
import { formatRoleLabel } from "@/utils/roles";
import type { AppKeyResponse } from "@/types/apiKey";

type Mode = "create" | "edit";

export type AppFormValue = {
  name: string;
  description: string;
  expiresAt: string; // yyyy-mm-dd (empty for none)
  roles: string[];
};

export function AppFormDialog({
  open,
  mode,
  initial,
  loading,
  onClose,
  onSubmit,
  showRoles = true,
}: {
  open: boolean;
  mode: Mode;
  initial?: AppKeyResponse | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (value: AppFormValue) => void;
  /** Hide roles editor in edit mode (roles are edited on the detail page). */
  showRoles?: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setExpiresAt(initial?.expires_at ? initial.expires_at.slice(0, 10) : "");
    setRoles(initial?.roles ?? []);
  }, [open, initial]);

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      expiresAt: expiresAt,
      roles,
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <WtFormDialog
      open={open}
      title={mode === "create" ? "Create App" : "Edit App"}
      description={
        mode === "create"
          ? "Issue a new bearer key. The full value is shown once, after creation."
          : "Update basic details. Manage roles from the app detail page."
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={mode === "create" ? "Create" : "Save"}
      submittingLabel={mode === "create" ? "Creating…" : "Saving…"}
      submitDisabled={!canSubmit}
      loading={loading}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="app-name">Name</Label>
          <Input
            id="app-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Reporting Sync"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="app-description">Description</Label>
          <Textarea
            id="app-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this key used for?"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="app-expires">
            Expires on <span className="text-wt-text-muted">(optional)</span>
          </Label>
          <Input
            id="app-expires"
            type="date"
            value={expiresAt}
            min={today}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        {showRoles ? (
          <div className="space-y-2">
            <Label>Roles</Label>
            <p className="text-xs text-wt-text-muted">
              Endpoints check the caller's roles — grant only what this key needs. ROLE_ADMIN is not assignable to keys.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ASSIGNABLE_APP_ROLES.map((role) => {
                const checked = roles.includes(role);
                return (
                  <label
                    key={role}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-wt-border bg-wt-surface-2 px-3 py-2 text-sm text-wt-text hover:bg-wt-surface-3"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleRole(role)} />
                    <span>{formatRoleLabel(role)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </WtFormDialog>
  );
}
