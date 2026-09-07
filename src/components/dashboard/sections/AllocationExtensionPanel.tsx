"use client";

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
import { useCallback, useEffect, useMemo, useState } from "react";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiError } from "@/api/error";
import { hrmsService, type AllocationExtensionRequestRow, type AllocationExtensionRequestStatus } from "@/services/hrms.service";
import { useAuth } from "@/context/AuthContext";
import { ApiDateField, FieldLabel, InputField, SelectField } from "@/components/dashboard/ui/forms";
import { SkillsMultiSelectField } from "@/components/dashboard/ui/SkillsMultiSelectField";
import { Button } from "@/components/ui/button";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "@/hooks/useClientPagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatApiDateDisplay, inputValueToApiDate } from "@/utils/apiDate";
import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { WtLoader } from "@/components/dashboard/ui/WtLoader";
import {
  buildAllocationExtensionContextQuery,
  buildCreateAllocationExtensionBody,
  findActiveAllocationForExtension,
  findExtensionAllocationContext,
  mergeExtensionContextWithAllocationRow,
  mergeAllocationExtensionRowFromStatusResponse,
  normalizeAllocationExtensionContext,
  parseManagerProjectsForExtension,
  resolveExtensionProjectCodeForSubmit,
  type AllocationExtensionContext,
  type ManagerExtensionProject,
} from "@/utils/allocationExtension";
import { parseEmployeeAllocationsResponse } from "@/utils/allocationList";
import { createEmptyAllocationExtensionForm } from "@/utils/allocationFormState";
import { UserRequestRejectDialog } from "@/components/dashboard/leave/UserRequestRejectDialog";

function normalizeHrStatusFilter(value: string): AllocationExtensionRequestStatus | "" {
  const v = value.trim().toUpperCase();
  if (v === "ALL" || v === "") return "";
  if (v === "PENDING" || v === "APPROVED" || v === "REJECTED") return v;
  return "";
}

function asDateDisplayValue(value: string) {
  return formatApiDateDisplay(String(value ?? ""));
}

