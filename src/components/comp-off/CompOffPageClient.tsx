"use client";

import { Button } from "@/components/ui/button";
import { PAGE_TAB_BODY_CLASS } from "@/components/dashboard/ui/PageTabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Loader2, Inbox } from "lucide-react";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
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
import { useClientPagination } from "@/hooks/useClientPagination";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { hrmsService } from "@/services/hrms.service";
import { compOffService } from "@/services/compOff.service";
import { InputField, SelectField, TextAreaField } from "@/components/dashboard/ui/forms";
import { ProjectSelectField } from "@/components/comp-off/ProjectSelectField";
import { Badge } from "@/components/ui/badge";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { WtLoadingOverlay } from "@/components/dashboard/ui/WtLoader";
import { OnboardingGate } from "@/components/dashboard/shared/OnboardingGate";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { useDashboardAction } from "@/components/dashboard/shared/useDashboardAction";

import { DatePicker } from "@/components/ui/date-picker";
import { LeaveManagerSelector } from "@/components/dashboard/leave/LeaveManagerSelector";
import { LeaveAdditionalRecipientsSelector } from "@/components/dashboard/leave/LeaveAdditionalRecipientsSelector";
import { useAccountManagerEmails } from "@/hooks/useAccountManagerEmails";
import { useManagerPortfolioEmails } from "@/hooks/comp-off/useManagerPortfolioEmails";
import { requestRowEmail } from "@/utils/learning/onboardOptions";
import { isAccountManagerEmployeeUser } from "@/utils/roles";
import type { CompOffProjectOption } from "@/utils/compOffProjects";
import {
  loadCompOffProjectCatalog,
  resolveCompOffManagerEmail,
  type CompOffProjectCatalog,
} from "@/services/compOffProjectCatalog.service";
import type { CompOffGrant } from "@/types/compOff";
import {
  COMP_OFF_EARN_LIST_TYPE,
  COMP_OFF_USAGE_LIST_TYPE,
  calendarDaysInclusive,
  grantExpiryDate,
  grantRemainingUnits,
  grantStatus,
  isCompOffRequestType,
  mapEarnListRow,
  patchRequestRowStatus,
  applyTeamRequestDecisions,
  effectiveRequestRowStatus,
  inferStatusFromAlreadyActedError,
  isAlreadyActedOnRequestError,
  normalizeCompOffRequestType,
  normalizeRequestStatus,
  pickRowField,
  isPendingRequestStatus,
  remainingCreditUnitsFromGrants,
  requestEarnManagerStatus,
  requestRowId,
  requestRowStatus,
  sameDayCompOffEarnDatesInUsageRange,
  sameDayCompOffUsageErrorMessage,
  sortGrantsFifo,
} from "@/utils/compOff";
import {
  formatStageRejectionReason,
  requestFinalStatus,
  canHrActOnCompOff,
  requestHrStatus,
  requestManagerStatus,
} from "@/utils/userRequest";
import {
  compareApiDates,
  formatApiDate,
  formatApiDateDisplay,
  normalizeToApiDate,
  parseApiDate,
} from "@/utils/apiDate";
import { UserRequestRejectDialog } from "@/components/dashboard/leave/UserRequestRejectDialog";
import {
  compOffEarnActionLabel,
  compOffTeamReviewActionLabel,
  compOffUsageActionLabel,
} from "@/utils/compOffActionToast";
import {
  compOffEmployeeDisplayName,
  resolveEmployeeNamesByEmail,
} from "@/utils/compOff/resolveEmployeeDisplayNames";

function todayYmd(): string {
  return formatApiDate(new Date());
}

function defaultRequestRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: formatApiDate(from), to: formatApiDate(to) };
}

function requestTypeLabel(type: unknown): string {
  const n = normalizeCompOffRequestType(type);
  if (n === "COMP_OFF_EARN") return "Earn";
  if (n === "COMP_OFF") return "Usage";
  return String(type ?? "—");
}

function isPendingStage(value: unknown): boolean {
  const s = normalizeRequestStatus(value);
  return s === "PENDING";
}

export type CompOffPageClientProps = {
  /** Render inside Leave requests (no extra page shell). */
  embedded?: boolean;
  /** Earn-only (Comp off tab) vs full page with usage (standalone). */
  flowScope?: "earn" | "both";
  forcedTab?: "my" | "team";
  /** Sync team date filters from Leave → Team requests bar. */
  teamFromDate?: string;
  teamToDate?: string;
  /** Increment from parent Fetch to reload team list. */
  teamReloadKey?: number;
};

