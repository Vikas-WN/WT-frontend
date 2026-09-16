"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  History,
  Package,
  PackageCheck,
  PackageX,
  Pencil,
  Plus,
  QrCode,
  RotateCcw,
  ScanLine,
  Trash2,
  Upload,
  UserPlus,
  Wrench,
} from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { MetricCard } from "@/components/dashboard/ui/MetricCard";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { InputField, SelectField, TextAreaField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { ApiError } from "@/api/error";
import { hrmsService } from "@/services/hrms.service";
import type {
  AssetAssignmentHistoryItem,
  AssetItem,
  AssetRosterEmployee,
  AssetStats,
  AssetStatus,
} from "@/types/asset";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";
import { cn } from "@/lib/utils";
import { AssetQrDialog } from "@/components/dashboard/assets/AssetQrDialog";
import { AssetQrScanDialog, type AssetQrScanCloseReason } from "@/components/dashboard/assets/AssetQrScanDialog";
import { AssetScanResultDialog } from "@/components/dashboard/assets/AssetScanResultDialog";
import { ASSET_STATUS_LABELS, ASSET_STATUS_ORDER, ASSET_STATUS_TONE, statusLabel } from "@/utils/assetStatus";

type Load<T> = { status: "loading" | "done" | "error"; data: T | null };

/** File-local copy of the small async-fetch hook used across dashboard
 *  pages — see HomePageClient's own copy for why it isn't shared. */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading", data: null });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await fn();
        if (alive) setState({ status: "done", data });
      } catch {
        if (alive) setState({ status: "error", data: null });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

const STATUS_OPTIONS: { value: AssetStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  ...ASSET_STATUS_ORDER.map((value) => ({ value, label: ASSET_STATUS_LABELS[value] })),
];

const NEXT_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available (back on the shelf)" },
  { value: "IN_REPAIR", label: "In Repair" },
  { value: "RETIRED", label: "Retired" },
  { value: "LOST", label: "Lost" },
];

// Direct status edits (via the Edit dialog) — ASSIGNED is owned by assign/return.
const EDITABLE_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_REPAIR", label: "In Repair" },
  { value: "RETIRED", label: "Retired" },
  { value: "LOST", label: "Lost" },
];

type FormState = {
  assetTag: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  notes: string;
  status: string;
};

const EMPTY_FORM: FormState = {
  assetTag: "",
  category: "",
  brand: "",
  model: "",
  serialNumber: "",
  notes: "",
  status: "AVAILABLE",
};

function formFromAsset(asset: AssetItem): FormState {
  return {
    assetTag: asset.asset_tag,
    category: asset.category,
    brand: asset.brand ?? "",
    model: asset.model ?? "",
    serialNumber: asset.serial_number ?? "",
    notes: asset.notes ?? "",
    status: asset.status,
  };
}

