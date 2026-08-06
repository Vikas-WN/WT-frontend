"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil, RotateCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { WtStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatRoleLabel } from "@/utils/roles";
import { ASSIGNABLE_APP_ROLES } from "@/constants/appKeyRoles";
import {
  useApp,
  useRevokeApp,
  useRotateApp,
  useUpdateApp,
  useUpdateAppRoles,
} from "@/hooks/apps/useApps";
import { AppFormDialog, type AppFormValue } from "@/components/dashboard/apps/AppFormDialog";
import { RevealSecretDialog } from "@/components/dashboard/apps/RevealSecretDialog";
import { RevokeAppDialog } from "@/components/dashboard/apps/RevokeAppDialog";

type Tab = "details" | "roles";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function AppDetailPageClient({ appId }: { appId: number }) {
  const router = useRouter();
  const { user, status: authStatus } = useAuth();
  const roles = user?.roles ?? [];
  const canView = roles.includes("ROLE_ADMIN");

  const { data: app, isLoading } = useApp(canView ? appId : null);
  const updateApp = useUpdateApp(appId);
  const updateRoles = useUpdateAppRoles(appId);
  const revokeApp = useRevokeApp();
  const rotateApp = useRotateApp();

  const [tab, setTab] = useState<Tab>("details");
  const [editOpen, setEditOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revealKey, setRevealKey] = useState("");
  const [draftRoles, setDraftRoles] = useState<string[]>([]);

  useEffect(() => {
    setDraftRoles(app?.roles ?? []);
  }, [app?.roles]);

  const rolesDirty = useMemo(
    () =>
      JSON.stringify([...draftRoles].sort()) !==
      JSON.stringify([...(app?.roles ?? [])].sort()),
    [draftRoles, app?.roles],
  );

  if (authStatus !== "loading" && !canView) {
    return (
      <DashboardPageShell>
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 shadow-sm">
          <h3 className="text-lg font-semibold">Access Restricted</h3>
        </div>
      </DashboardPageShell>
    );
  }

  if (isLoading || !app) {
    return (
      <DashboardPageShell>
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 text-sm text-wt-text-muted">
          Loading…
        </div>
      </DashboardPageShell>
    );
  }

  const handleEditSubmit = async (value: AppFormValue) => {
    try {
      await updateApp.mutateAsync({
        name: value.name,
        description: value.description || null,
        expires_at: value.expiresAt
          ? new Date(`${value.expiresAt}T23:59:59`).toISOString()
          : null,
      });
      setEditOpen(false);
      showSuccessToast("App updated");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to update app");
    }
  };

  const handleRotate = async () => {
    try {
      const result = await rotateApp.mutateAsync(app.id);
      setRevealKey(result.full_key);
      showSuccessToast(`Rotated ${app.name}`);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to rotate key");
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeApp.mutateAsync(app.id);
      setRevokeOpen(false);
      showSuccessToast(`Revoked ${app.name}`);
      router.push("/dashboard/apps");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to revoke app");
    }
  };

  const handleSaveRoles = async () => {
    try {
      await updateRoles.mutateAsync({ roles: draftRoles });
      showSuccessToast("Roles updated");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to update roles");
    }
  };

  const toggleRole = (role: string) => {
    setDraftRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  return (
    <DashboardPageShell className="wt-detail-page space-y-4">
      <Link
        href="/dashboard/apps"
        className="inline-flex items-center gap-1 text-sm text-wt-text-muted hover:text-wt-text"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Apps
      </Link>

      <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-2xl font-semibold text-wt-text">{app.name}</h1>
              <WtStatusBadge tone={app.is_active ? "success" : "neutral"}>
                {app.is_active ? "Active" : "Revoked"}
              </WtStatusBadge>
            </div>
            {app.description ? (
              <p className="mt-2 text-sm text-wt-text-muted">{app.description}</p>
            ) : null}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
            <Button
              variant="brand"
              onClick={() => void handleRotate()}
              disabled={!app.is_active || rotateApp.isPending}
            >
              <RotateCw className="mr-1 h-4 w-4" /> Rotate Key
            </Button>
            <Button
              variant="outline"
              onClick={() => setRevokeOpen(true)}
              disabled={!app.is_active}
            >
              <XCircle className="mr-1 h-4 w-4" /> Revoke
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-wt-border">
        {(["details", "roles"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px px-1 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "border-b-2 border-[var(--wt-brand)] text-wt-text"
                : "text-wt-text-muted hover:text-wt-text"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm md:grid-cols-2">
          <Field label="API Key">
            <code className="rounded bg-wt-surface-2 px-1.5 py-0.5 font-mono text-xs">
              {app.key_prefix}…
            </code>
          </Field>
          <Field label="Roles">
            {app.roles.length === 0 ? (
              <span className="text-wt-text-muted">None</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {app.roles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {formatRoleLabel(r)}
                  </Badge>
                ))}
              </div>
            )}
          </Field>
          <Field label="Expires">{formatDate(app.expires_at)}</Field>
          <Field label="Last Used">{formatDate(app.last_used_at)}</Field>
          <Field label="Created">{formatDate(app.created_at)}</Field>
          <Field label="Created By">
            {app.created_by?.name ?? app.created_by?.email ?? "—"}
          </Field>
        </div>
      ) : (
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm">
          <p className="mb-3 text-sm text-wt-text-muted">
            Endpoints check the caller's roles — grant only what this key needs. ROLE_ADMIN is not assignable to keys.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ASSIGNABLE_APP_ROLES.map((role) => {
              const checked = draftRoles.includes(role);
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
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDraftRoles(app.roles)}
              disabled={!rolesDirty || updateRoles.isPending}
            >
              Reset
            </Button>
            <Button
              variant="brand"
              onClick={() => void handleSaveRoles()}
              disabled={!rolesDirty || updateRoles.isPending}
            >
              {updateRoles.isPending ? "Saving…" : "Save Roles"}
            </Button>
          </div>
        </div>
      )}

      <AppFormDialog
        open={editOpen}
        mode="edit"
        initial={app}
        loading={updateApp.isPending}
        showRoles={false}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <RevealSecretDialog
        open={revealKey.length > 0}
        fullKey={revealKey}
        onClose={() => setRevealKey("")}
      />

      <RevokeAppDialog
        open={revokeOpen}
        appName={app.name}
        loading={revokeApp.isPending}
        onClose={() => setRevokeOpen(false)}
        onConfirm={handleRevoke}
      />
    </DashboardPageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs uppercase tracking-wide text-wt-text-muted">{label}</Label>
      <div className="text-sm text-wt-text">{children}</div>
    </div>
  );
}