export function CompOffPageClient({
  embedded = false,
  flowScope = "both",
  forcedTab,
  teamFromDate,
  teamToDate,
  teamReloadKey,
}: CompOffPageClientProps = {}) {
  const earnOnly = flowScope === "earn";
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { actionLoading, runAction } = useDashboardAction();
  const {
    hasHrAccess,
    hasManagerAccess,
    requiresSelfOnboarding,
  } = useDashboardAccess();

  const userEmail = String(user?.email ?? "").trim().toLowerCase();
  const submitsToHrForReview = isAccountManagerEmployeeUser(user?.roles ?? []);
  const { data: accountManagerEmails = new Set<string>() } = useAccountManagerEmails();
  const managerOnlyReview = hasManagerAccess && !hasHrAccess;
  const isHrOnly = hasHrAccess && !hasManagerAccess;
  const canApplyCompOff = !hasHrAccess && !hasManagerAccess;
  const {
    teamEmails: managerTeamEmails,
    loading: managerPortfolioLoading,
  } = useManagerPortfolioEmails(hasManagerAccess);

  const [mainTab, setMainTab] = useState<"my" | "team">(
    forcedTab ?? (pathname.includes("/dashboard/comp-off/team") ? "team" : "my")
  );
  useEffect(() => {
    if (forcedTab) {
      setMainTab(forcedTab);
      return;
    }
    if (pathname.includes("/dashboard/comp-off/team")) setMainTab("team");
    else if (pathname.includes("/dashboard/comp-off")) setMainTab("my");
  }, [forcedTab, pathname]);

  const [balanceUnits, setBalanceUnits] = useState<number | null>(null);
  const [balanceAsOf, setBalanceAsOf] = useState(todayYmd());
  const [grants, setGrants] = useState<CompOffGrant[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);

  const [projectOptions, setProjectOptions] = useState<CompOffProjectOption[]>([]);
  const [projectCatalog, setProjectCatalog] = useState<CompOffProjectCatalog | null>(null);
  const [managerEmailResolving, setManagerEmailResolving] = useState(false);
  const [redirectingToProjects, setRedirectingToProjects] = useState(false);

  const [selectedManagerEmails, setSelectedManagerEmails] = useState<string[]>([]);
  const [selectedAdditionalManagerEmails, setSelectedAdditionalManagerEmails] = useState<string[]>([]);

  const [earnForm, setEarnForm] = useState({
    worked_date: "",
    project_code: "",
    manager_comp_off_email: "",
    comments: "",
  });
  const [usageForm, setUsageForm] = useState({
    request_from_date: "",
    request_to_date: "",
    comments: "",
  });
  const [editingRequestId, setEditingRequestId] = useState("");
  const [compOffSubTab, setCompOffSubTab] = useState<"apply" | "view">("apply");

  const [myRequests, setMyRequests] = useState<Array<Record<string, unknown>>>([]);
  const [myRequestsFlowFilter, setMyRequestsFlowFilter] = useState<"ALL" | "EARN" | "USAGE">("ALL");
  const [myRequestsFrom, setMyRequestsFrom] = useState(() => defaultRequestRange().from);
  const [myRequestsTo, setMyRequestsTo] = useState(() => defaultRequestRange().to);
  const myRequestsCacheRef = useRef<Map<string, Array<Record<string, unknown>>>>(new Map());
  const teamRequestsCacheRef = useRef<Map<string, Array<Record<string, unknown>>>>(new Map());
  const [teamRequests, setTeamRequests] = useState<Array<Record<string, unknown>>>([]);
  const [teamEmployeeNames, setTeamEmployeeNames] = useState<Record<string, string>>({});
  const [teamRequestUpdatingId, setTeamRequestUpdatingId] = useState<string | null>(null);
  const [teamDecisions, setTeamDecisions] = useState<Record<string, "APPROVED" | "REJECTED">>({});
  const teamDecisionsRef = useRef<Map<string, "APPROVED" | "REJECTED">>(new Map());
  const [pendingReject, setPendingReject] = useState<{
    requestId: string;
    flow: "COMP_OFF_EARN" | "COMP_OFF";
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [teamFilters, setTeamFilters] = useState(() => ({
    ...defaultRequestRange(),
    flow: "ALL" as "ALL" | "EARN" | "USAGE",
  }));

  const useParentTeamDates = embedded && forcedTab === "team";

  useEffect(() => {
    if (!useParentTeamDates) return;
    setTeamFilters((prev) => ({
      ...prev,
      ...(teamFromDate?.trim() ? { from: teamFromDate.trim() } : {}),
      ...(teamToDate?.trim() ? { to: teamToDate.trim() } : {}),
    }));
  }, [useParentTeamDates, teamFromDate, teamToDate]);

  const usageDays = useMemo(() => {
    const from = usageForm.request_from_date.trim();
    const to = usageForm.request_to_date.trim();
    if (!from || !to) return 0;
    return calendarDaysInclusive(from, to);
  }, [usageForm.request_from_date, usageForm.request_to_date]);

  const computedBalance = useMemo(
    () => remainingCreditUnitsFromGrants(grants, balanceAsOf),
    [grants, balanceAsOf]
  );

  const derivedBalanceFromRequests = useMemo(() => {
    let approvedEarnUnits = 0;
    let approvedUsageUnits = 0;
    for (const row of myRequests) {
      if (normalizeRequestStatus(requestRowStatus(row)) !== "APPROVED") continue;
      const flow = normalizeCompOffRequestType(row.request_type ?? row.requestType);
      const hasHalfDay = Boolean(
        pickRowField(row, "is_half_day", "isHalfDay", "half_day", "halfDay") === true
      );
      const explicitUnits = Number(
        pickRowField(row, "comp_off_units", "compOffUnits", "units", "day_count", "dayCount") ?? NaN
      );
      const from = String(pickRowField(row, "request_from_date", "requestFromDate") ?? "").trim();
      const to = String(pickRowField(row, "request_to_date", "requestToDate") ?? "").trim();
      if (flow === "COMP_OFF_EARN") {
        if (Number.isFinite(explicitUnits) && explicitUnits > 0) approvedEarnUnits += explicitUnits;
        else approvedEarnUnits += hasHalfDay ? 0.5 : 1;
      } else if (flow === "COMP_OFF") {
        if (Number.isFinite(explicitUnits) && explicitUnits > 0) approvedUsageUnits += explicitUnits;
        else approvedUsageUnits += (hasHalfDay ? 0.5 : 1) * Math.max(1, calendarDaysInclusive(from, to));
      }
    }
    return Math.max(0, approvedEarnUnits - approvedUsageUnits);
  }, [myRequests]);

  const displayBalance = useMemo(() => {
    // Prefer authoritative API balance, including zero (do not fall through to derived).
    if (balanceUnits !== null) return Math.max(0, balanceUnits);
    if (computedBalance > 0 || grants.length > 0) return Math.max(0, computedBalance);
    return Math.max(0, derivedBalanceFromRequests);
  }, [balanceUnits, computedBalance, derivedBalanceFromRequests, grants.length]);
  const usingDerivedBalance =
    balanceUnits === null && computedBalance <= 0 && displayBalance === derivedBalanceFromRequests && displayBalance > 0;
  const canUseCompOff = displayBalance > 0;
  const nearestExpiryDate = useMemo(() => {
    const asOf = normalizeToApiDate(balanceAsOf) || balanceAsOf;
    const active = grants.filter((grant) => {
      if (grantStatus(grant) !== "ACTIVE") return false;
      if (grantRemainingUnits(grant) <= 0) return false;
      const expiry = normalizeToApiDate(grantExpiryDate(grant));
      if (!expiry) return true;
      return compareApiDates(expiry, asOf) >= 0;
    });
    const nearest = sortGrantsFifo(active)[0];
    if (!nearest) return "";
    return normalizeToApiDate(grantExpiryDate(nearest)) || grantExpiryDate(nearest);
  }, [grants, balanceAsOf]);
  const filteredMyRequests = useMemo(() => {
    if (myRequestsFlowFilter === "ALL") return myRequests;
    return myRequests.filter((row) => {
      const t = normalizeCompOffRequestType(row.request_type ?? row.requestType);
      if (myRequestsFlowFilter === "EARN") return t === "COMP_OFF_EARN";
      return t === "COMP_OFF";
    });
  }, [myRequests, myRequestsFlowFilter]);
  const viewPagination = useClientPagination(filteredMyRequests, {
    resetKeys: [myRequestsFrom, myRequestsTo],
  });
  const teamPaginated = useClientPagination(teamRequests, {
    resetKeys: [teamFilters.from, teamFilters.to, teamFilters.flow],
  });

  const selectedProject = useMemo(
    () => projectOptions.find((p) => p.code === earnForm.project_code.trim()),
    [projectOptions, earnForm.project_code]
  );

  const earnProjectLabel = useCallback(
    (row: Record<string, unknown>) => {
      const code = String(pickRowField(row, "project_code", "projectCode") ?? "").trim();
      const name = String(pickRowField(row, "project_name", "projectName") ?? "").trim();
      if (name && name !== code) return name;
      if (code) {
        const option = projectOptions.find((p) => p.code.toLowerCase() === code.toLowerCase());
        return option?.label ?? code;
      }
      return "—";
    },
    [projectOptions]
  );

  const loadBalanceAndGrants = useCallback(async () => {
    const asOf = todayYmd();
    setBalanceAsOf(asOf);
    setGrantsLoading(true);
    try {
      const [balanceRes, grantsRes] = await Promise.allSettled([
        compOffService.getBalance(asOf),
        compOffService.getGrants(),
      ]);
      let units: number | null = null;
      if (balanceRes.status === "fulfilled") {
        const b = compOffService.parseBalanceResponse(balanceRes.value);
        const parsed = Number(b?.available_units ?? b?.availableUnits);
        units = Number.isFinite(parsed) ? parsed : null;
        const asOfDate = String(b?.as_of_date ?? b?.asOfDate ?? asOf).trim();
        if (asOfDate) setBalanceAsOf(asOfDate);
      }
      let grantList: CompOffGrant[] = [];
      if (grantsRes.status === "fulfilled") {
        grantList = sortGrantsFifo(compOffService.parseGrantsResponse(grantsRes.value));
        setGrants(grantList);
      } else {
        setGrants([]);
      }
      if (units === null && grantList.length) {
        units = remainingCreditUnitsFromGrants(grantList, asOf);
      }
      setBalanceUnits(units);
    } finally {
      setGrantsLoading(false);
    }
  }, []);

  const loadProfileBalanceFallback = useCallback(async () => {
    try {
      const balRes = await hrmsService.getMyLeaveBalance();
      const units = Number(balRes.data?.comp_off_balance);
      if (Number.isFinite(units) && balanceUnits === null) {
        setBalanceUnits(units);
      }
    } catch {
      /* optional fallback */
    }
  }, [balanceUnits]);

  const loadAssignedProjects = useCallback(async () => {
    try {
      const catalog = await loadCompOffProjectCatalog();
      setProjectCatalog(catalog);
      setProjectOptions(catalog.options);
    } catch {
      setProjectCatalog(null);
      setProjectOptions([]);
    }
  }, []);

  const onEarnProjectChange = useCallback(
    (projectCode: string) => {
      const option = projectOptions.find((p) => p.code === projectCode);
      setEarnForm((prev) => ({
        ...prev,
        project_code: projectCode,
        manager_comp_off_email: option?.managerEmail ?? "",
      }));
      if (!projectCode) return;
      if (option?.managerEmail) return;
      setManagerEmailResolving(true);
      const catalog = projectCatalog;
      void (async () => {
        let email = option?.managerEmail ?? "";
        if (!email && catalog) {
          email = await resolveCompOffManagerEmail(projectCode, catalog);
        }
        if (email) {
          setEarnForm((prev) =>
            prev.project_code === projectCode ? { ...prev, manager_comp_off_email: email } : prev
          );
          setProjectOptions((prev) =>
            prev.map((p) =>
              p.code === projectCode ? { ...p, managerEmail: email } : p
            )
          );
        }
        setManagerEmailResolving(false);
      })();
    },
    [projectOptions, projectCatalog]
  );

  const onAddCustomEarnProject = useCallback((projectName: string) => {
    const name = projectName.trim();
    if (!name) return;
    setProjectOptions((prev) => {
      const exists = prev.some(
        (p) =>
          p.code.toLowerCase() === name.toLowerCase() ||
          p.label.toLowerCase() === name.toLowerCase() ||
          p.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) return prev;
      const next: CompOffProjectOption = {
        code: name,
        name,
        label: name,
        managerEmail: "",
      };
      return [...prev, next].sort((a, b) => a.label.localeCompare(b.label));
    });
  }, []);

  const onAddEarnProject = useCallback(
    (projectName: string) => {
      if (hasHrAccess) {
        setRedirectingToProjects(true);
        const params = new URLSearchParams({
          tab: "project",
          createProject: "1",
        });
        const name = projectName.trim();
        if (name) params.set("projectName", name);
        router.push(`${DASHBOARD_ROUTES.allocation}?${params.toString()}`);
        return;
      }
      onAddCustomEarnProject(projectName);
    },
    [hasHrAccess, onAddCustomEarnProject, router]
  );

  const loadMyRequests = useCallback(async () => {
    if (!userEmail) {
      setMyRequests([]);
      return;
    }
    const from = myRequestsFrom || defaultRequestRange().from;
    const to = myRequestsTo || defaultRequestRange().to;
    const cacheKey = `${from}:${to}:${earnOnly}`;
    const cached = myRequestsCacheRef.current.get(cacheKey);
    if (cached) {
      setMyRequests(cached);
      return;
    }
    const earnRows = await compOffService.listEarnRequestRows({
      fromDate: from,
      toDate: to,
      selfOnly: true,
    });
    let usageRows: Array<Record<string, unknown>> = [];
    if (!earnOnly) {
      try {
        const usageRes = await compOffService.listRequests({
          fromDate: from,
          toDate: to,
          requestType: COMP_OFF_USAGE_LIST_TYPE,
          empEmails: userEmail,
        });
        usageRows = compOffService.parseRequestRows(usageRes).filter((row) => {
          const t = normalizeCompOffRequestType(row.request_type ?? row.requestType);
          return t === "COMP_OFF";
        });
      } catch {
        usageRows = [];
      }
    }
    const merged = [...earnRows, ...usageRows].filter((row) =>
      isCompOffRequestType(row.request_type ?? row.requestType)
    );

    const seen = new Set<string>();
    const deduped = merged.filter((row) => {
      const id = requestRowId(row);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    deduped.sort((a, b) => {
      const da = normalizeToApiDate(
        String(
          pickRowField(a, "worked_date", "workedDate", "request_from_date", "requestFromDate") ?? ""
        )
      );
      const db = normalizeToApiDate(
        String(
          pickRowField(b, "worked_date", "workedDate", "request_from_date", "requestFromDate") ?? ""
        )
      );
      return compareApiDates(db, da);
    });
    myRequestsCacheRef.current.set(cacheKey, deduped);
    setMyRequests(deduped);
    const hasApprovedEarn = deduped.some((row) => {
      const t = normalizeCompOffRequestType(row.request_type ?? row.requestType);
      return t === "COMP_OFF_EARN" && requestRowStatus(row) === "APPROVED";
    });
    const shouldRefreshBalance = deduped.some((row) => {
      const status = requestRowStatus(row);
      if (status !== "APPROVED") return false;
      return isCompOffRequestType(row.request_type ?? row.requestType);
    });
    if (shouldRefreshBalance) {
      void loadBalanceAndGrants();
    }
  }, [userEmail, loadBalanceAndGrants, earnOnly, myRequestsFrom, myRequestsTo]);

  const applyTeamRequests = useCallback(async (merged: Array<Record<string, unknown>>) => {
    setTeamDecisions((prev) => {
      const next: Record<string, "APPROVED" | "REJECTED"> = { ...prev };
      for (const row of merged) {
        const id = requestRowId(row);
        const serverStatus = requestRowStatus(row);
        if (id && (serverStatus === "APPROVED" || serverStatus === "REJECTED")) {
          next[id] = serverStatus;
        }
      }
      teamDecisionsRef.current = new Map(Object.entries(next));
      return next;
    });
    const emails = merged.map((row) => requestRowEmail(row)).filter(Boolean);
    const names = await resolveEmployeeNamesByEmail(emails);
    setTeamEmployeeNames(names);
    setTeamRequests(applyTeamRequestDecisions(merged, teamDecisionsRef.current));
  }, []);

  const patchTeamRequestStatus = useCallback((requestId: string, next: "APPROVED" | "REJECTED") => {
    teamDecisionsRef.current.set(requestId, next);
    setTeamDecisions((prev) => ({ ...prev, [requestId]: next }));
    setTeamRequests((prev) =>
      prev.map((row) => (requestRowId(row) === requestId ? patchRequestRowStatus(row, next) : row))
    );
  }, []);

  const decideTeamRequest = useCallback(
    async (
      requestId: string,
      flow: "COMP_OFF_EARN" | "COMP_OFF" | null,
      status: "APPROVED" | "REJECTED",
      reason?: string | null
    ) => {
      if (!requestId) throw new Error("Invalid request id.");
      if (flow === "COMP_OFF_EARN" && isHrOnly) {
        throw new Error("HR can view earn requests but cannot approve or reject them.");
      }
      if (flow === "COMP_OFF_EARN" && !hasManagerAccess) {
        throw new Error("Only the project manager can approve or reject earn requests.");
      }
      setTeamRequestUpdatingId(requestId);
      try {
        try {
          if (flow === "COMP_OFF_EARN") {
            await compOffService.updateEarnRequestStatus(Number(requestId), status, reason);
          } else {
            await compOffService.updateRequestStatus(Number(requestId), status, {
              reason,
              requireReasonOnReject: status === "REJECTED" && !isHrOnly,
            });
          }
        } catch (error) {
          if (isAlreadyActedOnRequestError(error)) {
            patchTeamRequestStatus(requestId, status);
            return;
          }
          const inferred = inferStatusFromAlreadyActedError(error);
          if (inferred === "APPROVED" || inferred === "REJECTED") {
            patchTeamRequestStatus(requestId, inferred);
            return;
          }
          throw error;
        }
        patchTeamRequestStatus(requestId, status);
        if (status === "APPROVED" && flow === "COMP_OFF") {
          void loadBalanceAndGrants();
        }
      } finally {
        setTeamRequestUpdatingId(null);
      }
    },
    [hasManagerAccess, isHrOnly, patchTeamRequestStatus, loadBalanceAndGrants]
  );

  const loadTeamRequests = useCallback(async (opts?: { raiseOnError?: boolean }) => {
    const from = teamFilters.from.trim() || defaultRequestRange().from;
    const to = teamFilters.to.trim() || defaultRequestRange().to;
    const cacheKey = `${from}:${to}:${earnOnly}:${teamFilters.flow}:${managerOnlyReview}`;
    const cached = teamRequestsCacheRef.current.get(cacheKey);
    if (cached) {
      setTeamRequests(applyTeamRequestDecisions(cached, teamDecisionsRef.current));
      const emails = cached.map((row) => requestRowEmail(row)).filter(Boolean);
      if (emails.length) {
        resolveEmployeeNamesByEmail(emails).then((names) => setTeamEmployeeNames(names)).catch(() => {});
      }
      return;
    }

    try {
    const teamFlow = earnOnly ? "EARN" : teamFilters.flow;
    if (managerOnlyReview) {
      const team = managerTeamEmails;
      const emailCsv = Array.from(team).filter(Boolean).join(",");
      const skipEarn = teamFlow === "USAGE";
      const skipUsage = earnOnly || teamFlow === "EARN" || !emailCsv;
      const [earnSettled, usageSettled] = await Promise.allSettled([
        skipEarn
          ? Promise.resolve([] as Array<Record<string, unknown>>)
          : compOffService
              .listEarnRequests({ fromDate: from, toDate: to, managerOnly: true })
              .then((res) => compOffService.parseRequestRows(res).map(mapEarnListRow)),
        skipUsage
          ? Promise.resolve([] as Array<Record<string, unknown>>)
          : compOffService.listRequests({
              fromDate: from,
              toDate: to,
              requestType: COMP_OFF_USAGE_LIST_TYPE,
              empEmails: emailCsv,
            }).then((res) => compOffService.parseRequestRows(res)),
      ]);
      const earnRows =
        earnSettled.status === "fulfilled" ? earnSettled.value : [];
      const usageRows =
        usageSettled.status === "fulfilled" ? usageSettled.value : [];
      if (opts?.raiseOnError) {
        if (!skipEarn && earnSettled.status === "rejected") throw earnSettled.reason;
        if (!skipUsage && usageSettled.status === "rejected") throw usageSettled.reason;
      }
      let merged: Array<Record<string, unknown>> = [...earnRows, ...usageRows];
      merged = merged.filter((row) => {
        const t = normalizeCompOffRequestType(row.request_type ?? row.requestType);
        if (teamFlow === "EARN") return t === "COMP_OFF_EARN";
        if (teamFlow === "USAGE") return t === "COMP_OFF";
        return true;
      });
      merged = merged.filter((row) => {
        const t = normalizeCompOffRequestType(row.request_type ?? row.requestType);
        if (t !== "COMP_OFF_EARN" && t !== "COMP_OFF") return false;
        // Earn inbox from managerOnly already scopes to assigned managers — keep those rows.
        if (t === "COMP_OFF_EARN") return true;
        const routedManager = String(
          pickRowField(row, "manager_comp_off_email", "managerCompOffEmail") ?? ""
        )
          .trim()
          .toLowerCase();
        const emp = requestRowEmail(row);
        if (routedManager && userEmail && routedManager === userEmail) return true;
        return emp ? team.has(emp) : false;
      });
      const seenMgr = new Set<string>();
      merged = merged.filter((row) => {
        const id = requestRowId(row);
        if (!id || seenMgr.has(id)) return false;
        seenMgr.add(id);
        return true;
      });
      await applyTeamRequests(merged);
      teamRequestsCacheRef.current.set(cacheKey, applyTeamRequestDecisions(merged, teamDecisionsRef.current));
      return;
    }

    const earnTypes = teamFlow === "USAGE" ? [] : [COMP_OFF_EARN_LIST_TYPE];
    const usageTypes = earnOnly || teamFlow === "EARN" ? [] : [COMP_OFF_USAGE_LIST_TYPE];
    const types = [...earnTypes, ...usageTypes];
    if (!types.length && !hasHrAccess) {
      setTeamEmployeeNames({});
      setTeamRequests([]);
      return;
    }
    let merged: Array<Record<string, unknown>> = [];
    if (hasHrAccess) {
      const skipEarn = teamFlow === "USAGE";
      const skipUsage = earnOnly || teamFlow === "EARN";
      const [earnSettled, usageSettled] = await Promise.allSettled([
        skipEarn
          ? Promise.resolve([] as Array<Record<string, unknown>>)
          : compOffService
              .listEarnRequests({ fromDate: from, toDate: to })
              .then((res) => compOffService.parseRequestRows(res).map(mapEarnListRow)),
        skipUsage
          ? Promise.resolve([] as Array<Record<string, unknown>>)
          : compOffService.fetchHrTeamRequests({
              fromDate: from,
              toDate: to,
              requestTypes: [COMP_OFF_USAGE_LIST_TYPE],
            }),
      ]);
      const earnRows = earnSettled.status === "fulfilled" ? earnSettled.value : [];
      const usageRows = usageSettled.status === "fulfilled" ? usageSettled.value : [];
      if (opts?.raiseOnError) {
        if (!skipEarn && earnSettled.status === "rejected") throw earnSettled.reason;
        if (!skipUsage && usageSettled.status === "rejected") throw usageSettled.reason;
      }
      merged = [...earnRows, ...usageRows];
    } else {
      merged = await compOffService.fetchHrTeamRequests({
        fromDate: from,
        toDate: to,
        requestTypes: types,
      });
    }
    merged = merged.filter((row) => isCompOffRequestType(row.request_type ?? row.requestType));

    merged = merged.filter((row) => {
      const t = normalizeCompOffRequestType(row.request_type ?? row.requestType);
      if (teamFlow === "EARN") return t === "COMP_OFF_EARN";
      if (teamFlow === "USAGE") return t === "COMP_OFF";
      return true;
    });
    const seen = new Set<string>();
    merged = merged.filter((row) => {
      const id = requestRowId(row);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    await applyTeamRequests(merged);
    teamRequestsCacheRef.current.set(cacheKey, applyTeamRequestDecisions(merged, teamDecisionsRef.current));
    } catch (error) {
      setTeamEmployeeNames({});
      setTeamRequests([]);
      if (opts?.raiseOnError) throw error;
    }
  }, [
    teamFilters,
    hasHrAccess,
    managerOnlyReview,
    managerTeamEmails,
    userEmail,
    accountManagerEmails,
    applyTeamRequests,
  ]);

  function openRejectDialog(requestId: string, flow: "COMP_OFF_EARN" | "COMP_OFF") {
    setRejectReason("");
    setPendingReject({ requestId, flow });
  }

  async function confirmRejectRequest() {
    if (!pendingReject) return;
    const reason = rejectReason.trim();
    if (!reason) throw new Error("Reason is required when rejecting a request.");
    await decideTeamRequest(pendingReject.requestId, pendingReject.flow, "REJECTED", reason);
    setPendingReject(null);
    setRejectReason("");
    await loadTeamRequests();
  }

  const canReviewTeam = managerOnlyReview || hasHrAccess;
  const showMyCompOff =
    forcedTab === "my" || (!forcedTab && mainTab !== "team");
  const showTeamReview =
    forcedTab === "team" ||
    (!forcedTab && canReviewTeam && mainTab === "team");

  useEffect(() => {
    if (!showMyCompOff) return;
    void loadBalanceAndGrants();
    void loadAssignedProjects();
    void loadMyRequests();
  }, [showMyCompOff, loadBalanceAndGrants, loadAssignedProjects, loadMyRequests]);

  useEffect(() => {
    if (balanceUnits === null && grants.length === 0 && !grantsLoading) {
      void loadProfileBalanceFallback();
    }
  }, [balanceUnits, grants.length, grantsLoading, loadProfileBalanceFallback]);

  useEffect(() => {
    const onTeam = forcedTab === "team" || mainTab === "team";
    if (!onTeam || (!hasManagerAccess && !hasHrAccess)) return;
    if (managerOnlyReview && managerPortfolioLoading) return;
    void loadTeamRequests().catch(() => undefined);
  }, [
    forcedTab,
    mainTab,
    teamFilters.from,
    teamFilters.to,
    teamFilters.flow,
    hasManagerAccess,
    hasHrAccess,
    managerOnlyReview,
    managerPortfolioLoading,
    loadTeamRequests,
    earnOnly,
  ]);

  useEffect(() => {
    if (!embedded || teamReloadKey === undefined) return;
    const onTeam = forcedTab === "team" || mainTab === "team";
    if (!onTeam || (!hasManagerAccess && !hasHrAccess)) return;
    if (managerOnlyReview && managerPortfolioLoading) return;
    void loadTeamRequests().catch(() => undefined);
  }, [
    embedded,
    forcedTab,
    mainTab,
    teamReloadKey,
    hasManagerAccess,
    hasHrAccess,
    managerOnlyReview,
    managerPortfolioLoading,
    loadTeamRequests,
  ]);

  useEffect(() => {
    if (!showMyCompOff) return;
    if (!myRequestsFrom || !myRequestsTo) return;
    const id = window.setTimeout(() => {
      void loadMyRequests();
    }, 0);
    return () => window.clearTimeout(id);
  }, [showMyCompOff, myRequestsFrom, myRequestsTo, loadMyRequests]);

  async function submitEarn() {
    const workedDate = normalizeToApiDate(earnForm.worked_date.trim());
    const projectCode = earnForm.project_code.trim();
    const comments = earnForm.comments.trim();
    if (!projectCode) throw new Error("Project is required.");
    if (!workedDate) throw new Error("Worked date is required.");
    if (compareApiDates(workedDate, todayYmd()) > 0) {
      throw new Error("Worked date cannot be in the future.");
    }
    if (!selectedManagerEmails.length) throw new Error("At least one primary manager must be selected.");
    if (!selectedAdditionalManagerEmails.length) throw new Error("At least one secondary manager must be selected.");
    if (!comments) throw new Error("Comments are required.");
    if (comments.length > 2000) throw new Error("Comments must be 2000 characters or less.");
    if (editingRequestId) {
      throw new Error("Editing earn requests is not supported. Revoke and submit a new earn request.");
    }
    await compOffService.createEarnRequest({
      worked_date: workedDate,
      workedDate,
      project_code: projectCode,
      projectCode,
      work_description: comments,
      workDescription: comments,
      manager_emails: selectedManagerEmails,
      managerEmails: selectedManagerEmails,
      secondary_manager_emails: selectedAdditionalManagerEmails,
      secondaryManagerEmails: selectedAdditionalManagerEmails,
    });
    setEarnForm({ worked_date: "", project_code: "", manager_comp_off_email: "", comments: "" });
    setSelectedManagerEmails([]);
    setSelectedAdditionalManagerEmails([]);
    setEditingRequestId("");
    await Promise.all([loadMyRequests(), loadBalanceAndGrants()]);
  }

  async function submitUsage() {
    if (!canUseCompOff) {
      throw new Error(
        "No approved comp-off credits available. Submit an earn request and get it approved before applying for usage."
      );
    }
    const fromDate = normalizeToApiDate(usageForm.request_from_date.trim());
    const toDate = normalizeToApiDate(usageForm.request_to_date.trim());
    const comments = usageForm.comments.trim();
    if (!fromDate || !toDate) throw new Error("From date and to date are required.");
    if (!parseApiDate(fromDate) || !parseApiDate(toDate)) {
      throw new Error("Please provide valid dates (dd/mm/yyyy).");
    }
    if (compareApiDates(fromDate, toDate) > 0) {
      throw new Error("Start Date cannot be later than End Date.");
    }
    const days = calendarDaysInclusive(fromDate, toDate);
    if (days < 1) throw new Error("Select at least one calendar day.");
    const sameDayEarnDates = sameDayCompOffEarnDatesInUsageRange(grants, fromDate, toDate);
    const available = await compOffService.resolveAvailableUnits(fromDate);
    if (
      (!Number.isFinite(available) || available < days) &&
      sameDayEarnDates.length > 0
    ) {
      throw new Error(sameDayCompOffUsageErrorMessage(sameDayEarnDates));
    }
    if (!Number.isFinite(available) || available <= 0) {
      throw new Error(
        "No approved comp-off credits available. Submit an earn request and get it approved before applying for usage."
      );
    }
    if (available < days) {
      throw new Error(
        `Insufficient comp-off balance. Available: ${available}, requested: ${days} day(s).`
      );
    }
    if (comments.length > 200) throw new Error("Comments must be 200 characters or less.");
    const payload = {
      request_type: "COMP_OFF",
      request_from_date: fromDate,
      request_to_date: toDate,
      comments,
      comment: comments,
      description: comments,
      remarks: comments,
      is_half_day: false,
    };
    if (editingRequestId) {
      await compOffService.updateRequest({
        ...payload,
        user_request_id: Number(editingRequestId),
      });
    } else {
      await compOffService.createRequest(payload);
    }
    setUsageForm({ request_from_date: "", request_to_date: "", comments: "" });
    setEditingRequestId("");
    await loadMyRequests();
  }

  const pageBody = (
    <section>
      {!forcedTab && canReviewTeam ? (
        <div className="flex items-center justify-between border-b border-wt-border/80 px-5 pb-4 pt-6">
          <Tabs value={mainTab} onValueChange={(value) => setMainTab(value as "my" | "team")} className="gap-0">
            <TabsList aria-label="Comp-off views" variant="default">
              <TabsTrigger value="my">My Comp-off</TabsTrigger>
              <TabsTrigger value="team">Team Review</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}
      {showMyCompOff ? (
        <div className={`${!embedded ? "pt-6" : ""} space-y-4 px-5 pb-5`}>
          {!embedded ? <h2 className="text-xl font-semibold tracking-tight text-wt-text">Comp-off</h2> : null}
          <Tabs value={compOffSubTab} onValueChange={(v) => setCompOffSubTab(v as "apply" | "view")} orientation="horizontal">
            <TabsList variant="line" className="w-full justify-start border-b border-wt-border/80">
              <TabsTrigger value="apply">Apply for Compensation Off</TabsTrigger>
              <TabsTrigger value="view">History</TabsTrigger>
            </TabsList>

            <TabsContent value="apply" className="pt-6">
              <div className="space-y-4">
                {/* Balance Card */}
                <div className="bg-muted/40 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" />Comp Off Balance</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {displayBalance}{" "}
                        <span className="text-lg font-normal text-muted-foreground">
                          unit{displayBalance === 1 ? "" : "s"}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Next expiry</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {nearestExpiryDate ? formatApiDateDisplay(nearestExpiryDate) : "\u2014"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Earn Credit form */}
                <div className="bg-muted/40 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="font-semibold tracking-tight text-foreground">Earn Credit</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProjectSelectField
                      label="Project"
                      required
                      value={earnForm.project_code}
                      options={projectOptions}
                      onChange={onEarnProjectChange}
                      onAddProject={onAddEarnProject}
                      addProjectLabel={
                        hasHrAccess
                          ? (name) => `Go to Projects to create "${name}"`
                          : undefined
                      }
                      selectOnAdd={!hasHrAccess}
                      disabled={actionLoading || redirectingToProjects}
                      placeholder={
                        hasHrAccess ? "Search projects or create new" : "Search or add project"
                      }
                    />
                    <DatePicker
                      label="Worked date"
                      required
                      value={earnForm.worked_date}
                      onChange={(v) => setEarnForm((p) => ({ ...p, worked_date: v }))}
                    />
                  </div>
                </div>

                {/* Managers + Comments */}
                <div className="bg-muted/40 rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <LeaveManagerSelector
                        label="Primary Managers"
                        required
                        selectedEmails={selectedManagerEmails}
                        onChange={(emails) => {
                          setSelectedManagerEmails(emails);
                          const primarySet = new Set(emails.map((e) => e.trim().toLowerCase()));
                          setSelectedAdditionalManagerEmails((prev) =>
                            prev.filter((e) => !primarySet.has(e.trim().toLowerCase()))
                          );
                        }}
                        disabled={actionLoading}
                      />
                      {!selectedManagerEmails.length ? (
                        <p className="text-xs text-destructive">Select at least one manager.</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <LeaveAdditionalRecipientsSelector
                        selectedEmails={selectedAdditionalManagerEmails}
                        onChange={setSelectedAdditionalManagerEmails}
                        excludedEmails={selectedManagerEmails}
                        disabled={actionLoading}
                      />
                      {!selectedAdditionalManagerEmails.length ? (
                        <p className="text-xs text-destructive">Select at least one secondary manager.</p>
                      ) : null}
                    </div>
                  </div>
                  <TextAreaField
                    label="Comments / Work Description"
                    required
                    value={earnForm.comments}
                    onChange={(v) => setEarnForm((p) => ({ ...p, comments: v }))}
                  />
                  <Button variant="brand" type="button" className="px-3 py-2" disabled={actionLoading || !earnForm.project_code.trim() || !earnForm.worked_date.trim() || !selectedManagerEmails.length || !selectedAdditionalManagerEmails.length || !earnForm.comments.trim()} onClick={() =>
                      runAction(compOffEarnActionLabel(editingRequestId ? "update" : "submit"), submitEarn)
                    }
                  >
                    {editingRequestId ? "Save Earn Request" : "Submit Earn Request"}
                  </Button>
                </div>

                {!earnOnly ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold tracking-tight text-foreground">Use Comp Off</h3>
                    <p className="text-xs text-muted-foreground">
                      To use comp-off balance, submit a request from{" "}
                      <strong>My leave requests</strong>.
                    </p>
                  </div>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="view" className="pt-3">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <h3 className="text-base font-semibold tracking-tight">History</h3>
                <div className="flex items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">From Date</span>
                    <DatePicker label="" value={myRequestsFrom} onChange={(v) => { setMyRequestsFrom(v); myRequestsCacheRef.current.clear(); }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">To Date</span>
                    <DatePicker label="" value={myRequestsTo} onChange={(v) => { setMyRequestsTo(v); myRequestsCacheRef.current.clear(); }} />
                  </div>
                  <RefreshIconButton
                    onClick={() => runAction("Refresh", loadMyRequests)}
                    disabled={actionLoading}
                    loading={actionLoading}
                  />
                </div>
              </div>

              {actionLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
              <ScrollableTable maxHeightClass="max-h-[min(50vh,380px)]">
                <WtTable>
                  <TableHeader className={`${WT_STICKY_TABLE_HEAD_CLASS} text-[11px] font-semibold tracking-wider text-muted-foreground bg-muted/40`}>
                    <TableRow className="hover:bg-transparent h-10">
                      <TableHead className="font-semibold px-3">Employee Name</TableHead>
                      <TableHead className="font-semibold px-3">Date of Request</TableHead>
                      <TableHead className="font-semibold px-3">Project</TableHead>
                      <TableHead className="font-semibold px-3">Comp Off Days</TableHead>
                      <TableHead className="font-semibold px-3">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewPagination.pageItems.length ? (
                      viewPagination.pageItems.map((row, idx) => {
                        const id = requestRowId(row);
                        const status = requestRowStatus(row);
                        const flow = normalizeCompOffRequestType(row.request_type ?? row.requestType);
                        const dateDisplay =
                          flow === "COMP_OFF_EARN"
                            ? String(
                                pickRowField(row, "worked_date", "workedDate", "request_from_date", "requestFromDate") ?? ""
                              )
                            : `${String(pickRowField(row, "request_from_date", "requestFromDate") ?? "")} \u2013 ${String(
                                pickRowField(row, "request_to_date", "requestToDate") ?? ""
                              )}`;
                        const projectLabel = earnProjectLabel(row);
                        const days = flow === "COMP_OFF_EARN"
                          ? 1
                          : calendarDaysInclusive(
                              String(pickRowField(row, "request_from_date", "requestFromDate") ?? ""),
                              String(pickRowField(row, "request_to_date", "requestToDate") ?? "")
                            );
                        return (
                          <TableRow key={`${id || idx}`} className={idx % 2 === 1 ? "bg-muted/20" : ""}>
                            <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                              {String(
                                pickRowField(row, "employee_name", "employeeName") ??
                                  pickRowField(row, "emp_email", "empEmail") ??
                                  user?.name ??
                                  user?.email ??
                                  "\u2014"
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                              {dateDisplay}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                              {projectLabel}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                              {days}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 whitespace-nowrap">
                              <RequestStatusBadge status={status} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="h-[200px] text-center align-middle">
                          <div className="flex flex-col items-center gap-2">
                            <Inbox className="size-8 text-muted-foreground/40" />
                            <span className="text-sm text-muted-foreground">
                              No applications yet.
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </WtTable>
              </ScrollableTable>
              )}
              {viewPagination.totalItems > 0 ? (
                <div className="border-t border-border/50 px-0 py-3">
                  <ListPagination
                    page={viewPagination.page}
                    totalPages={viewPagination.totalPages}
                    totalItems={viewPagination.totalItems}
                    rangeStart={viewPagination.rangeStart}
                    rangeEnd={viewPagination.rangeEnd}
                    pageSize={viewPagination.pageSize}
                    pageSizeOptions={viewPagination.pageSizeOptions}
                    onPageChange={viewPagination.setPage}
                    onPageSizeChange={viewPagination.setPageSize}
                  />
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      ) : null}

      {showTeamReview ? (
        <div className={`space-y-3 px-5 pb-4 ${!embedded ? "pt-4" : ""}`}>
          {!embedded ? <h2 className="text-xl font-semibold text-wt-text">Comp-off</h2> : null}
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <h3 className="text-base font-semibold tracking-tight">Applications</h3>
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">From Date</span>
                <DatePicker label="" value={teamFilters.from} onChange={(v) => { setTeamFilters((p) => ({ ...p, from: v })); teamRequestsCacheRef.current.clear(); }} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">To Date</span>
                <DatePicker label="" value={teamFilters.to} onChange={(v) => { setTeamFilters((p) => ({ ...p, to: v })); teamRequestsCacheRef.current.clear(); }} />
              </div>
              {(managerOnlyReview || hasHrAccess) && !earnOnly ? (
                <SelectField
                  label="Flow"
                  value={teamFilters.flow}
                  options={[
                    { value: "ALL", label: "All" },
                    { value: "EARN", label: "Earn Credit" },
                    { value: "USAGE", label: "Usage" },
                  ]}
                  onChange={(v) =>
                    setTeamFilters((p) => ({
                      ...p,
                      flow: v as "ALL" | "EARN" | "USAGE",
                    }))
                  }
                />
              ) : null}
              <RefreshIconButton
                onClick={() =>
                  runAction(compOffTeamReviewActionLabel("COMP_OFF", "fetch"), () =>
                    loadTeamRequests({ raiseOnError: true })
                  )
                }
                disabled={actionLoading}
                loading={actionLoading}
                label="Refresh Team Requests"
              />
            </div>
          </div>

          {actionLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : teamPaginated.pageItems.length ? (
            <>
              <ScrollableTable maxHeightClass="max-h-[min(70vh,520px)]">
              <WtTable>
                <TableHeader className={`${WT_STICKY_TABLE_HEAD_CLASS} text-[11px] font-semibold tracking-wider text-muted-foreground bg-muted/40`}>
                  <TableRow className="hover:bg-transparent h-10">
                    <TableHead className="font-semibold px-3">Employee</TableHead>
                    <TableHead className="font-semibold px-3">From</TableHead>
                    <TableHead className="font-semibold px-3">To</TableHead>
                    <TableHead className="font-semibold px-3">Description</TableHead>
                    {isHrOnly ? (
                      <TableHead className="font-semibold px-3">Manager status</TableHead>
                    ) : (
                      <>
                        <TableHead className="font-semibold px-3">Manager status</TableHead>
                        {hasHrAccess ? (
                          <TableHead className="font-semibold px-3">HR status</TableHead>
                        ) : null}
                        <TableHead className="text-right font-semibold px-3">Actions</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamPaginated.pageItems.map((row, idx) => {
                    const id = requestRowId(row);
                    const flow = normalizeCompOffRequestType(
                      row.request_type ?? row.requestType
                    );
                    const finalStatus = requestFinalStatus(row);
                    const managerStatus =
                      flow === "COMP_OFF_EARN"
                        ? requestEarnManagerStatus(row)
                        : requestManagerStatus(row);
                    const managerReason = formatStageRejectionReason(
                      managerStatus,
                      pickRowField(row, "manager_reason", "managerReason")
                    );
                    const hrStatus = requestHrStatus(row);
                    const rowEmail = requestRowEmail(row);
                    const isAm = rowEmail ? accountManagerEmails.has(rowEmail) : false;
                    const routedManager = String(
                      pickRowField(row, "manager_comp_off_email", "managerCompOffEmail") ?? ""
                    )
                      .trim()
                      .toLowerCase();
                    const managerRoutedOk =
                      hasManagerAccess &&
                      ((userEmail && routedManager === userEmail) ||
                        (rowEmail ? managerTeamEmails.has(rowEmail) : false));
                    const isRowUpdating = teamRequestUpdatingId === id;
                    const canManagerActEarn =
                      flow === "COMP_OFF_EARN" &&
                      hasManagerAccess &&
                      !isHrOnly &&
                      managerStatus === "PENDING" &&
                      managerRoutedOk;
                    const canManagerActUsage =
                      flow === "COMP_OFF" &&
                      hasManagerAccess &&
                      managerStatus === "PENDING" &&
                      managerRoutedOk;
                    const canHrActUsage =
                      hasHrAccess &&
                      flow === "COMP_OFF" &&
                      canHrActOnCompOff(row, { hasHrAccess });
                    const canReview =
                      !isRowUpdating &&
                      (canManagerActEarn || canManagerActUsage || canHrActUsage);
                    const renderStatusBadge = (value: string) => {
                      if (value === "\u2014" || !value) {
                        return <span className="text-muted-foreground">{value || "\u2014"}</span>;
                      }
                      return <RequestStatusBadge status={value} />;
                    };
                    return (
                      <TableRow key={`${id || idx}`}>
                        <TableCell className="px-3 py-2.5 whitespace-nowrap">
                          {compOffEmployeeDisplayName(row, teamEmployeeNames)}
                          {isAm ? (
                            <Badge variant="secondary" className={`ml-2 text-[10px] ${filledBadgeClass("info")}`}>
                              AM
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 whitespace-nowrap">
                          {String(
                            pickRowField(row, "request_from_date", "requestFromDate") ?? "\u2014"
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 whitespace-nowrap">
                          {String(
                            pickRowField(row, "request_to_date", "requestToDate") ?? "\u2014"
                          )}
                        </TableCell>
                        <TableCell
                          className="px-3 py-2.5 max-w-[200px] truncate"
                          title={String(
                            pickRowField(row, "comments", "comment", "description", "remarks") ?? ""
                          )}
                        >
                          {String(
                            pickRowField(row, "comments", "comment", "description", "remarks") ?? "\u2014"
                          )}
                        </TableCell>
                        {isHrOnly ? (
                          <TableCell
                            className="px-3 py-2.5 whitespace-nowrap"
                            title={managerReason !== "\u2014" ? managerReason : undefined}
                          >
                            {renderStatusBadge(managerStatus)}
                          </TableCell>
                        ) : (
                          <>
                            <TableCell
                              className="px-3 py-2.5 whitespace-nowrap"
                              title={managerReason !== "\u2014" ? managerReason : undefined}
                            >
                              {renderStatusBadge(managerStatus)}
                            </TableCell>
                            {hasHrAccess ? (
                              <TableCell className="px-3 py-2.5 whitespace-nowrap">
                                {flow === "COMP_OFF" ? renderStatusBadge(hrStatus) : "\u2014"}
                              </TableCell>
                            ) : null}
                            <TableCell className="px-3 py-2.5 text-right whitespace-nowrap">
                              {canReview && flow ? (
                                <div className="inline-flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10"
                                    disabled={!id || isRowUpdating}
                                    onClick={() =>
                                      runAction(
                                        compOffTeamReviewActionLabel(flow, "approve"),
                                        async () => {
                                          await decideTeamRequest(id, flow, "APPROVED");
                                          await loadTeamRequests();
                                        }
                                      )
                                    }
                                  >
                                    {isRowUpdating ? "\u2026" : "Approve"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="xs"
                                    disabled={!id || isRowUpdating}
                                    onClick={() => openRejectDialog(id, flow)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">{"\u2014"}</span>
                              )}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </WtTable>
            </ScrollableTable>
            {teamPaginated.totalItems > 0 ? (
              <div className="border-t border-border/50 px-0 py-3">
                <ListPagination
                  page={teamPaginated.page}
                  totalPages={teamPaginated.totalPages}
                  totalItems={teamPaginated.totalItems}
                  rangeStart={teamPaginated.rangeStart}
                  rangeEnd={teamPaginated.rangeEnd}
                  pageSize={teamPaginated.pageSize}
                  pageSizeOptions={teamPaginated.pageSizeOptions}
                  onPageChange={teamPaginated.setPage}
                  onPageSizeChange={teamPaginated.setPageSize}
                />
              </div>
            ) : null}
            </>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {actionLoading ? (
                <Loader2 className="size-5 animate-spin mr-2" />
              ) : (
                <span>
                  No requests loaded. Click <strong>Fetch requests</strong>.
                </span>
              )}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );

  const rejectDialog = (
    <UserRequestRejectDialog
      open={Boolean(pendingReject)}
      title={
        pendingReject?.flow === "COMP_OFF_EARN"
          ? "Reject earn request"
          : "Reject comp-off usage"
      }
      description={
        pendingReject?.flow === "COMP_OFF_EARN"
          ? "A reason is required. Only the project manager can reject earn requests."
          : "A reason is required when rejecting. Balance is consumed only after the manager approves usage."
      }
      reasonPlaceholder="Enter rejection reason"
      confirmLabel="Reject"
      confirmingLabel="Rejecting…"
      reason={rejectReason}
      onReasonChange={setRejectReason}
      onCancel={() => {
        setPendingReject(null);
        setRejectReason("");
      }}
      onConfirm={() =>
        runAction(
          pendingReject?.flow === "COMP_OFF_EARN"
            ? "Reject earn request"
            : "Reject comp-off usage",
          confirmRejectRequest
        )
      }
      loading={actionLoading}
    />
  );

  if (embedded) {
    return (
      <>
        <OnboardingGate requiresSelfOnboarding={requiresSelfOnboarding}>{pageBody}</OnboardingGate>
        {rejectDialog}
        {redirectingToProjects ? <WtLoadingOverlay label="Opening Projects…" /> : null}
      </>
    );
  }

  return (
    <>
      <DashboardPageShell>
        <OnboardingGate requiresSelfOnboarding={requiresSelfOnboarding}>{pageBody}</OnboardingGate>
      </DashboardPageShell>
      {rejectDialog}
      {redirectingToProjects ? <WtLoadingOverlay label="Opening Projects…" /> : null}
    </>
  );
}