export function AssetTrackingPageClient() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "">("");
  const [listTick, setListTick] = useState(0);
  const refresh = useCallback(() => setListTick((t) => t + 1), []);

  const listQuery = useLoad(
    () =>
      hrmsService.listAssets({
        size: 100,
        category: category || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
    [category, statusFilter, search, listTick]
  );
  const categoriesQuery = useLoad(() => hrmsService.listAssetCategories(), [listTick]);
  const statsQuery = useLoad(() => hrmsService.getAssetStats(), [listTick]);
  const assets: AssetItem[] = listQuery.data?.data?.data ?? [];
  const stats: AssetStats | null = statsQuery.data?.data ?? null;

  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; row?: AssetItem } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AssetItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [assignTarget, setAssignTarget] = useState<AssetItem | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignResults, setAssignResults] = useState<AssetRosterEmployee[]>([]);
  const [assignSelected, setAssignSelected] = useState<AssetRosterEmployee | null>(null);
  const [assignCondition, setAssignCondition] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const [returnTarget, setReturnTarget] = useState<AssetItem | null>(null);
  const [returnCondition, setReturnCondition] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnNextStatus, setReturnNextStatus] = useState("AVAILABLE");
  const [returning, setReturning] = useState(false);

  const [historyTarget, setHistoryTarget] = useState<AssetItem | null>(null);
  const [historyItems, setHistoryItems] = useState<AssetAssignmentHistoryItem[] | null>(null);
  const [historyStatus, setHistoryStatus] = useState<"loading" | "done" | "error">("loading");

  const [qrAsset, setQrAsset] = useState<AssetItem | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanResult, setScanResult] = useState<AssetItem | null>(null);
  const pendingScanResultRef = useRef<AssetItem | null>(null);
  const scanSessionRef = useRef(0);

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Assignee search inside the Assign dialog — debounced, triggered by user typing.
  useEffect(() => {
    if (!assignTarget) return;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await hrmsService.searchAssetRoster(assignSearch);
          setAssignResults(res.data ?? []);
        } catch {
          setAssignResults([]);
        }
      })();
    }, 250);
    return () => window.clearTimeout(handle);
  }, [assignTarget, assignSearch]);

  const categoryOptions = useMemo(() => {
    const cats: string[] = categoriesQuery.data?.data ?? [];
    return [{ value: "", label: "All categories" }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [categoriesQuery.data]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialog({ mode: "add" });
  };

  const openEdit = (row: AssetItem) => {
    setForm(formFromAsset(row));
    setFormError(null);
    setDialog({ mode: "edit", row });
  };

  const submit = async () => {
    if (!form.assetTag.trim() || !form.category.trim()) {
      setFormError("Asset tag and category are required.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      if (dialog?.mode === "edit" && dialog.row) {
        await hrmsService.updateAsset(dialog.row.id, {
          category: form.category.trim(),
          brand: form.brand.trim() || null,
          model: form.model.trim() || null,
          serial_number: form.serialNumber.trim() || null,
          notes: form.notes.trim() || null,
          ...(dialog.row.status !== "ASSIGNED"
            ? { status: form.status as "AVAILABLE" | "IN_REPAIR" | "RETIRED" | "LOST" }
            : {}),
        });
        notifySuccess("Asset updated.");
        setDialog(null);
      } else {
        const created = await hrmsService.createAsset({
          asset_tag: form.assetTag.trim(),
          category: form.category.trim(),
          brand: form.brand.trim() || null,
          model: form.model.trim() || null,
          serial_number: form.serialNumber.trim() || null,
          notes: form.notes.trim() || null,
        });
        notifySuccess("Asset added.");
        setDialog(null);
        if (created.data) setQrAsset(created.data);
      }
      refresh();
    } catch (error) {
      setFormError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError
            ? error.message
            : dialog?.mode === "edit"
              ? "Couldn't update this asset."
              : "Couldn't add this asset."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await hrmsService.deleteAsset(deleteTarget.id);
      notifySuccess("Asset deleted.");
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't delete this asset."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  const openAssign = useCallback((asset: AssetItem) => {
    setAssignTarget(asset);
    setAssignSearch("");
    setAssignResults([]);
    setAssignSelected(null);
    setAssignCondition("");
    setAssignNotes("");
    setAssignError(null);
  }, []);

  const handleScannedTag = useCallback(async (tag: string): Promise<string | null> => {
    const session = scanSessionRef.current;
    try {
      const res = await hrmsService.getAssetByTag(tag);
      if (session !== scanSessionRef.current) return null;
      const asset = res.data;
      if (!asset) return "No asset matches that QR.";
      pendingScanResultRef.current = asset;
      return null;
    } catch (error) {
      if (session !== scanSessionRef.current) return null;
      return toUserFriendlyApiErrorMessage(
        error,
        error instanceof ApiError ? error.message : "No asset matches that QR."
      );
    }
  }, []);

  const openScan = () => {
    pendingScanResultRef.current = null;
    scanSessionRef.current += 1;
    setScanOpen(true);
  };

  const closeScanDialog = (reason: AssetQrScanCloseReason) => {
    scanSessionRef.current += 1;
    const next = pendingScanResultRef.current;
    pendingScanResultRef.current = null;
    setScanOpen(false);
    if (reason === "commit" && next) setScanResult(next);
  };

  const dismissScanResult = () => setScanResult(null);

  const submitAssign = async () => {
    if (!assignTarget) return;
    if (!assignSelected) {
      setAssignError("Pick an employee.");
      return;
    }
    setAssignError(null);
    setAssigning(true);
    try {
      await hrmsService.assignAsset(assignTarget.id, {
        emp_id: assignSelected.emp_id,
        condition: assignCondition.trim() || null,
        notes: assignNotes.trim() || null,
      });
      notifySuccess(`Assigned to ${assignSelected.name}.`);
      setAssignTarget(null);
      refresh();
    } catch (error) {
      setAssignError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't assign this asset."
        )
      );
    } finally {
      setAssigning(false);
    }
  };

  const openReturn = (asset: AssetItem) => {
    setReturnTarget(asset);
    setReturnCondition("");
    setReturnNotes("");
    setReturnNextStatus("AVAILABLE");
  };

  const submitReturn = async () => {
    if (!returnTarget) return;
    setReturning(true);
    try {
      await hrmsService.returnAsset(returnTarget.id, {
        condition: returnCondition.trim() || null,
        notes: returnNotes.trim() || null,
        next_status: returnNextStatus as "AVAILABLE" | "IN_REPAIR" | "RETIRED" | "LOST",
      });
      notifySuccess("Asset returned.");
      setReturnTarget(null);
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't return this asset."
        )
      );
    } finally {
      setReturning(false);
    }
  };

  const openHistory = async (asset: AssetItem) => {
    setHistoryTarget(asset);
    setHistoryStatus("loading");
    try {
      const res = await hrmsService.getAssetHistory(asset.id);
      setHistoryItems(res.data ?? []);
      setHistoryStatus("done");
    } catch {
      setHistoryItems(null);
      setHistoryStatus("error");
      notifyError("Couldn't load assignment history.");
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const res = await hrmsService.importAssetsCsv(file);
      notifySuccess(res.message ?? "Assets imported.");
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't import the CSV."
        )
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="flex flex-col gap-3 border-b border-wt-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-wt-text">Asset Tracking</h2>
            <p className="mt-1 text-sm text-wt-text-muted">
              Laptops, phones, chargers — everything the company owns and who has it.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <RefreshIconButton onClick={refresh} loading={listQuery.status === "loading"} />
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void handleImport(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="mr-1.5 size-4" />
              <span className="sm:hidden">{importing ? "…" : "CSV"}</span>
              <span className="hidden sm:inline">{importing ? "Importing…" : "Import CSV"}</span>
            </Button>
            <Button type="button" variant="outline" onClick={openScan}>
              <ScanLine className="mr-1.5 size-4" />
              <span className="sm:hidden">Scan</span>
              <span className="hidden sm:inline">Scan QR</span>
            </Button>
            <Button type="button" onClick={openAdd}>
              <Plus className="mr-1.5 size-4" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add asset</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {stats ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <MetricCard label="Total" value={stats.total} loading={false} icon={Boxes} />
              <MetricCard label="Available" value={stats.available} loading={false} icon={PackageCheck} />
              <MetricCard label="Assigned" value={stats.assigned} loading={false} icon={Package} />
              <MetricCard label="In Repair" value={stats.in_repair} loading={false} icon={Wrench} />
              <MetricCard label="Retired" value={stats.retired} loading={false} icon={PackageX} />
              <MetricCard label="Lost" value={stats.lost} loading={false} icon={PackageX} />
            </div>
          ) : statsQuery.status === "loading" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <MetricCard key={i} label="—" value={0} loading icon={Boxes} />
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearch(searchInput.trim());
              }}
              onBlur={() => setSearch(searchInput.trim())}
              placeholder="Search tag, brand, model, serial, holder…"
              className="flex-1"
            />
            <SelectField
              label="Category"
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              className="sm:w-48"
            />
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as AssetStatus | "")}
              options={STATUS_OPTIONS}
              className="sm:w-44"
            />
          </div>

          {listQuery.status === "loading" ? (
            <SectionLoading label="" />
          ) : listQuery.status === "error" ? (
            <EmptyState
              title="Couldn't Load Assets"
              className="py-12"
              action={
                <Button type="button" variant="outline" size="sm" onClick={refresh}>
                  Try again
                </Button>
              }
            />
          ) : assets.length === 0 ? (
            <EmptyState
              title="No Assets Yet"
              description="Add the company's first tracked asset."
              icon={<Package className="size-6" />}
              className="py-12"
            />
          ) : (
            <ScrollableTable maxHeightClass="max-h-[min(65vh,600px)]">
              <WtTable>
                <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Tag</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand / Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Holder</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="whitespace-nowrap font-medium text-wt-text">
                        {asset.asset_tag}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{asset.category}</TableCell>
                      <TableCell className="whitespace-nowrap text-wt-text-muted">
                        {[asset.brand, asset.model].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            ASSET_STATUS_TONE[asset.status]
                          )}
                        >
                          {statusLabel(asset.status)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-wt-text-muted">
                        {asset.holder ? asset.holder.name : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {asset.status === "AVAILABLE" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openAssign(asset)}
                            >
                              <UserPlus className="mr-1.5 size-3.5" /> Assign
                            </Button>
                          ) : asset.status === "ASSIGNED" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openReturn(asset)}
                            >
                              <RotateCcw className="mr-1.5 size-3.5" /> Return
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setQrAsset(asset)}
                            aria-label={`View QR for ${asset.asset_tag}`}
                          >
                            <QrCode className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(asset)}
                            aria-label={`Edit ${asset.asset_tag}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void openHistory(asset)}
                            aria-label={`History for ${asset.asset_tag}`}
                          >
                            <History className="size-3.5" />
                          </Button>
                          {asset.status !== "ASSIGNED" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteTarget(asset)}
                              aria-label={`Delete ${asset.asset_tag}`}
                            >
                              <Trash2 className="size-3.5 text-rose-600" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </WtTable>
            </ScrollableTable>
          )}
        </div>
      </ContentCard>

      {qrAsset ? <AssetQrDialog asset={qrAsset} onClose={() => setQrAsset(null)} /> : null}
      {scanOpen ? (
        <AssetQrScanDialog onClose={closeScanDialog} onTagScanned={handleScannedTag} />
      ) : null}
      {scanResult ? (
        <AssetScanResultDialog
          asset={scanResult}
          onClose={dismissScanResult}
          onAssign={() => {
            const asset = scanResult;
            dismissScanResult();
            openAssign(asset);
          }}
          onReturn={() => {
            const asset = scanResult;
            dismissScanResult();
            openReturn(asset);
          }}
          onEdit={() => {
            const asset = scanResult;
            dismissScanResult();
            openEdit(asset);
          }}
          onHistory={() => {
            const asset = scanResult;
            dismissScanResult();
            void openHistory(asset);
          }}
        />
      ) : null}

      {/* Add / edit asset */}
      {dialog ? (
        <div
          className={MODAL_OVERLAY_CLASS}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setDialog(null);
          }}
        >
          <div role="dialog" aria-modal="true" className={MODAL_PANEL_CLASS}>
            <div className={MODAL_HEADER_CLASS}>
              <h2 className="text-base font-semibold text-wt-text">
                {dialog.mode === "add" ? "Add asset" : `Edit ${dialog.row?.asset_tag}`}
              </h2>
            </div>
            <div className={MODAL_BODY_CLASS}>
              <div className="space-y-4">
                <InputField
                  label="Asset Tag"
                  value={form.assetTag}
                  onChange={(v) => setForm((f) => ({ ...f, assetTag: v }))}
                  required
                  disabled={dialog.mode === "edit"}
                  placeholder="e.g. LAP-0042"
                />
                <InputField
                  label="Category"
                  value={form.category}
                  onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  required
                  placeholder="Laptop, Phone, Charger, Monitor…"
                  list="asset-category-suggestions"
                />
                <datalist id="asset-category-suggestions">
                  {(categoriesQuery.data?.data ?? []).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <InputField
                  label="Brand"
                  value={form.brand}
                  onChange={(v) => setForm((f) => ({ ...f, brand: v }))}
                />
                <InputField
                  label="Model"
                  value={form.model}
                  onChange={(v) => setForm((f) => ({ ...f, model: v }))}
                />
                <InputField
                  label="Serial Number"
                  value={form.serialNumber}
                  onChange={(v) => setForm((f) => ({ ...f, serialNumber: v }))}
                />
                {dialog.mode === "edit" && dialog.row?.status !== "ASSIGNED" ? (
                  <SelectField
                    label="Status"
                    value={form.status}
                    onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                    options={EDITABLE_STATUS_OPTIONS}
                  />
                ) : null}
                <TextAreaField
                  label="Notes"
                  value={form.notes}
                  onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
                  rows={3}
                />
                {formError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {formError}
                  </p>
                ) : null}
              </div>
            </div>
            <div className={MODAL_FOOTER_CLASS}>
              <Button type="button" variant="outline" onClick={() => setDialog(null)} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void submit()} disabled={saving}>
                {saving ? "Saving…" : dialog.mode === "add" ? "Add asset" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Assign */}
      {assignTarget ? (
        <div
          className={MODAL_OVERLAY_CLASS}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !assigning) setAssignTarget(null);
          }}
        >
          <div role="dialog" aria-modal="true" className={MODAL_PANEL_CLASS}>
            <div className={MODAL_HEADER_CLASS}>
              <h2 className="text-base font-semibold text-wt-text">
                Assign {assignTarget.asset_tag}
              </h2>
            </div>
            <div className={MODAL_BODY_CLASS}>
              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-wt-text">Employee</p>
                  {assignSelected ? (
                    <div className="flex items-center justify-between rounded-lg border border-wt-border bg-wt-surface-2 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-wt-text">{assignSelected.name}</p>
                        <p className="text-xs text-wt-text-muted">{assignSelected.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAssignSelected(null)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        value={assignSearch}
                        onChange={(e) => setAssignSearch(e.target.value)}
                        placeholder="Search by name, email, or employee id…"
                      />
                      {assignResults.length > 0 ? (
                        <ul className="mt-1.5 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-wt-border p-1.5">
                          {assignResults.map((emp) => (
                            <li key={emp.emp_id}>
                              <button
                                type="button"
                                onClick={() => setAssignSelected(emp)}
                                className="flex w-full flex-col rounded-md px-2.5 py-1.5 text-left hover:bg-wt-surface-2"
                              >
                                <span className="text-sm text-wt-text">{emp.name}</span>
                                <span className="text-xs text-wt-text-muted">
                                  {emp.email}
                                  {emp.department ? ` · ${emp.department}` : ""}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  )}
                </div>
                <InputField label="Condition" value={assignCondition} onChange={setAssignCondition} placeholder="e.g. Good, minor scratches" />
                <TextAreaField label="Notes" value={assignNotes} onChange={setAssignNotes} rows={2} />
                {assignError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {assignError}
                  </p>
                ) : null}
              </div>
            </div>
            <div className={MODAL_FOOTER_CLASS}>
              <Button type="button" variant="outline" onClick={() => setAssignTarget(null)} disabled={assigning}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void submitAssign()} disabled={assigning}>
                {assigning ? "Assigning…" : "Assign"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Return */}
      {returnTarget ? (
        <div
          className={MODAL_OVERLAY_CLASS}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !returning) setReturnTarget(null);
          }}
        >
          <div role="dialog" aria-modal="true" className={MODAL_PANEL_CLASS}>
            <div className={MODAL_HEADER_CLASS}>
              <h2 className="text-base font-semibold text-wt-text">
                Return {returnTarget.asset_tag}
              </h2>
              <p className="mt-1 text-xs text-wt-text-muted">
                Currently with {returnTarget.holder?.name ?? "—"}
              </p>
            </div>
            <div className={MODAL_BODY_CLASS}>
              <div className="space-y-4">
                <InputField
                  label="Condition on return"
                  value={returnCondition}
                  onChange={setReturnCondition}
                  placeholder="e.g. Good, screen cracked"
                />
                <TextAreaField label="Notes" value={returnNotes} onChange={setReturnNotes} rows={2} />
                <SelectField
                  label="Set status to"
                  value={returnNextStatus}
                  onChange={setReturnNextStatus}
                  options={NEXT_STATUS_OPTIONS}
                />
              </div>
            </div>
            <div className={MODAL_FOOTER_CLASS}>
              <Button type="button" variant="outline" onClick={() => setReturnTarget(null)} disabled={returning}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void submitReturn()} disabled={returning}>
                {returning ? "Returning…" : "Return"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* History */}
      {historyTarget ? (
        <div
          className={MODAL_OVERLAY_CLASS}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryTarget(null);
          }}
        >
          <div role="dialog" aria-modal="true" className={MODAL_PANEL_CLASS}>
            <div className={MODAL_HEADER_CLASS}>
              <h2 className="text-base font-semibold text-wt-text">
                {historyTarget.asset_tag} — history
              </h2>
            </div>
            <div className={MODAL_BODY_CLASS}>
              {historyStatus === "loading" ? (
                <SectionLoading label="" />
              ) : historyStatus === "error" || !historyItems ? (
                <p className="py-6 text-center text-sm text-wt-text-muted">Couldn&apos;t load history.</p>
              ) : historyItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-wt-text-muted">Never assigned yet.</p>
              ) : (
                <ul className="space-y-3">
                  {historyItems.map((h) => (
                    <li key={h.id} className="rounded-lg border border-wt-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-wt-text">{h.name}</span>
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            h.returned_at
                              ? "bg-wt-surface-3 text-wt-text-muted"
                              : "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
                          )}
                        >
                          {h.returned_at ? "Returned" : "Current"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-wt-text-muted">
                        Assigned {formatApiDateTimeDisplay(h.assigned_at)} by {h.assigned_by_email}
                      </p>
                      {h.returned_at ? (
                        <p className="text-xs text-wt-text-muted">
                          Returned {formatApiDateTimeDisplay(h.returned_at)} to {h.returned_by_email}
                        </p>
                      ) : null}
                      {h.notes ? <p className="mt-1 text-xs text-wt-text-muted">{h.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex shrink-0 justify-end border-t border-wt-border px-5 py-4 sm:px-7 dark:border-wt-border/80">
              <Button type="button" variant="outline" onClick={() => setHistoryTarget(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this asset?"
        description={deleteTarget ? `"${deleteTarget.asset_tag}" will be removed. This can't be undone.` : ""}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardPageShell>
  );
}