export function AllocationExtensionPanel() {
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];
  const hasHrAccess = userRoles.includes("ROLE_HR") || userRoles.includes("ROLE_ADMIN");
  const hasManagerRole = userRoles.includes("ROLE_MANAGER");
  const hasAmRole = userRoles.includes("ROLE_AM");
  const canCreateRequest = hasManagerRole || hasAmRole || hasHrAccess;

  // Create form (Manager / AM / HR)
  const [createForm, setCreateForm] = useState(createEmptyAllocationExtensionForm);
  const [creating, setCreating] = useState(false);
  const [managerProjectsData, setManagerProjectsData] = useState<ManagerExtensionProject[]>([]);
  const [loadingCreateOptions, setLoadingCreateOptions] = useState(false);
  const [allocationContext, setAllocationContext] = useState<AllocationExtensionContext | null>(
    null
  );
  const [loadingContext, setLoadingContext] = useState(false);

  // Lists (HR list + Manager status)
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [hrStatusFilter, setHrStatusFilter] = useState<AllocationExtensionRequestStatus | "">("");
  const [rows, setRows] = useState<AllocationExtensionRequestRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
  const [updatingDecision, setUpdatingDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: number | null; reason: string }>({
    open: false,
    requestId: null,
    reason: "",
  });

  const visibleMode = useMemo<"hr" | "manager">(() => {
    if (hasHrAccess) return "hr";
    return "manager";
  }, [hasHrAccess]);

  const primarySelectedEmail = createForm.userEmails[0] ?? "";

  const managerProjects = useMemo(
    () =>
      managerProjectsData.map((p) => ({
        code: p.code,
        name: p.name,
      })),
    [managerProjectsData]
  );

  const selectedManagerProject = useMemo(() => {
    const value = createForm.projectCode.trim();
    if (!value) return undefined;
    if (/^\d+$/.test(value)) {
      const id = Number(value);
      return managerProjectsData.find((p) => p.id === id);
    }
    return managerProjectsData.find((p) => p.code.toLowerCase() === value.toLowerCase());
  }, [managerProjectsData, createForm.projectCode]);

  const managerEmployeesForProject = useMemo(() => {
    if (!createForm.projectCode.trim()) {
      const all = new Map<string, { email: string; name: string }>();
      for (const project of managerProjectsData) {
        for (const emp of project.employees) {
          all.set(emp.email, { email: emp.email, name: emp.name });
        }
      }
      return Array.from(all.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    return (selectedManagerProject?.employees ?? []).map((e) => ({
      email: e.email,
      name: e.name,
    }));
  }, [managerProjectsData, createForm.projectCode, selectedManagerProject]);

  const loadCreateOptions = useCallback(async () => {
    if (!canCreateRequest) return;
    setLoadingCreateOptions(true);
    try {
      const res = await hrmsService.getManagerProjectsWithRoles();
      const payload = (res as { data?: unknown }).data ?? res;
      setManagerProjectsData(parseManagerProjectsForExtension(payload));
    } catch {
      setManagerProjectsData([]);
    } finally {
      setLoadingCreateOptions(false);
    }
  }, [canCreateRequest]);

  const resolveExtensionContext = useCallback(
    async (query: { userEmail: string; projectCode?: string; projectId?: number }) => {
      const projectValue = createForm.projectCode.trim();
      let context: AllocationExtensionContext | null = null;

      const loadContext = async (params: {
        userEmail: string;
        projectCode?: string;
        projectId?: number;
      }) => {
        const res = await hrmsService.getAllocationExtensionContext(params);
        const raw = (res as { data?: unknown }).data ?? res;
        if (raw && typeof raw === "object") {
          return normalizeAllocationExtensionContext(raw as Record<string, unknown>);
        }
        return null;
      };

      try {
        context = await loadContext(query);
      } catch {
        context = null;
      }

      const managerProject = managerProjectsData.find((project) => {
        if (/^\d+$/.test(projectValue)) return project.id === Number(projectValue);
        return project.code.toLowerCase() === projectValue.toLowerCase();
      });

      if (!context?.current_end_date && managerProject?.id && query.projectId == null) {
        try {
          const byProjectId = await loadContext({
            userEmail: query.userEmail,
            projectId: managerProject.id,
          });
          if (byProjectId) context = byProjectId;
        } catch {
          /* keep prior context */
        }
      }

      if (!context?.current_end_date) {
        context =
          findExtensionAllocationContext(managerProjectsData, query.userEmail, projectValue) ??
          context;
      }

      if (!context?.current_end_date) {
        try {
          const empRes = await hrmsService.getEmployeeAllocations({ userEmail: query.userEmail });
          const parsed = parseEmployeeAllocationsResponse(empRes);
          const allocationRow = findActiveAllocationForExtension(
            parsed?.allocations ?? [],
            projectValue
          );
          if (allocationRow) {
            context = mergeExtensionContextWithAllocationRow(
              context,
              allocationRow,
              { userEmail: query.userEmail, projectValue },
              managerProjectsData
            );
          }
        } catch {
          /* keep prior context */
        }
      }

      return context;
    },
    [createForm.projectCode, managerProjectsData]
  );

  const loadAllocationContext = useCallback(async () => {
    // Preview context for the first selected employee (multi-select shares one end date).
    const query = buildAllocationExtensionContextQuery({
      userEmail: primarySelectedEmail,
      projectValue: createForm.projectCode,
    });
    if (!query) {
      setAllocationContext(null);
      return;
    }

    setLoadingContext(true);
    try {
      setAllocationContext(await resolveExtensionContext(query));
    } finally {
      setLoadingContext(false);
    }
  }, [primarySelectedEmail, createForm.projectCode, resolveExtensionContext]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const searchTerm = debouncedSearch.trim() || undefined;
      if (visibleMode === "hr") {
        const res = await hrmsService.listAllocationExtensionRequests({
          page,
          size: pageSize,
          search: searchTerm,
          status: hrStatusFilter ? hrStatusFilter : undefined,
        });
        const pageRows = res.data.data ?? [];
        const elements = Math.max(res.data.total_elements ?? 0, pageRows.length);
        const pages = Math.max(
          res.data.total_pages ?? 1,
          Math.ceil(elements / pageSize) || 1
        );
        setRows(pageRows);
        setTotalPages(pages);
        setTotalElements(elements);
        return;
      }

      const res = await hrmsService.listManagerAllocationExtensionStatus({
        page,
        size: pageSize,
        search: searchTerm,
      });
      const pageRows = res.data.data ?? [];
      const elements = Math.max(res.data.total_elements ?? 0, pageRows.length);
      const pages = Math.max(
        res.data.total_pages ?? 1,
        Math.ceil(elements / pageSize) || 1
      );
      setRows(pageRows);
      setTotalPages(pages);
      setTotalElements(elements);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to load extension requests.";
      showErrorToast(msg);
      setRows([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [visibleMode, page, pageSize, debouncedSearch, hrStatusFilter]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    void loadCreateOptions();
  }, [loadCreateOptions]);

  useEffect(() => {
    void loadAllocationContext();
  }, [loadAllocationContext]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, hrStatusFilter, visibleMode]);

  async function submitCreate() {
    const userEmails = createForm.userEmails.map((email) => email.trim().toLowerCase()).filter(Boolean);
    const projectCode = resolveExtensionProjectCodeForSubmit(
      createForm.projectCode,
      allocationContext
    );
    const requestedEndDate = createForm.requestedEndDate.trim();
    const reason = createForm.reason.trim();

    if (!userEmails.length || !projectCode || !requestedEndDate) {
      showErrorToast("Select at least one employee, a project, and a requested end date.");
      return;
    }

    if (!reason) {
      showErrorToast("Reason is required.");
      return;
    }

    const bodyPreview = buildCreateAllocationExtensionBody({
      userEmail: userEmails[0]!,
      projectCode,
      requestedEndDate,
      reason: reason || undefined,
    });
    if (!bodyPreview.requestedEndDate) {
      showErrorToast("Enter a valid requested end date (dd/mm/yyyy).");
      return;
    }

    const minimumRequested = allocationContext?.minimum_requested_end_date?.trim();
    const requestedIso =
      inputValueToApiDate(requestedEndDate) ||
      bodyPreview.requestedEndDate ||
      requestedEndDate;
    if (minimumRequested && requestedIso < minimumRequested) {
      showErrorToast(
        `Requested end date must be on or after ${asDateDisplayValue(minimumRequested)} (minimum extension period).`
      );
      return;
    }

    setCreating(true);
    try {
      const createdIds: number[] = [];
      const failures: string[] = [];
      for (const userEmail of userEmails) {
        try {
          const body = buildCreateAllocationExtensionBody({
            userEmail,
            projectCode,
            requestedEndDate,
            reason: reason || undefined,
          });
          if (!body.requestedEndDate) {
            failures.push(`${userEmail}: invalid end date`);
            continue;
          }
          const res = await hrmsService.createAllocationExtensionRequest(body);
          if (typeof res.data === "number") createdIds.push(res.data);
        } catch (e) {
          const msg = e instanceof ApiError ? e.message : "Failed";
          failures.push(`${userEmail}: ${msg}`);
        }
      }

      if (createdIds.length) {
        showSuccessToast(
          createdIds.length === 1
            ? "Extension request created successfully."
            : `${createdIds.length} extension requests created successfully.`
        );
      }
      if (failures.length) {
        showErrorToast(
          failures.length === 1
            ? failures[0]!
            : `${failures.length} of ${userEmails.length} requests failed. ${failures[0]}`
        );
      }
      if (createdIds.length) {
        setCreateForm(createEmptyAllocationExtensionForm());
        setAllocationContext(null);
        setPage(0);
        void load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(
    requestId: number,
    next: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ) {
    let message: string | undefined;
    if (next === "REJECTED") {
      message = String(rejectionReason ?? "").trim();
      if (!message) {
        showErrorToast("Rejection reason is required.");
        return;
      }
    }

    setUpdatingRequestId(requestId);
    setUpdatingDecision(next);
    try {
      const res = await hrmsService.updateAllocationExtensionRequestStatus({
        requestId,
        status: next,
        message,
      });
      setRows((prev) =>
        prev.map((row) =>
          row.id === requestId
            ? mergeAllocationExtensionRowFromStatusResponse(row, res.data, next)
            : row
        )
      );
      showSuccessToast(`Request ${next.toLowerCase()}.`);
      setRejectDialog({ open: false, requestId: null, reason: "" });
      void load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to update status.";
      showErrorToast(msg);
    } finally {
      setUpdatingRequestId(null);
      setUpdatingDecision(null);
    }
  }

  function openRejectDialog(requestId: number) {
    setRejectDialog({ open: true, requestId, reason: "" });
  }

  function closeRejectDialog() {
    if (updatingDecision === "REJECTED") return;
    setRejectDialog({ open: false, requestId: null, reason: "" });
  }

  async function confirmRejectRequest() {
    if (!rejectDialog.requestId) return;
    await updateStatus(rejectDialog.requestId, "REJECTED", rejectDialog.reason);
  }

  const effectiveTotal = Math.max(totalElements, rows.length);
  const effectiveTotalPages = Math.max(
    1,
    totalPages,
    Math.ceil(effectiveTotal / pageSize) || 1
  );
  // If the API returns an unpaginated full list, page it on the client.
  const clientPaged = rows.length > pageSize;
  const visibleRows = clientPaged
    ? rows.slice(page * pageSize, (page + 1) * pageSize)
    : rows;
  const rangeStart = effectiveTotal === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(effectiveTotal, (page + 1) * pageSize);
  const showListPagination = effectiveTotal > 0 || visibleRows.length > 0;

  const listPagination = showListPagination ? (
    <ListPagination
      className="pt-1"
      page={page}
      totalPages={effectiveTotalPages}
      totalItems={effectiveTotal}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      pageSize={pageSize}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      loading={loading}
      onPageChange={setPage}
      onPageSizeChange={(nextSize) => {
        setPageSize(nextSize);
        setPage(0);
      }}
    />
  ) : null;

  if (!hasHrAccess && !hasManagerRole && !hasAmRole) {
    return (
      <section className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm">
        <p className="text-sm text-wt-text-muted">You don’t have access to extend project allocation.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {canCreateRequest ? (
        <section className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm">
          <h3 className="text-base font-semibold tracking-tight text-wt-text">
            Extend Project Allocation
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-wt-text-muted">
            Select a project and one or more employees to request a new allocation end date.
            {hasHrAccess ? " HR/Admin can approve requests in the list below." : " HR reviews and approves pending requests."}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <SelectField
              label="Project name"
              required
              value={createForm.projectCode}
              onChange={(projectCode) => {
                const value = projectCode.trim();
                const project = /^\d+$/.test(value)
                  ? managerProjectsData.find((proj) => proj.id === Number(value))
                  : managerProjectsData.find(
                      (proj) => proj.code.toLowerCase() === value.toLowerCase()
                    );
                setCreateForm((prev) => {
                  const allowed = new Set(
                    (project?.employees ?? []).map((e) => e.email.trim().toLowerCase())
                  );
                  const kept = prev.userEmails.filter((email) =>
                    allowed.has(email.trim().toLowerCase())
                  );
                  return {
                    ...prev,
                    projectCode,
                    userEmails: kept,
                  };
                });
              }}
              disabled={loadingCreateOptions || !managerProjects.length}
              placeholder={
                loadingCreateOptions
                  ? "Loading projects..."
                  : managerProjects.length
                    ? "Select project"
                    : "No projects found"
              }
              options={managerProjects.map((opt) => ({
                value: opt.code,
                label: opt.name,
              }))}
            />

            <SkillsMultiSelectField
              label="Employees"
              required
              value={createForm.userEmails}
              onChange={(userEmails) => setCreateForm((p) => ({ ...p, userEmails }))}
              disabled={
                loadingCreateOptions ||
                !createForm.projectCode.trim() ||
                !managerEmployeesForProject.length
              }
              loading={loadingCreateOptions}
              loadingLabel="Loading employees…"
              placeholder={
                !createForm.projectCode.trim()
                  ? "Select project first"
                  : managerEmployeesForProject.length
                    ? "Select employees"
                    : "No employees on this project"
              }
              options={managerEmployeesForProject.map((opt) => ({
                value: opt.email,
                label: opt.name,
              }))}
            />

            <label className="text-sm">
              <FieldLabel
                label={`Current allocation end date${createForm.userEmails.length > 1 ? " (first selected)" : ""}`}
                required
              />
              <div
                className="w-full rounded-xl border border-wt-border bg-wt-surface-2 px-3 py-2 text-sm text-wt-text"
                aria-live="polite"
              >
                {loadingContext && primarySelectedEmail && createForm.projectCode
                  ? "Loading…"
                  : allocationContext?.current_end_date
                    ? asDateDisplayValue(allocationContext.current_end_date)
                    : primarySelectedEmail && createForm.projectCode
                      ? "—"
                      : "Select employees and project"}
              </div>
              {allocationContext && !allocationContext.extension_allowed ? (
                <p className="mt-1 text-xs text-amber-700">
                  This allocation has no end date. Extensions require a current end date.
                </p>
              ) : null}
            </label>

            <ApiDateField
              label="Requested end date"
              required
              min={allocationContext?.minimum_requested_end_date ?? undefined}
              disabled={
                !createForm.userEmails.length ||
                !createForm.projectCode.trim() ||
                (allocationContext != null && !allocationContext.extension_allowed)
              }
              value={createForm.requestedEndDate}
              onChange={(requestedEndDate) =>
                setCreateForm((p) => ({
                  ...p,
                  requestedEndDate,
                }))
              }
            />

            <div className="md:col-span-2">
              <InputField
                label="Reason"
                required
                value={createForm.reason}
                onChange={(reason) => setCreateForm((p) => ({ ...p, reason }))}
                placeholder="Needed for release closure"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="brand"
              size="sm"
              disabled={
                creating ||
                loadingContext ||
                !createForm.userEmails.length ||
                (allocationContext != null && !allocationContext.extension_allowed)
              }
              onClick={() => void submitCreate()}
              className="px-4 py-2 text-sm"
            >
              {creating
                ? "Submitting…"
                : createForm.userEmails.length > 1
                  ? `Submit ${createForm.userEmails.length} requests`
                  : "Submit request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCreateForm(createEmptyAllocationExtensionForm());
                setAllocationContext(null);
              }}
            >
              Clear
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5 shadow-sm space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-wt-text">
                {visibleMode === "hr"
                  ? "Extension Requests"
                  : "My Extension Requests"}
              </h3>
              <p className="text-xs text-wt-text-muted">
                {loading ? "Loading…" : `${effectiveTotal} Total`}
                {visibleMode === "hr" && !loading
                  ? " · Approve or reject pending extension requests"
                  : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                className="h-10 w-full min-w-[200px] rounded-xl border border-wt-border bg-wt-surface-2 px-3 py-2 text-sm outline-none focus:border-[var(--wt-brand)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)] sm:w-64"
                placeholder="Search"
                aria-label="Search"
              />
              <RefreshIconButton onClick={() => void load()} loading={loading} />
            </div>
          </div>

          {visibleMode === "hr" ? (
            <SelectField
              label="Status"
              value={hrStatusFilter || "ALL"}
              onChange={(v) => {
                setHrStatusFilter(normalizeHrStatusFilter(v));
              }}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
              ]}
            />
          ) : null}
        </div>

        {visibleRows.length ? (
          <ScrollableTable maxHeightClass="max-h-[min(70vh,520px)]">
            <WtTable>
              <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Employee</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Current end</TableHead>
                  <TableHead>Requested end</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  {visibleMode === "hr" ? (
                    <>
                      <TableHead>Requested by</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((r) => {
                  const status = String(r.status ?? "PENDING").toUpperCase();
                  const isPending = status === "PENDING";
                  const isUpdating = updatingRequestId === r.id;
                  return (
                    <TableRow key={String(r.id)}>
                      <TableCell className="px-3 py-2 whitespace-nowrap">{r.employee_name || "—"}</TableCell>
                      <TableCell className="px-3 py-2 whitespace-nowrap">{r.project_name || "—"}</TableCell>
                      <TableCell className="px-3 py-2 whitespace-nowrap">
                        {r.current_end_date ? asDateDisplayValue(r.current_end_date) : "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 whitespace-nowrap">
                        {asDateDisplayValue(r.requested_end_date)}
                      </TableCell>
                      <TableCell className="max-w-[16rem] px-3 py-2">
                        <span className="line-clamp-2 whitespace-normal break-words text-sm text-wt-text">
                          {r.reason?.trim() || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2 whitespace-nowrap">
                        <RequestStatusBadge status={status} />
                      </TableCell>
                      {visibleMode === "hr" ? (
                        <>
                          <TableCell className="px-3 py-2 whitespace-nowrap">
                            {r.requested_by_name || "—"}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right whitespace-nowrap">
                            {isPending ? (
                              isUpdating ? (
                                <div className="inline-flex items-center justify-end gap-2 text-wt-text">
                                  <WtLoader size="sm" label="Updating request" />
                                  <span className="text-xs text-wt-text-muted">
                                    {updatingDecision === "REJECTED" ? "Rejecting…" : "Approving…"}
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10"
                                    onClick={() => void updateStatus(r.id, "APPROVED")}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    className="border-rose-600/30 text-rose-700 hover:bg-rose-500/10"
                                    onClick={() => openRejectDialog(r.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )
                            ) : (
                              <span className="text-xs text-wt-text-muted">—</span>
                            )}
                          </TableCell>
                        </>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </WtTable>
          </ScrollableTable>
        ) : (
          loading ? (
            <SectionLoading label="Loading extension requests…" className="py-10" />
          ) : (
            <p className="text-sm text-wt-text-muted">No extension requests found.</p>
          )
        )}

        {visibleRows.length ? listPagination : null}
      </section>

      <UserRequestRejectDialog
        open={rejectDialog.open}
        title="Reject Allocation Extension"
        description="A reason is required when rejecting a project allocation extension request."
        reason={rejectDialog.reason}
        onReasonChange={(reason) => setRejectDialog((prev) => ({ ...prev, reason }))}
        onCancel={closeRejectDialog}
        onConfirm={() => void confirmRejectRequest()}
        confirmLabel="Reject"
        confirmingLabel="Rejecting…"
        confirmDisabled={!rejectDialog.reason.trim()}
        loading={updatingDecision === "REJECTED"}
      />
    </div>
  );
}
