"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, RotateCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import {
  ManagementListCard,
  ManagementListContent,
} from "@/components/dashboard/ui/ManagementListCard";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { WtStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { useAuth } from "@/context/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatRoleLabel } from "@/utils/roles";
import {
  useAppsList,
  useCreateApp,
  useRevokeApp,
  useRotateApp,
} from "@/hooks/apps/useApps";
import { AppFormDialog, type AppFormValue } from "@/components/dashboard/apps/AppFormDialog";
import { RevealSecretDialog } from "@/components/dashboard/apps/RevealSecretDialog";
import { RevokeAppDialog } from "@/components/dashboard/apps/RevokeAppDialog";
import type { AppKeyResponse } from "@/types/apiKey";

const PAGE_SIZE = 20;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function AppsPageClient() {
  const router = useRouter();
  const { user, status: authStatus } = useAuth();
  const roles = user?.roles ?? [];
  const canView = roles.includes("ROLE_ADMIN");
  const queriesEnabled = authStatus === "authenticated" && canView;

  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useAppsList(
    debounced.trim(),
    page,
    PAGE_SIZE,
    queriesEnabled,
  );

  const createApp = useCreateApp();
  const rotateApp = useRotateApp();
  const revokeApp = useRevokeApp();

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AppKeyResponse | null>(null);
  const [revealKey, setRevealKey] = useState<string>("");

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const handleCreate = async (value: AppFormValue) => {
    try {
      const result = await createApp.mutateAsync({
        name: value.name,
        description: value.description || null,
        expires_at: value.expiresAt
          ? new Date(`${value.expiresAt}T23:59:59`).toISOString()
          : null,
        roles: value.roles,
      });
      setCreateOpen(false);
      setRevealKey(result.full_key);
      showSuccessToast("App created");
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to create app");
    }
  };

  const handleRotate = async (app: AppKeyResponse) => {
    try {
      const result = await rotateApp.mutateAsync(app.id);
      setRevealKey(result.full_key);
      showSuccessToast(`Rotated ${app.name}`);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to rotate key");
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeApp.mutateAsync(revokeTarget.id);
      showSuccessToast(`Revoked ${revokeTarget.name}`);
      setRevokeTarget(null);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to revoke app");
    }
  };

  if (authStatus !== "loading" && !canView) {
    return (
      <DashboardPageShell>
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 shadow-sm">
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="mt-2 text-sm text-wt-text-muted">
            The Apps management page is available to admins only.
          </p>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell className="wt-detail-page">
      <ManagementListCard
        density="compact"
        title="Apps"
        description="Issue and manage API bearer tokens (wtak_…) for external systems."
        headerAction={
          <div className="flex items-center gap-2">
            <RefreshIconButton onClick={() => void refetch()} loading={isLoading || isFetching} />
            <Button variant="brand" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Create App
            </Button>
          </div>
        }
        search={
          <SearchInput
            id="apps-search"
            value={search}
            onChange={(v) => {
              setPage(1);
              setSearch(v);
            }}
            placeholder="Search by name or description"
            aria-label="Search apps"
            className="h-9 border-wt-border bg-wt-surface-1 shadow-sm"
          />
        }
      >
        <ManagementListContent
          isLoading={isLoading && rows.length === 0}
          isEmpty={!isLoading && rows.length === 0}
          emptyTitle="No apps yet"
          emptyDescription={'Click "Create App" to issue the first key.'}
          skeletonColumns={8}
        >
          <WtTable className="w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/apps/${app.id}`)}
                  >
                    <TableCell className="font-medium text-wt-text">{app.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-wt-surface-2 px-1.5 py-0.5 font-mono text-xs">
                        {app.key_prefix}…
                      </code>
                    </TableCell>
                    <TableCell>
                      {app.roles.length === 0 ? (
                        <span className="text-wt-text-muted">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {app.roles.map((r) => (
                            <Badge key={r} variant="secondary">
                              {formatRoleLabel(r)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <WtStatusBadge tone={app.is_active ? "success" : "neutral"}>
                        {app.is_active ? "Active" : "Revoked"}
                      </WtStatusBadge>
                    </TableCell>
                    <TableCell>{formatDate(app.created_at)}</TableCell>
                    <TableCell>
                      {app.created_by?.name ?? app.created_by?.email ?? "—"}
                    </TableCell>
                    <TableCell>{formatDate(app.last_used_at)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Rotate"
                          disabled={!app.is_active || rotateApp.isPending}
                          onClick={() => void handleRotate(app)}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          onClick={() => router.push(`/dashboard/apps/${app.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Revoke"
                          disabled={!app.is_active}
                          onClick={() => setRevokeTarget(app)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </WtTable>

          <div className="mt-3">
            <ListPagination
              page={page - 1}
              totalPages={totalPages}
              totalItems={total}
              pageSize={PAGE_SIZE}
              onPageChange={(next) => setPage(next + 1)}
            />
          </div>
        </ManagementListContent>
      </ManagementListCard>

      <AppFormDialog
        open={createOpen}
        mode="create"
        loading={createApp.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <RevealSecretDialog
        open={revealKey.length > 0}
        fullKey={revealKey}
        onClose={() => setRevealKey("")}
      />

      <RevokeAppDialog
        open={revokeTarget !== null}
        appName={revokeTarget?.name ?? ""}
        loading={revokeApp.isPending}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </DashboardPageShell>
  );
}
