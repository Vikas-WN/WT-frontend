"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
import { Skeleton } from "@/components/ui/skeleton";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/api/httpClient";
import { endpoints } from "@/api/endpoints";
import { hrmsService } from "@/services/hrms.service";
import { useMyLeaveRequests, unfilteredLeaveRequestRange } from "@/hooks/leave/useMyLeaveRequests";
import { ApiError } from "@/api/error";
import { toRows, toPagedRows } from "@/utils/apiRows";
import {
  formatActionErrorMessage,
  formatActionSuccessMessage,
  userRequestActionLabel,
  formatUserRequestTypeLabel,
  normalizeUserRequestType,
  USER_REQUEST_FILTER_TYPE_OPTIONS,
  USER_REQUEST_TYPE_SELECT_OPTIONS,
} from "@/utils/actionToast";
import {
  normalizePickerEmail,
  requestRowEmail,
} from "@/utils/learning/onboardOptions";
import { useAccountManagerEmails } from "@/hooks/useAccountManagerEmails";
import { HrReviewNoticeBanner } from "@/components/hr-review/HrReviewNoticeBanner";
import { hasDmRole, isAccountManagerEmployeeUser } from "@/utils/roles";
import {
  HARDCODED_DEPARTMENT_OPTIONS,
  MAX_ONBOARD_FILE_BYTES,
  MAX_ONBOARD_TOTAL_BYTES,
} from "@/constants/dashboard";
import {
  defaultInvitedEmployeesDateRange,
  filterInvitedRowsByCreatedAtRange,
  formatInvitedEmployeeTableRows,
  allocationAccManagerCell,
} from "@/utils/dashboard/invitedEmployees";
import {
  isValidPersonName,
  isValidIndiaMobile,
  resolveInternBandId,
  generateAutomaticProjectCode,
  designationAllowsFlexibleHours,
  FLEXIBLE_ALLOCATION_HOUR_OPTIONS,
  RESTRICTED_ALLOCATION_HOUR_OPTIONS,
  formatAllocatedHoursPercentLabel,
} from "@/utils/dashboard/validation";
import { applyTheme } from "@/utils/dashboard/theme";
import {
  isManagerFlagTruthy,
  isManagerRoleLabel,
  buildUserIdToNameMap,
  buildEmailToNameMap,
  buildProjectCodeDisplayMap,
  enrichAllocationRowsForDisplay,
  normalizeForecastRows,
  allocationRowEmail,
  allocationProjectCode,
  allocationProjectTitleFromRow,
} from "@/utils/dashboard/allocationDisplay";
import {
  normalizeAssignedProjects,
  mergeProjectAndAllocationData,
  managerProjectCode,
  managerProjectName,
  managerTeamEmails,
  managerTeamRowsForProject,
} from "@/utils/dashboard/projects";
import { InputField, SelectField, TextAreaField, FileField, UploadTile } from "@/components/dashboard/ui/forms";
import { DatePicker } from "@/components/ui/date-picker";
import {
  ProfilePhotoAvatar,
  ProfileField,
  formatSecondarySkillsForProfile,
} from "@/components/dashboard/ui/profile";
import { Badge } from "@/components/ui/badge";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { TableSortHeader } from "@/components/dashboard/ui/TableSortHeader";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import {
  activeSortDirectionForColumn,
  applyListSort,
  LEAVE_REQUEST_SORT_OPTIONS,
  toggleColumnSort,
} from "@/utils/listSort";
import { Calendar, Clock, Home, Users, Building2, Wallet } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { OnboardingGate } from "@/components/dashboard/shared/OnboardingGate";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { useDashboardAction } from "@/components/dashboard/shared/useDashboardAction";
import {
  compareApiDates,
  formatApiDate,
  normalizeToApiDate,
  parseApiDate,
  todayApiDate,
} from "@/utils/apiDate";
import {
  canSecondaryManagerApproveOnLeave,
  canSecondaryManagerRejectOnLeave,
  canPrimaryManagerActOnLeave,
  filterTeamRequestsForPrimaryManager,
  hasSecondaryLeaveManagers,
  requestSecondaryManagerStatus,
} from "@/utils/leaveManagerDisplay";
import {
  canHrShowTeamRequestActions,
  canManagerActOnCompOffEarn,
  canManagerActOnRequest,
  canManagerRejectRequest,
  extractStatusUpdateData,
  formatApprovalStageLabel,
  formatStageRejectionReason,
  isCompOffEarnRequestType,
  listScopedUserRequests,
  fetchPaginatedScopedUserRequests,
  mergeStatusUpdateIntoRow,
  applyLeaveTeamRequestDecisions,
  patchLeaveTeamRequestStatus,
  requestFinalStatus,
  requestHrStatus,
  requestManagerStatus,
  hrTeamActionBlockedHint,
  updateUserRequestStatus,
  type UserRequestStatusValue,
} from "@/utils/userRequest";
import { formatLeaveDaysCount } from "@/utils/leaveRequestDisplay";
import { useNonOptionalHolidayDates } from "@/hooks/leave/useNonOptionalHolidayDates";
import { buildUserRequestBody } from "@/utils/leaveRequestPayload";
import { activeAllocationsRequireClientApproval, isTalentPoolLeaveRouting } from "@/utils/leaveAllocations";
import { LeaveBalanceSummary } from "@/components/dashboard/leave/LeaveBalanceSummary";
import { HrLeaveBalancesPanel } from "@/components/dashboard/leave/HrLeaveBalancesPanel";
import { CONTENT_CARD_CLASS, FILTER_BAR_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

import { LeaveManagerSelector } from "@/components/dashboard/leave/LeaveManagerSelector";
import { LeaveAdditionalRecipientsSelector } from "@/components/dashboard/leave/LeaveAdditionalRecipientsSelector";

import {
  calendarDaysInclusive,
  mapEarnListRow,
  normalizeCompOffRequestType,
  pickRowField,
} from "@/utils/compOff";
import { compOffService } from "@/services/compOff.service";
import { UserRequestRejectDialog } from "@/components/dashboard/leave/UserRequestRejectDialog";
import { CompOffCreditsDialog } from "@/components/dashboard/leave/CompOffCreditsDialog";
import { WfhExceptionModal } from "@/components/dashboard/leave/WfhExceptionModal";
import dynamic from "next/dynamic";
import { LeaveRequestForm } from "@/components/dashboard/leave/LeaveRequestForm";
import { MyLeaveRequestsView } from "@/components/dashboard/leave/MyLeaveRequestsView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const CompOffPageClient = dynamic(
  () =>
    import("@/components/comp-off/CompOffPageClient").then((m) => ({
      default: m.CompOffPageClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 rounded-2xl border border-wt-border/70 bg-wt-surface-1 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    ),
  }
);

const LEAVE_REQUESTS_TABLE_MIN_HEIGHT = "min-h-[320px]";
const MY_LEAVE_TABLE_COL_COUNT = 8;

function createDefaultLeaveRequestForm() {
  const today = todayApiDate();
  return {
    request_from_date: today,
    request_to_date: today,
    request_type: "LEAVE",
    comments: "",
    is_half_day: false,
    client_approval: false,
  };
}

function leaveRequestMatchesSearch(row: Record<string, unknown>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.request_type,
    row.requestType,
    formatUserRequestTypeLabel(row.request_type ?? row.requestType),
    row.request_from_date,
    row.requestFromDate,
    row.request_to_date,
    row.requestToDate,
    row.user_request_status,
    row.userRequestStatus,
    row.status,
    row.manager_status,
    row.managerStatus,
    row.manager_reason,
    row.managerReason,
    row.hr_status,
    row.hrStatus,
    row.hr_reason,
    row.hrReason,
    row.comments,
    row.employee_display,
    row.name,
    row.employee_name,
    row.employeeName,
    row.email,
    row.user_email,
    row.userEmail,
  ]
    .map((v) => String(v ?? "").toLowerCase())
    .join(" ");
  return haystack.includes(q);
}

export function LeavePageClient() {
  const isManagerRoleLabel = (value: unknown): boolean =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .includes("manager");
  const { user, refresh: refreshSession } = useAuth();
  const holidayDates = useNonOptionalHolidayDates();
  const userEmail = useMemo(() => String(user?.email ?? "").trim(), [user?.email]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTeamLeaveRoute = pathname.includes("/dashboard/leave/team");
  const tabFromQuery = String(searchParams.get("tab") ?? "").trim().toLowerCase();
  const deepLinkRequestId = String(searchParams.get("requestId") ?? "").trim();
  const deepLinkFrom = String(searchParams.get("from") ?? "").trim();
  const deepLinkTo = String(searchParams.get("to") ?? "").trim();
  const [highlightRequestId, setHighlightRequestId] = useState("");
  const deepLinkAppliedKeyRef = useRef("");
  const [leaveSubTab, setLeaveSubTab] = useState<
    "my" | "team" | "org" | "comp-off" | "wfh" | "balances"
  >(() => {
    if (tabFromQuery === "comp-off" && !isTeamLeaveRoute) return "comp-off";
    if (
      tabFromQuery === "wfh" ||
      tabFromQuery === "balances" ||
      tabFromQuery === "team" ||
      tabFromQuery === "org" ||
      tabFromQuery === "my"
    ) {
      return tabFromQuery;
    }
    return isTeamLeaveRoute ? "team" : "my";
  });
  useEffect(() => {
    if (
      tabFromQuery === "comp-off" ||
      tabFromQuery === "wfh" ||
      tabFromQuery === "balances" ||
      tabFromQuery === "team" ||
      tabFromQuery === "org" ||
      tabFromQuery === "my"
    ) {
      // Comp Off Credit lives on personal leave only.
      if (tabFromQuery === "comp-off" && isTeamLeaveRoute) {
        setLeaveSubTab("team");
        return;
      }
      setLeaveSubTab(tabFromQuery);
      return;
    }
    if (isTeamLeaveRoute) {
      setLeaveSubTab((prev) => {
        if (prev === "balances" || prev === "team" || prev === "org") {
          return prev;
        }
        return "team";
      });
    } else if (pathname.includes("/dashboard/leave")) {
      setLeaveSubTab((prev) => {
        if (prev === "team" || prev === "org") return "my";
        if (prev === "balances" || prev === "comp-off" || prev === "wfh") return prev;
        return "my";
      });
    }
  }, [isTeamLeaveRoute, pathname, tabFromQuery]);
  const myLeaveTabActive = leaveSubTab === "my" || leaveSubTab === "wfh";
  const teamLeaveTabActive = leaveSubTab === "team" || leaveSubTab === "org";
  const queryClient = useQueryClient();
  const invalidateLeaveBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["leave", "my-balance"] });
  }, [queryClient]);

  const [myRequestsFromDate, setMyRequestsFromDate] = useState("");
  const [myRequestsToDate, setMyRequestsToDate] = useState("");
  const myLeaveRequestsQ = useMyLeaveRequests(
    userEmail,
    myLeaveTabActive,
    myRequestsFromDate,
    myRequestsToDate
  );
  const myLeaveRequests = myLeaveRequestsQ.rows;
  const myLeaveRequestsLoading = myLeaveRequestsQ.isFetching;
  const loadMyLeaveRequests = useCallback(async () => {
    if (myLeaveRequestsQ.refetch) await myLeaveRequestsQ.refetch();
  }, [myLeaveRequestsQ.refetch]);

  const handleSubmitWfhException = useCallback(
    async (payload: { request_from_date: string; request_to_date: string; comments: string }) => {
      const body = {
        request_from_date: payload.request_from_date,
        request_to_date: payload.request_to_date,
        request_type: "WFH_EXCEPTION",
        comments: payload.comments,
      };
      await apiClient.post(endpoints.userRequest.root, {
        contentType: "application/json",
        body: JSON.stringify(body),
      });
      showSuccessToast("Custom Work From Home request submitted to HR for approval.");
      invalidateLeaveBalance();
      await loadMyLeaveRequests();
    },
    [invalidateLeaveBalance, loadMyLeaveRequests]
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [invitedListFromDate, setInvitedListFromDate] = useState(
    () => defaultInvitedEmployeesDateRange().from
  );
  const [invitedListToDate, setInvitedListToDate] = useState(
    () => defaultInvitedEmployeesDateRange().to
  );
  const [invitedApiServerRange, setInvitedApiServerRange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const invitedListFromDateRef = useRef(invitedListFromDate);
  const invitedListToDateRef = useRef(invitedListToDate);
  invitedListFromDateRef.current = invitedListFromDate;
  invitedListToDateRef.current = invitedListToDate;
  const [allocations, setAllocations] = useState<Array<Record<string, unknown>>>([]);
  const [allocationForecastRows, setAllocationForecastRows] = useState<Array<Record<string, unknown>>>([]);
  const allocationRecordsRef = useRef<HTMLDivElement>(null);
  const projectCrudFormRef = useRef<HTMLDivElement>(null);
  const allocationFormRef = useRef<HTMLDivElement>(null);
  const [allocationRoles, setAllocationRoles] = useState<string[]>([]);
  const [allocationUsers, setAllocationUsers] = useState<
    Array<{ name: string; email: string; role?: string }>
  >([]);
  const [allocationProjects, setAllocationProjects] = useState<
    Array<{ code: string; name: string; project_type?: string }>
  >([]);
  const [allocationEmployeePickerOpen, setAllocationEmployeePickerOpen] = useState(false);
  const [allocationEmployeePickerQuery, setAllocationEmployeePickerQuery] = useState("");
  const allocationEmployeeComboboxRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<Array<Record<string, unknown>>>([]);
  const [assignedProjects, setAssignedProjects] = useState<Array<Record<string, unknown>>>([]);
  const [profileAssignedProjects, setProfileAssignedProjects] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [profileAssignedProjectsLoading, setProfileAssignedProjectsLoading] = useState(false);
  const [timelogs, setTimelogs] = useState<Array<Record<string, unknown>>>([]);
  const [managerEmailsForHr, setManagerEmailsForHr] = useState<string[]>([]);
  const [timelogProjects, setTimelogProjects] = useState<Array<{ code: string; name: string }>>([]);
  const [hrTimelogDirectoryEmails, setHrTimelogDirectoryEmails] = useState<string[]>([]);
  const [timelogForm, setTimelogForm] = useState({
    project_code: "",
    log_date: "",
    hours: "1",
    description: "",
    /** HR/Admin: optional — submit timelog for this employee when the API accepts it */
    subject_employee_email: "",
  });
  const [teamRequestsLoading, setTeamRequestsLoading] = useState(false);
  const [employeeRequests, setEmployeeRequests] = useState<Array<Record<string, unknown>>>([]);
  const [teamTotalPages, setTeamTotalPages] = useState(0);
  const [teamTotalElements, setTeamTotalElements] = useState(0);
  const teamCacheRef = useRef<Map<string, {
    rows: Array<Record<string, unknown>>;
    totalPages: number;
    totalElements: number;
  }>>(new Map());
  const teamDecisionsRef = useRef<
    Map<string, { status: UserRequestStatusValue; reason?: string }>
  >(new Map());
  const [kpis, setKpis] = useState<Array<Record<string, unknown>>>([]);
  const [headcountBreakdown, setHeadcountBreakdown] = useState<Array<Record<string, unknown>>>([]);
  const [roleBillingRows, setRoleBillingRows] = useState<Array<Record<string, unknown>>>([]);
  const [experienceBandRows, setExperienceBandRows] = useState<Array<Record<string, unknown>>>([]);
  const [utilizationByDepartmentRows, setUtilizationByDepartmentRows] = useState<Array<Record<string, unknown>>>([]);
  const [benchAgingRows, setBenchAgingRows] = useState<Array<Record<string, unknown>>>([]);
  const [offboardingUsers, setOffboardingUsers] = useState<Array<{ emp_id: string; name: string; email: string }>>([]);
  const [bgvUsers, setBgvUsers] = useState<
    Array<{ emp_id: string; name: string; email: string; role: string; level: string }>
  >([]);
  const [bgvRecords, setBgvRecords] = useState<Array<Record<string, unknown>>>([]);
  const [bgvDashboardRows, setBgvDashboardRows] = useState<Array<Record<string, unknown>>>([]);
  const [offboardingForm, setOffboardingForm] = useState({
    emp_id: "",
    resignation_date: "",
    last_working_day: "",
    separation_type: "VOLUNTARY" as "VOLUNTARY" | "INVOLUNTARY",
    reason: "",
    critical_skill: "",
    is_regretted: false,
  });
  const [bgvForm, setBgvForm] = useState({
    emp_id: "",
    name: "",
    role: "",
    level: "",
    consent_form_signed: "NO",
    identity: "",
    employment: "N/A",
    reference: "N/A",
    mail_id: "",
    onboarding_form: "PENDING",
    overall_status: "IN_PROGRESS",
    remarks: "",
  });
  const [attritionFyStartYear, setAttritionFyStartYear] = useState<string>(() => {
    const now = new Date();
    const year = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
    return String(year);
  });
  const [attritionOverallRows, setAttritionOverallRows] = useState<Array<Record<string, unknown>>>([]);
  const [attritionVoluntaryRows, setAttritionVoluntaryRows] = useState<Array<Record<string, unknown>>>([]);
  const [attritionRoleWiseRows, setAttritionRoleWiseRows] = useState<Array<Record<string, unknown>>>([]);
  const [attritionManagerWiseRows, setAttritionManagerWiseRows] = useState<Array<Record<string, unknown>>>([]);
  const [attritionCriticalSkillRows, setAttritionCriticalSkillRows] = useState<Array<Record<string, unknown>>>([]);
  const [attritionRegrettedRows, setAttritionRegrettedRows] = useState<Array<Record<string, unknown>>>([]);
  const [attritionAverageTenureBuckets, setAttritionAverageTenureBuckets] = useState<Array<Record<string, unknown>>>([]);
  const [attritionAverageTenureSummaryRows, setAttritionAverageTenureSummaryRows] = useState<Array<Record<string, unknown>>>([]);
  const [attritionUpsertResultRows, setAttritionUpsertResultRows] = useState<Array<Record<string, unknown>>>([]);
  const [skillInventoryRows, setSkillInventoryRows] = useState<Array<Record<string, unknown>>>([]);
  const [contractDistributionRows, setContractDistributionRows] = useState<Array<Record<string, unknown>>>([]);
  const [bgvReportSearch, setBgvReportSearch] = useState("");
  const [bgvReportStatusFilter, setBgvReportStatusFilter] = useState("ALL");
  const [bgvReportEmploymentFilter, setBgvReportEmploymentFilter] = useState("ALL");
  const [bgvReportReferenceFilter, setBgvReportReferenceFilter] = useState("ALL");
  const [attritionForm, setAttritionForm] = useState({
    emp_id: "",
    separation_type: "VOLUNTARY" as "VOLUNTARY" | "INVOLUNTARY",
    reason: "",
    critical_skill: "",
    is_regretted: false,
    last_working_day: "",
  });
  const [utilizationFilters, setUtilizationFilters] = useState({
    page: "0",
    size: "10",
    search: "",
    as_of: "",
  });
  const [roleAssignForm, setRoleAssignForm] = useState({
    target_email: "",
    role: "ROLE_HR",
  });
  const [roleAssignUsers, setRoleAssignUsers] = useState<Array<{ name: string; email: string }>>([]);

  const [leaveRequestForm, setLeaveRequestForm] = useState(createDefaultLeaveRequestForm);
  const [selectedLeaveManagerEmails, setSelectedLeaveManagerEmails] = useState<string[]>([]);
  const [selectedWfhManagerEmails, setSelectedWfhManagerEmails] = useState<string[]>([]);
  const [selectedAdditionalRecipientEmails, setSelectedAdditionalRecipientEmails] = useState<string[]>([]);
  const [editingLeaveRequestId, setEditingLeaveRequestId] = useState<string>("");
  const [requestViewTab, setRequestViewTab] = useState<"request" | "view">("request");
  const [wfhRequestViewTab, setWfhRequestViewTab] = useState<"request" | "view">("request");
  const [wfhExceptionOpen, setWfhExceptionOpen] = useState(false);
  const [employeeRequestFilters, setEmployeeRequestFilters] = useState({
    fromDate: "",
    toDate: "",
    requestType: "ALL",
  });
  const [myLeaveSortId, setMyLeaveSortId] = useState(LEAVE_REQUEST_SORT_OPTIONS[0].id);
  const [teamLeaveSortId, setTeamLeaveSortId] = useState(LEAVE_REQUEST_SORT_OPTIONS[0].id);
  const [myLeaveSearch, setMyLeaveSearch] = useState("");
  const [teamLeaveSearch, setTeamLeaveSearch] = useState("");
  const [compOffCreditsOpen, setCompOffCreditsOpen] = useState(false);
  const [pendingReject, setPendingReject] = useState<{
    requestId: string;
    requestType: unknown;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [teamStatusUpdatingId, setTeamStatusUpdatingId] = useState<string | null>(null);

  // Notification deep-link: open the matching leave request regardless of prior date filters.
  useEffect(() => {
    if (!deepLinkRequestId && !deepLinkFrom && !deepLinkTo) return;
    const key = `${deepLinkRequestId}|${deepLinkFrom}|${deepLinkTo}|${tabFromQuery}|${pathname}`;
    if (deepLinkAppliedKeyRef.current === key) return;
    deepLinkAppliedKeyRef.current = key;

    if (
      tabFromQuery === "team" ||
      tabFromQuery === "org" ||
      tabFromQuery === "my" ||
      tabFromQuery === "wfh" ||
      isTeamLeaveRoute
    ) {
      if (tabFromQuery === "wfh") setLeaveSubTab("wfh");
      else if (tabFromQuery === "my") setLeaveSubTab("my");
      else if (tabFromQuery === "org") setLeaveSubTab("org");
      else setLeaveSubTab(isTeamLeaveRoute || tabFromQuery === "team" ? "team" : "my");
    }

    if (deepLinkFrom && deepLinkTo) {
      setEmployeeRequestFilters((prev) => ({
        ...prev,
        fromDate: deepLinkFrom,
        toDate: deepLinkTo,
      }));
      setMyRequestsFromDate(deepLinkFrom);
      setMyRequestsToDate(deepLinkTo);
    } else {
      // Empty UI filters → wide unfiltered API range (see unfilteredLeaveRequestRange).
      setEmployeeRequestFilters((prev) => ({
        ...prev,
        fromDate: "",
        toDate: "",
      }));
      setMyRequestsFromDate("");
      setMyRequestsToDate("");
    }

    setTeamLeaveSearch("");
    setMyLeaveSearch("");
    if (deepLinkRequestId) {
      setHighlightRequestId(deepLinkRequestId);
    }
  }, [
    deepLinkFrom,
    deepLinkRequestId,
    deepLinkTo,
    isTeamLeaveRoute,
    pathname,
    tabFromQuery,
  ]);

  const [onboardForm, setOnboardForm] = useState({
    emp_id: "",
    email: "",
    name: "",
    user_type: "FULLTIME",
    department: "",
    phone_number: "",
    work_mode: "WFO",
    work_location_type: "OFFSHORE",
    role: "",
    band_id: 1,
    delivery_status: "DELIVERABLE",
    doj: "",
    doi: "",
    internship_duration: "",
  });

  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({
    leave: null,
    allocation: null,
    userData: null,
    batch: null,
  });
  const [onboardBands, setOnboardBands] = useState<Array<Record<string, unknown>>>([]);
  const [onboardDepartments, setOnboardDepartments] = useState<string[]>([]);
  const [bandDeptRoleMap, setBandDeptRoleMap] = useState<Record<string, string[]>>({});
  const [selfOnboardForm, setSelfOnboardForm] = useState({
    full_name: "",
    phone_number: "",
    yoe: "",
    primary_skills: "",
    secondary_skill: "",
    secondary_rating: "3",
    work_location_type: "OFFSHORE",
  });
  const [selfOnboardFiles, setSelfOnboardFiles] = useState<{
    resume: File | null;
    profile_photo: File | null;
    aadhaar: File | null;
    pan_card: File | null;
    reliving_letter: File | null;
    salary_slips: File | null;
  }>({
    resume: null,
    profile_photo: null,
    aadhaar: null,
    pan_card: null,
    reliving_letter: null,
    salary_slips: null,
  });
  const [selfProfileForm, setSelfProfileForm] = useState({
    phone_number: "",
    primary_skills: "",
    secondary_skill: "",
    secondary_rating: "3",
    yoe: "",
  });
  const [selfProfileEmploymentFiles, setSelfProfileEmploymentFiles] = useState<{
    reliving_letter: File | null;
    salary_slips: File | null;
  }>({
    reliving_letter: null,
    salary_slips: null,
  });
  const [selfProfilePic, setSelfProfilePic] = useState<File | null>(null);
  const [isEditingOwnProfile, setIsEditingOwnProfile] = useState(false);
  const priorEmploymentDocsForProfile = useMemo(() => {
    const raw = String(selfProfileForm.yoe ?? "").trim().replace(",", ".");
    if (!raw) return false;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) && n > 0;
  }, [selfProfileForm.yoe]);
  const [projectForm, setProjectForm] = useState({
    project_name: "",
    project_type: "IN_HOUSE" as "IN_HOUSE" | "STAFFING" | "PRODUCT",
    client_name: "",
    account_manager_email: "",
  });
  const [editingProjectCode, setEditingProjectCode] = useState<string>("");
  const [projectFilters, setProjectFilters] = useState({
    search: "",
    project_type: "ALL",
  });
  const [managerProjects, setManagerProjects] = useState<Array<Record<string, unknown>>>([]);
  const [managerPortfolioRows, setManagerPortfolioRows] = useState<Array<Record<string, unknown>>>([]);
  const [selectedManagerProjectCode, setSelectedManagerProjectCode] = useState("");
  const [teamTimelogEmailFilter, setTeamTimelogEmailFilter] = useState("ALL");
  const managerDataLoadedRef = useRef(false);
  const managerDataLoadingRef = useRef(false);
  const timelogLoadInFlightRef = useRef(false);
  const [managerProjectAllocations, setManagerProjectAllocations] = useState<Array<Record<string, unknown>>>([]);
  const managerAllocationsCacheRef = useRef<Record<string, Array<Record<string, unknown>>>>({});
  const [allocationForm, setAllocationForm] = useState({
    allocation_id: "",
    employee_email: "",
    project_code: "",
    role: "",
    allocated_hours: "8",
    start_date: "",
    end_date: "",
    allocation_type: "DEPLOYABLE",
    billing_status: "BILLED" as "BILLED" | "BUFFER" | "INVESTMENT",
    is_manager: false,
  });
  const [editingAllocationId, setEditingAllocationId] = useState<string>("");
  const [allocationHrSubTab, setAllocationHrSubTab] = useState<"project" | "allocate" | "list">(
    "project"
  );
  const [timelogSubTab, setTimelogSubTab] = useState<"my" | "team">("my");
  const userRoles = user?.roles ?? [];
  const hasHrAccess = userRoles.includes("ROLE_HR") || userRoles.includes("ROLE_ADMIN");
  const hasAdminAccess = userRoles.includes("ROLE_ADMIN");
  const hasManagerAccess = userRoles.includes("ROLE_MANAGER");
  const hasDmAccess = hasDmRole(userRoles);

  const [hasPrimaryLeaveInbox, setHasPrimaryLeaveInbox] = useState(false);

  useEffect(() => {
    if (hasManagerAccess || hasHrAccess || hasDmAccess || !userEmail) {
      setHasPrimaryLeaveInbox(false);
      return;
    }
    let cancelled = false;
    const selfEmail = userEmail.trim().toLowerCase();
    void (async () => {
      try {
        const now = new Date();
        const from = formatApiDate(new Date(now.getFullYear() - 1, 0, 1));
        const to = formatApiDate(new Date(now.getFullYear() + 1, 11, 31));
        const rows = await listScopedUserRequests({
          fromDate: from,
          toDate: to,
          requestType: "LEAVE",
          size: 5,
        });
        // Without manager role, /userRequest may fall back to the actor's own leave —
        // only treat other employees' leave as a primary-manager inbox.
        const inboxRows = rows.filter((row) => {
          const email = requestRowEmail(row).trim().toLowerCase();
          return Boolean(email) && email !== selfEmail;
        });
        if (!cancelled) setHasPrimaryLeaveInbox(inboxRows.length > 0);
      } catch {
        if (!cancelled) setHasPrimaryLeaveInbox(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail, hasManagerAccess, hasHrAccess, hasDmAccess]);

  const canViewTeamLeave = hasManagerAccess || hasHrAccess || hasDmAccess || hasPrimaryLeaveInbox;
  const firstLineStatusColumnLabel = hasHrAccess
    ? "Manager/DM status"
    : hasDmAccess && !hasManagerAccess
      ? "DM status"
      : "Manager status";
  const submitsToHrForReview = isAccountManagerEmployeeUser(userRoles);
  const { data: accountManagerEmails = new Set<string>() } = useAccountManagerEmails(
    teamLeaveTabActive
  );
  /** HR without manager portfolio — no allocated projects; use Team timelogs for org view */
  const timelogHrNoSelfProject =
    userRoles.includes("ROLE_HR") && !hasManagerAccess;
  const canExportTimelog = hasHrAccess || hasManagerAccess;
  const isEmployee = userRoles.includes("ROLE_EMPLOYEE");
  const { requiresSelfOnboarding } = useDashboardAccess();
  /** Self-service profile + onboarding (non-HR employees only) */
  const employeeSelfServeProfile = isEmployee || hasHrAccess;
  const canApplyCompOff = !hasHrAccess && !hasManagerAccess;
  const teamRequestType = employeeRequestFilters.requestType || "ALL";
  /** Personal leave page only — team leave keeps Approvals without the Comp Off Credit tab. */
  const showCompOffTab =
    !isTeamLeaveRoute &&
    (canApplyCompOff || hasManagerAccess || hasHrAccess || hasDmAccess);
  const showLeaveSubTabBar = showCompOffTab || hasHrAccess || !isTeamLeaveRoute;

  const leaveRequestTypeOptions = useMemo(() => {
    const base = USER_REQUEST_TYPE_SELECT_OPTIONS.filter((opt) => opt.value !== "WFH");
    if (!canApplyCompOff) return base;
    return [...base, { value: "COMP_OFF" as const, label: "Comp off" }];
  }, [canApplyCompOff]);

  const myAllocationRowsForLeave = useMemo(
    () => profileAssignedProjects,
    [profileAssignedProjects]
  );

  const requiresClientApproval = useMemo(
    () => activeAllocationsRequireClientApproval(myAllocationRowsForLeave),
    [myAllocationRowsForLeave]
  );

  const routesLeaveWfhToHr = useMemo(
    () =>
      !profileAssignedProjectsLoading &&
      isTalentPoolLeaveRouting(myAllocationRowsForLeave),
    [myAllocationRowsForLeave, profileAssignedProjectsLoading]
  );

  useEffect(() => {
    if (leaveSubTab === "wfh") {
      setLeaveRequestForm((prev) =>
        prev.request_type === "WFH" ? prev : { ...prev, request_type: "WFH" }
      );
    } else if (leaveSubTab === "my") {
      setLeaveRequestForm((prev) => {
        const type = normalizeUserRequestType(prev.request_type);
        if (type === "LEAVE" || type === "OPTIONAL" || type === "COMP_OFF") {
          return prev;
        }
        return { ...prev, request_type: "LEAVE" };
      });
    }
  }, [leaveSubTab]);
  const canAccessProfile = Boolean(user);
  useEffect(() => {
    if (!hasManagerAccess && !hasHrAccess && timelogSubTab === "team") {
      setTimelogSubTab("my");
    }
  }, [hasManagerAccess, hasHrAccess, timelogSubTab]);
  useEffect(() => {
    if ((leaveSubTab === "org" || leaveSubTab === "balances") && !hasHrAccess) {
      setLeaveSubTab("team");
    }
  }, [leaveSubTab, hasHrAccess]);

  useEffect(() => {
    if (!canViewTeamLeave && (leaveSubTab === "team" || leaveSubTab === "org")) {
      setLeaveSubTab("my");
    }
  }, [canViewTeamLeave, leaveSubTab]);

  const loadManagerData = useCallback(
    async (force = false) => {
      if (!hasManagerAccess) return { projectRows: [] as Array<Record<string, unknown>>, detailRows: [] as Array<Record<string, unknown>> };
      if (!force && managerDataLoadedRef.current) {
        return { projectRows: managerProjects, detailRows: managerPortfolioRows };
      }
      if (managerDataLoadingRef.current) {
        return { projectRows: managerProjects, detailRows: managerPortfolioRows };
      }
      managerDataLoadingRef.current = true;
      try {
        const [projectRes, detailRes] = await Promise.all([
          hrmsService.getManagerProjects(),
          hrmsService.getManagerProjectsWithRoles(),
        ]);
        const projectRows = toPagedRows(projectRes.data ?? projectRes);
        const detailRows = toPagedRows(detailRes.data ?? detailRes);
        // Fallback: if projects endpoint is empty but team-details has project info,
        // derive visible project list from detail rows.
        const effectiveProjectRows = projectRows.length ? projectRows : detailRows;
        setManagerProjects(effectiveProjectRows);
        setManagerPortfolioRows(detailRows);
        managerDataLoadedRef.current = true;
        const fallbackProjectCode = managerProjectCode(effectiveProjectRows[0] ?? detailRows[0] ?? {});
        setSelectedManagerProjectCode((prev) => prev || fallbackProjectCode);
        return { projectRows: effectiveProjectRows, detailRows };
      } finally {
        managerDataLoadingRef.current = false;
      }
    },
    [hasManagerAccess, managerProjects, managerPortfolioRows]
  );

  useEffect(() => {
    if (!canAccessProfile || requiresSelfOnboarding) return;
    if (leaveSubTab !== "my" && leaveSubTab !== "wfh") return;
    const id = window.setTimeout(() => {
      void (async () => {
        setProfileAssignedProjectsLoading(true);
        try {
          const [assignedRes, myAllocationsRes] = await Promise.all([
            hrmsService.getAssignedProjects(),
            hrmsService.getMyAllocations(),
          ]);
          const normalizedProjects = normalizeAssignedProjects(
            toPagedRows(assignedRes.data ?? assignedRes)
          );
          const myAllocations = toPagedRows(myAllocationsRes.data ?? myAllocationsRes);
          setProfileAssignedProjects(
            mergeProjectAndAllocationData(normalizedProjects, myAllocations)
          );
        } catch {
          setProfileAssignedProjects([]);
        } finally {
          setProfileAssignedProjectsLoading(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(id);
  }, [canAccessProfile, requiresSelfOnboarding, leaveSubTab]);

  async function runAction(label: string, fn: () => Promise<unknown>) {
    setActionLoading(true);
    try {
      await fn();
      showSuccessToast(formatActionSuccessMessage(label));
    } catch (error) {
      const backendMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "";
      showErrorToast(formatActionErrorMessage(label, backendMessage));
    } finally {
      setActionLoading(false);
    }
  }

  function buildUserIdToNameMap(users: Array<Record<string, unknown>>) {
    const map: Record<string, string> = {};
    for (const u of users) {
      const name = String(u.name ?? "").trim();
      if (!name) continue;
      for (const key of ["id", "user_id", "userId", "userID", "emp_id"] as const) {
        const v = u[key];
        if (v != null && v !== "") map[String(v)] = name;
      }
    }
    return map;
  }

  function buildEmailToNameMap(users: Array<Record<string, unknown>>) {
    const map: Record<string, string> = {};
    for (const u of users) {
      const email = String(u.email ?? "").trim().toLowerCase();
      const name = String(u.name ?? "").trim();
      if (email && name) map[email] = name;
    }
    return map;
  }

  const scopeEmployeesRef = useRef<{
    idToName: Record<string, string>;
    emailToName: Record<string, string>;
    userIdToEmail: Record<string, string>;
    emailCsv: string;
  }>({ idToName: {}, emailToName: {}, userIdToEmail: {}, emailCsv: "" });

  const loadScopeEmployees = useCallback(async (scope: "team" | "org") => {
    let onboardRows: Array<Record<string, unknown>> = [];
    let scopedManagerRows: Array<Record<string, unknown>> = [];
    if (scope === "team" && hasHrAccess) {
      const onboardRes = await hrmsService.getOnboardList({ page: "0", size: "200" });
      onboardRows = toPagedRows(onboardRes.data ?? onboardRes);
    } else if (scope === "team" && hasManagerAccess) {
      if (managerPortfolioRows.length) {
        scopedManagerRows = managerPortfolioRows;
      } else {
        const loaded = await loadManagerData();
        scopedManagerRows = loaded.detailRows;
      }
    }
    const scopeRows = scope === "team" && hasHrAccess ? onboardRows : scopedManagerRows;
    const expandedScopeRows = scopeRows.flatMap((row) => {
      const nestedEmployees = Array.isArray(row.employees)
        ? (row.employees as Array<Record<string, unknown>>)
        : [];
      if (!nestedEmployees.length) return [row];
      return nestedEmployees.map((emp) => ({
        ...row,
        email: emp.email ?? emp.user_email ?? emp.userEmail ?? row.email,
        user_email: emp.email ?? emp.user_email ?? emp.userEmail ?? row.user_email,
        name: emp.name ?? emp.employee_name ?? emp.employeeName ?? row.name,
        employee_name: emp.name ?? emp.employee_name ?? emp.employeeName ?? row.employee_name,
        user_id: emp.user_id ?? emp.userId ?? emp.emp_id ?? row.user_id,
        emp_id: emp.emp_id ?? emp.user_id ?? row.emp_id,
      }));
    });
    const idToName = buildUserIdToNameMap(expandedScopeRows);
    const emailToName = buildEmailToNameMap(expandedScopeRows);
    const userIdToEmail: Record<string, string> = {};
    for (const row of expandedScopeRows) {
      const uid = String(row.user_id ?? row.userId ?? row.userID ?? row.id ?? row.emp_id ?? "").trim();
      const email = String(
        row.email ?? row.user_email ?? row.userEmail ?? row.employee_email ?? row.employeeEmail ?? ""
      )
        .trim()
        .toLowerCase();
      if (uid && email) userIdToEmail[uid] = email;
    }
    const emailCsv = expandedScopeRows
      .map((r) =>
        String(
          r.email ?? r.user_email ?? r.userEmail ?? r.employee_email ?? r.employeeEmail ?? ""
        ).trim()
      )
      .filter(Boolean)
      .join(",");
    scopeEmployeesRef.current = { idToName, emailToName, userIdToEmail, emailCsv };
  }, [hasHrAccess, hasManagerAccess, managerPortfolioRows, loadManagerData]);

  const loadEmployeeRequestsForApprover = useCallback(
    async (scope: "team" | "org" = "team", page: number = 0, size: number = 10, skipScopeLoad = false) => {
    const selectedFrom = employeeRequestFilters.fromDate.trim();
    const selectedTo = employeeRequestFilters.toDate.trim();
    const fallbackRange = unfilteredLeaveRequestRange();
    const hasDateFilter = Boolean(selectedFrom && selectedTo);
    const from = hasDateFilter ? selectedFrom : fallbackRange.fromDate;
    const to = hasDateFilter ? selectedTo : fallbackRange.toDate;
    const requestType = employeeRequestFilters.requestType || "ALL";
    const isCompOffEarnFilter =
      normalizeCompOffRequestType(requestType) === "COMP_OFF_EARN";

    if (!skipScopeLoad) {
      await loadScopeEmployees(scope);
    }
    const { idToName, emailToName, userIdToEmail, emailCsv } = scopeEmployeesRef.current;

    let rows: Array<Record<string, unknown>> = [];
    let totalPages = 1;
    let totalElements = 0;

    // Earn requests are not listed on /userRequest (API returns 400). Use /comp-off/earn.
    if (isCompOffEarnFilter) {
      const managerOnly =
        !hasHrAccess && (hasManagerAccess || hasDmAccess || hasPrimaryLeaveInbox);
      try {
        const earnRes = await compOffService.listEarnRequests({
          fromDate: from,
          toDate: to,
          page: 0,
          size: Math.max(size, 200),
          managerOnly: scope === "team" ? managerOnly : false,
        });
        rows = compOffService.parseRequestRows(earnRes).map(mapEarnListRow);
      } catch {
        rows = [];
      }
      rows = applyListSort(rows, "created_desc", LEAVE_REQUEST_SORT_OPTIONS);
      totalElements = rows.length;
      totalPages = Math.max(1, Math.ceil(totalElements / Math.max(size, 1)) || 1);
    } else if (scope === "team") {
      const normalizedType = String(requestType || "ALL").trim().toUpperCase();
      const wantsManagerInbox =
        normalizedType === "ALL" ||
        normalizedType === "LEAVE" ||
        normalizedType === "WFH";
      const managerInboxTypes =
        normalizedType === "ALL"
          ? (["LEAVE", "WFH"] as const)
          : normalizedType === "LEAVE" || normalizedType === "WFH"
            ? ([normalizedType] as const)
            : ([] as const);
      const canLoadManagerInbox =
        hasManagerAccess || hasDmAccess || hasHrAccess || hasPrimaryLeaveInbox;

      const portfolioPromise = emailCsv
        ? fetchPaginatedScopedUserRequests({
            fromDate: from,
            toDate: to,
            requestType,
            empEmails: emailCsv,
            page: wantsManagerInbox && canLoadManagerInbox ? 0 : page,
            size: wantsManagerInbox && canLoadManagerInbox ? 200 : size,
          })
        : Promise.resolve({
            rows: [] as Array<Record<string, unknown>>,
            totalPages: 0,
            totalElements: 0,
          });

      // Primary-manager leave/WFH inbox (no empEmails) — selected managers see routed requests under Team Requests.
      const managerInboxPromise =
        wantsManagerInbox && canLoadManagerInbox && managerInboxTypes.length
          ? Promise.all(
              managerInboxTypes.map((type) =>
                fetchPaginatedScopedUserRequests({
                  fromDate: from,
                  toDate: to,
                  requestType: type,
                  page: 0,
                  size: 200,
                })
              )
            ).then((results) => ({
              rows: results.flatMap((result) => result.rows),
              totalPages: 1,
              totalElements: results.reduce((sum, result) => sum + result.totalElements, 0),
            }))
          : Promise.resolve({
              rows: [] as Array<Record<string, unknown>>,
              totalPages: 0,
              totalElements: 0,
            });

      // Bench / HR-department leave & WFH for HR Team Requests.
      const hrTeamScopePromise =
        wantsManagerInbox && hasHrAccess && managerInboxTypes.length
          ? Promise.all(
              managerInboxTypes.map((type) =>
                fetchPaginatedScopedUserRequests({
                  fromDate: from,
                  toDate: to,
                  requestType: type,
                  page: 0,
                  size: 200,
                  hrTeamScope: true,
                })
              )
            ).then((results) => ({
              rows: results.flatMap((result) => result.rows),
              totalPages: 1,
              totalElements: results.reduce((sum, result) => sum + result.totalElements, 0),
            }))
          : Promise.resolve({
              rows: [] as Array<Record<string, unknown>>,
              totalPages: 0,
              totalElements: 0,
            });

      const [portfolioRes, leaveInboxRes, hrTeamRes] = await Promise.all([
        portfolioPromise,
        managerInboxPromise,
        hrTeamScopePromise,
      ]);
      if (wantsManagerInbox && (canLoadManagerInbox || hasHrAccess)) {
        const merged = [...portfolioRes.rows, ...leaveInboxRes.rows, ...hrTeamRes.rows];
        rows = Array.from(
          new Map(
            merged.map((row) => {
              const key = String(
                row.user_request_id ??
                  row.userRequestId ??
                  row.request_id ??
                  row.requestId ??
                  row.id ??
                  Math.random()
              );
              return [key, row] as const;
            })
          ).values()
        );
        // Non-primary managers must not see leave/WFH in Team Requests (HR keeps full list).
        rows = filterTeamRequestsForPrimaryManager(rows, {
          actorEmail: userEmail,
          hasHrAccess,
        });
        // Newest submissions first for Team Requests.
        rows = applyListSort(rows, "created_desc", LEAVE_REQUEST_SORT_OPTIONS);
        totalElements = rows.length;
        totalPages = Math.max(1, Math.ceil(totalElements / Math.max(size, 1)) || 1);
      } else {
        rows = filterTeamRequestsForPrimaryManager(
          applyListSort(portfolioRes.rows, "created_desc", LEAVE_REQUEST_SORT_OPTIONS),
          { actorEmail: userEmail, hasHrAccess }
        );
        totalElements = rows.length;
        totalPages = Math.max(1, Math.ceil(totalElements / Math.max(size, 1)) || 1);
      }

      // Comp-off earn is not on /userRequest — merge from /comp-off/earn when viewing All types.
      if (normalizedType === "ALL" && (hasManagerAccess || hasHrAccess || hasDmAccess || hasPrimaryLeaveInbox)) {
        try {
          const managerOnly =
            !hasHrAccess && (hasManagerAccess || hasDmAccess || hasPrimaryLeaveInbox);
          const earnRes = await compOffService.listEarnRequests({
            fromDate: from,
            toDate: to,
            page: 0,
            size: Math.max(size, 200),
            managerOnly,
          });
          const earnRows = compOffService.parseRequestRows(earnRes).map(mapEarnListRow);
          if (earnRows.length) {
            const merged = [...rows, ...earnRows];
            rows = Array.from(
              new Map(
                merged.map((row) => {
                  const key = String(
                    row.user_request_id ??
                      row.userRequestId ??
                      row.request_id ??
                      row.requestId ??
                      row.id ??
                      Math.random()
                  );
                  return [key, row] as const;
                })
              ).values()
            );
            rows = applyListSort(rows, "created_desc", LEAVE_REQUEST_SORT_OPTIONS);
            totalElements = rows.length;
            totalPages = Math.max(1, Math.ceil(totalElements / Math.max(size, 1)) || 1);
          }
        } catch {
          /* keep leave/WFH rows */
        }
      }
    } else if (hasHrAccess) {
      // Load a full window for client-side pagination (same as team merge path).
      const result = await fetchPaginatedScopedUserRequests({
        fromDate: from,
        toDate: to,
        requestType,
        page: 0,
        size: Math.max(size, 200),
      });
      rows = applyListSort(result.rows, "created_desc", LEAVE_REQUEST_SORT_OPTIONS);
      totalElements = rows.length;
      totalPages = Math.max(1, Math.ceil(totalElements / Math.max(size, 1)) || 1);
    }

    const unresolvedEmails = [
      ...new Set(
        rows
          .map((row) =>
            String(
              row.emp_email ??
                row.empEmail ??
                row.email ??
                row.user_email ??
                row.userEmail ??
                row.employee_email ??
                row.employeeEmail ??
                ""
            )
              .trim()
              .toLowerCase()
          )
          .filter((email) => Boolean(email) && !emailToName[email])
      ),
    ];
    const nameMap = { ...emailToName };
    await Promise.all(
      unresolvedEmails.map(async (email) => {
        try {
          const userRes = await hrmsService.getUser({ email });
          const payload = ((userRes as { data?: unknown }).data ?? userRes) as
            | Record<string, unknown>
            | null;
          if (!payload || typeof payload !== "object") return;
          const nested =
            (payload.user as Record<string, unknown> | undefined)?.name ??
            (payload.profile as Record<string, unknown> | undefined)?.name;
          const name = String(payload.name ?? nested ?? "").trim();
          if (name) nameMap[email] = name;
        } catch {
          /* ignore lookup misses */
        }
      })
    );
    const enriched = rows.map((row) => {
      const email = String(
        row.email ??
          row.user_email ??
          row.userEmail ??
          row.emp_email ??
          row.empEmail ??
          row.employee_email ??
          row.employeeEmail ??
          row.requested_by ??
          row.requestedBy ??
          ""
      )
        .trim()
        .toLowerCase();
      const uid = String(row.user_id ?? row.userId ?? row.emp_id ?? row.empId ?? "").trim();
      const nameFromRow = String(
        row.name ??
          row.employee_name ??
          row.employeeName ??
          row.user_name ??
          row.userName ??
          row.emp_name ??
          row.empName ??
          row.requested_by_name ??
          row.requestedByName ??
          ""
      ).trim();
      const emailFromUid = uid ? userIdToEmail[uid] ?? "" : "";
      const employee_display =
        nameFromRow ||
        (email && nameMap[email]) ||
        (emailFromUid && nameMap[emailFromUid]) ||
        (uid && idToName[uid]) ||
        email ||
        emailFromUid ||
        (uid ? `User #${uid}` : "—");
      return { ...row, employee_display };
    });
    const withDecisions = applyLeaveTeamRequestDecisions(
      enriched,
      teamDecisionsRef.current,
      userEmail
    );
    setEmployeeRequests(withDecisions);
    setTeamTotalPages(totalPages);
    setTeamTotalElements(totalElements);
    const cacheKey = `${scope}:${employeeRequestFilters.fromDate}:${employeeRequestFilters.toDate}:${employeeRequestFilters.requestType}:0:200`;
    teamCacheRef.current.set(cacheKey, {
      rows: withDecisions,
      totalPages,
      totalElements,
    });
  },
    [employeeRequestFilters, hasHrAccess, hasManagerAccess, hasDmAccess, hasPrimaryLeaveInbox, loadScopeEmployees, userEmail]
  );

  /** All Employee Requests (HR org view) is read-only — no Actions column. */
  const showTeamActionsColumn = leaveSubTab !== "org";
  const teamTableColCount = showTeamActionsColumn ? 5 : 4;

  const fetchTeamRequests = useCallback(
    async (scope: "team" | "org", page: number = 0, size: number = 200) => {
      setTeamRequestsLoading(true);
      try {
        const cacheKey = `${scope}:${employeeRequestFilters.fromDate}:${employeeRequestFilters.toDate}:${employeeRequestFilters.requestType}:0:200`;
        const cached = teamCacheRef.current.get(cacheKey);
        if (cached) {
          const withDecisions = applyLeaveTeamRequestDecisions(
            cached.rows,
            teamDecisionsRef.current,
            userEmail
          );
          setEmployeeRequests(withDecisions);
          setTeamTotalPages(cached.totalPages);
          setTeamTotalElements(cached.totalElements);
          return;
        }
        await loadEmployeeRequestsForApprover(scope, page, size);
      } catch {
        setEmployeeRequests([]);
      } finally {
        setTeamRequestsLoading(false);
      }
    },
    [employeeRequestFilters, loadEmployeeRequestsForApprover, userEmail]
  );

  const invalidateTeamCache = useCallback(() => {
    teamCacheRef.current.clear();
  }, []);

  function applyLocalTeamRequestStatus(
    requestId: string,
    status: UserRequestStatusValue,
    reason?: string
  ) {
    teamDecisionsRef.current.set(requestId, { status, reason });
    setEmployeeRequests((prev) =>
      applyLeaveTeamRequestDecisions(
        prev.map((row) => {
          const rowId = String(
            row.user_request_id ??
              row.userRequestId ??
              row.request_id ??
              row.requestId ??
              row.id ??
              ""
          ).trim();
          return rowId === requestId
            ? patchLeaveTeamRequestStatus(row, status, { reason, actorEmail: userEmail })
            : row;
        }),
        teamDecisionsRef.current,
        userEmail
      )
    );
  }

  async function updateEmployeeRequestStatus(
    requestId: string,
    status: UserRequestStatusValue,
    options?: { reason?: string; requireReasonOnReject?: boolean; requestType?: unknown }
  ) {
    const isEarn = isCompOffEarnRequestType(options?.requestType);
    if (isEarn) {
      await compOffService.updateEarnRequestStatus(
        Number(requestId),
        status === "REJECTED" ? "REJECTED" : "APPROVED",
        options?.reason
      );
      const reason = options?.reason?.trim();
      applyLocalTeamRequestStatus(requestId, status, reason);
      setEmployeeRequests((prev) =>
        prev.map((row) => {
          const rowId = String(
            row.user_request_id ??
              row.userRequestId ??
              row.request_id ??
              row.requestId ??
              row.id ??
              ""
          ).trim();
          if (rowId !== requestId) return row;
          return patchLeaveTeamRequestStatus(row, status, { reason, actorEmail: userEmail });
        })
      );
      return;
    }

    const res = await updateUserRequestStatus(Number(requestId), status, options);
    const updated = extractStatusUpdateData(res);
    const reason = options?.reason?.trim();
    applyLocalTeamRequestStatus(requestId, status, reason);
    if (updated) {
      setEmployeeRequests((prev) =>
        prev.map((row) => {
          const rowId = String(
            row.user_request_id ??
              row.userRequestId ??
              row.request_id ??
              row.requestId ??
              row.id ??
              ""
          ).trim();
          if (rowId !== requestId) return row;
          return mergeStatusUpdateIntoRow(
            patchLeaveTeamRequestStatus(row, status, { reason, actorEmail: userEmail }),
            updated
          );
        })
      );
    }
  }

  function openRejectDialog(requestId: string, requestType: unknown) {
    setRejectReason("");
    setPendingReject({ requestId, requestType });
  }

  function closeRejectDialog() {
    setPendingReject(null);
    setRejectReason("");
  }

  async function confirmRejectRequest() {
    if (!pendingReject) return;
    const reason = rejectReason.trim();
    if (!reason) {
      throw new Error("Reason is required when rejecting a request.");
    }
    const requestId = pendingReject.requestId;
    setTeamStatusUpdatingId(requestId);
    try {
      await updateEmployeeRequestStatus(requestId, "REJECTED", {
        reason,
        requireReasonOnReject: true,
        requestType: pendingReject.requestType,
      });
      closeRejectDialog();
      const scope = leaveSubTab === "org" ? "org" : "team";
      invalidateTeamCache();
      invalidateLeaveBalance();
      await loadEmployeeRequestsForApprover(scope, 0, 200, true);
    } finally {
      setTeamStatusUpdatingId(null);
    }
  }
  const filteredMyLeaveRequests = useMemo(
    () =>
      myLeaveRequests
        .filter(
          (row) =>
            normalizeCompOffRequestType(row.request_type ?? row.requestType) !== "COMP_OFF_EARN"
        )
        .filter((row) => leaveRequestMatchesSearch(row, myLeaveSearch)),
    [myLeaveRequests, myLeaveSearch]
  );

  const filteredLeaveTabRequests = useMemo(
    () =>
      filteredMyLeaveRequests.filter((row) => {
        const t = normalizeUserRequestType(row.request_type ?? row.requestType);
        // Leave Request page: leave / optional / comp-off only (WFH has its own tab).
        return t === "LEAVE" || t === "OPTIONAL" || t === "COMP_OFF";
      }),
    [filteredMyLeaveRequests]
  );

  const filteredWfhTabRequests = useMemo(
    () =>
      myLeaveRequests
        .filter(
          (row) => {
            const t = normalizeUserRequestType(row.request_type ?? row.requestType);
            return t === "WFH" || t === "WFH_EXCEPTION";
          }
        )
        .filter((row) => leaveRequestMatchesSearch(row, myLeaveSearch)),
    [myLeaveRequests, myLeaveSearch]
  );

  const filteredEmployeeRequests = useMemo(
    () => employeeRequests.filter((row) => leaveRequestMatchesSearch(row, teamLeaveSearch)),
    [employeeRequests, teamLeaveSearch]
  );

  const sortedLeaveTabRequests = useMemo(
    () => applyListSort(filteredLeaveTabRequests, myLeaveSortId, LEAVE_REQUEST_SORT_OPTIONS),
    [filteredLeaveTabRequests, myLeaveSortId]
  );

  const sortedWfhTabRequests = useMemo(
    () => applyListSort(filteredWfhTabRequests, myLeaveSortId, LEAVE_REQUEST_SORT_OPTIONS),
    [filteredWfhTabRequests, myLeaveSortId]
  );

  const activeSelfServeRequests =
    leaveSubTab === "wfh" ? sortedWfhTabRequests : sortedLeaveTabRequests;

  const sortedEmployeeRequests = useMemo(
    () => applyListSort(filteredEmployeeRequests, teamLeaveSortId, LEAVE_REQUEST_SORT_OPTIONS),
    [filteredEmployeeRequests, teamLeaveSortId]
  );

  useEffect(() => {
    if (!highlightRequestId) return;
    const frame = window.requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-leave-request-id="${CSS.escape(highlightRequestId)}"]`
      );
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [highlightRequestId, sortedEmployeeRequests, sortedLeaveTabRequests, sortedWfhTabRequests]);

  const myLeavePagination = useClientPagination(activeSelfServeRequests, {
    resetKeys: [myLeaveSortId, myLeaveSearch, leaveSubTab],
  });

  // Team/org tables load a merged full list (inbox + portfolio); paginate client-side
  // so "Rows" (10/25/50/100) actually limits what's rendered.
  const teamLeavePagination = useClientPagination(sortedEmployeeRequests, {
    resetKeys: [
      teamLeaveSortId,
      teamLeaveSearch,
      leaveSubTab,
      employeeRequestFilters.fromDate,
      employeeRequestFilters.toDate,
      employeeRequestFilters.requestType,
    ],
  });

  // Deep-link / highlight: jump to the page that contains the target request.
  useEffect(() => {
    if (!highlightRequestId) return;
    const index = sortedEmployeeRequests.findIndex((row) => {
      const id = String(
        row.user_request_id ??
          row.userRequestId ??
          row.request_id ??
          row.requestId ??
          row.id ??
          ""
      ).trim();
      return id === highlightRequestId;
    });
    if (index < 0) return;
    const targetPage = Math.floor(index / Math.max(teamLeavePagination.pageSize, 1));
    if (targetPage !== teamLeavePagination.page) {
      teamLeavePagination.setPage(targetPage);
    }
  }, [
    highlightRequestId,
    sortedEmployeeRequests,
    teamLeavePagination.page,
    teamLeavePagination.pageSize,
    teamLeavePagination.setPage,
  ]);

  const currentScope = leaveSubTab === "org" ? "org" : "team";

  useEffect(() => {
    if (!canViewTeamLeave) return;
    if (leaveSubTab !== "team" && leaveSubTab !== "org") return;
    const cacheKey = `${currentScope}:${employeeRequestFilters.fromDate}:${employeeRequestFilters.toDate}:${employeeRequestFilters.requestType}:0:200`;
    const cached = teamCacheRef.current.get(cacheKey);
    if (cached) {
      setEmployeeRequests(
        applyLeaveTeamRequestDecisions(cached.rows, teamDecisionsRef.current, userEmail)
      );
      setTeamTotalPages(cached.totalPages);
      setTeamTotalElements(cached.totalElements);
    } else {
      fetchTeamRequests(currentScope, 0, 200);
    }
  }, [leaveSubTab]);

  const filterTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!canViewTeamLeave) return;
    if (leaveSubTab !== "team" && leaveSubTab !== "org") return;
    if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    filterTimerRef.current = setTimeout(() => {
      invalidateTeamCache();
      const scope = leaveSubTab === "org" ? "org" : "team";
      fetchTeamRequests(scope, 0, 200);
    }, 400);
    return () => { if (filterTimerRef.current) clearTimeout(filterTimerRef.current); };
  }, [employeeRequestFilters.fromDate, employeeRequestFilters.toDate, employeeRequestFilters.requestType]);

  const leaveTabItems = useMemo(() => {
    if (isTeamLeaveRoute) {
      return [
        canViewTeamLeave ? { value: "team", label: "Team Requests" } : null,
        hasHrAccess ? { value: "org", label: "All Employee Requests" } : null,
        hasHrAccess ? { value: "balances", label: "Balances" } : null,
      ].filter((item): item is { value: string; label: string } => Boolean(item));
    }

    return [
      { value: "my", label: "Leave Requests" },
      showCompOffTab ? { value: "comp-off", label: "Compensation Off Credit" } : null,
      { value: "wfh", label: "Work From Home" },
      hasHrAccess ? { value: "balances", label: "Balances" } : null,
    ].filter((item): item is { value: string; label: string } => Boolean(item));
  }, [canViewTeamLeave, hasHrAccess, isTeamLeaveRoute, showCompOffTab]);

  return (
    <>
      <DashboardPageShell>
        <OnboardingGate requiresSelfOnboarding={requiresSelfOnboarding}>
          <section className={cn(CONTENT_CARD_CLASS, "p-5 sm:p-6")}>
                           {showLeaveSubTabBar ? (
                             <Tabs value={leaveSubTab} onValueChange={(value) => setLeaveSubTab(value as "my" | "team" | "org" | "wfh" | "comp-off" | "balances")} className="gap-0">
                                 <div className="w-full overflow-x-auto border-b border-wt-border pb-5">
                                   <TabsList aria-label="Leave views" variant="default" className="min-w-max">
                                      {leaveTabItems.map((item) => (
                                        <TabsTrigger key={item.value} value={item.value}>
                                          {item.value === "my" && <Calendar className="size-4" />}
                                          {item.value === "team" && <Users className="size-4" />}
                                          {item.value === "org" && <Building2 className="size-4" />}
                                          {item.value === "comp-off" && <Clock className="size-4" />}
                                          {item.value === "wfh" && <Home className="size-4" />}
                                          {item.value === "balances" && <Wallet className="size-4" />}
                                          {item.label}
                                        </TabsTrigger>
                                      ))}
                                   </TabsList>
                                 </div>
                             </Tabs>
                           ) : null}
                          <div className={showLeaveSubTabBar ? "pt-6" : undefined}>
                          {leaveSubTab === "balances" && hasHrAccess ? (
                             <HrLeaveBalancesPanel actionLoading={actionLoading} runAction={runAction} />
                           ) : null}
                          {leaveSubTab === "comp-off" && showCompOffTab ? (
                            <CompOffPageClient
                              embedded
                              flowScope="earn"
                              forcedTab="my"
                            />
                          ) : null}
                          {(leaveSubTab === "my" || leaveSubTab === "wfh") ? (
                          <div>
                          {leaveSubTab === "wfh" ? (
                            <div className="space-y-6">
                              {submitsToHrForReview ? <HrReviewNoticeBanner /> : null}
                              <Tabs value={wfhRequestViewTab} onValueChange={(v) => setWfhRequestViewTab(v as "request" | "view")} orientation="horizontal">
                                <TabsList variant="line" className="w-full justify-start border-b border-wt-border/80">
                                  <TabsTrigger value="request">Apply for WFH</TabsTrigger>
                                  <TabsTrigger value="view">History</TabsTrigger>
                                </TabsList>
                                  <TabsContent value="request" className="pt-6">
                                  <div className="space-y-6">
                                    <div className="rounded-xl bg-muted/40 p-6 shadow-sm border border-border/40">
                                      <div className="flex items-start justify-between mb-5">
                                        <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                          Apply for WFH
                                        </h3>
                                        <button
                                          type="button"
                                          onClick={() => setWfhExceptionOpen(true)}
                                          className="text-xs text-[var(--wt-brand)] hover:text-[var(--wt-brand)] underline cursor-pointer"
                                        >
                                          Need a custom WFH exception? Contact HR
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
                                        <DatePicker
                                          label="From Date"
                                          required
                                          value={leaveRequestForm.request_from_date}
                                          onChange={(v) =>
                                            setLeaveRequestForm((p) => ({
                                              ...p,
                                              request_from_date: v,
                                              request_to_date: p.is_half_day
                                                ? v
                                                : p.request_to_date || v,
                                            }))
                                          }
                                          disabled={actionLoading}
                                        />
                                        <DatePicker
                                          label="To Date"
                                          required
                                          value={
                                            leaveRequestForm.is_half_day
                                              ? leaveRequestForm.request_from_date
                                              : leaveRequestForm.request_to_date
                                          }
                                          onChange={(v) => {
                                            if (leaveRequestForm.is_half_day) return;
                                            setLeaveRequestForm((p) => ({
                                              ...p,
                                              request_to_date: v,
                                            }));
                                          }}
                                          disabled={actionLoading || leaveRequestForm.is_half_day}
                                        />
                                      </div>
                                      <div className="mt-4">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                          <Checkbox
                                            className="cursor-pointer"
                                            checked={leaveRequestForm.is_half_day}
                                            onCheckedChange={(checked) =>
                                              setLeaveRequestForm((p) => ({
                                                ...p,
                                                is_half_day: checked === true,
                                                request_to_date:
                                                  checked === true
                                                    ? p.request_from_date
                                                    : p.request_to_date,
                                              }))
                                            }
                                            disabled={actionLoading}
                                          />
                                          <span className="text-muted-foreground">Half-day (single day only)</span>
                                        </label>
                                      </div>
                                      {requiresClientApproval ? (
                                        <div className="mt-5">
                                          <Label className="text-sm flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-normal text-amber-900 cursor-pointer">
                                            <Checkbox
                                              className="mt-0.5 cursor-pointer"
                                              checked={leaveRequestForm.client_approval}
                                              onCheckedChange={(checked) =>
                                                setLeaveRequestForm((p) => ({
                                                  ...p,
                                                  client_approval: checked,
                                                }))
                                              }
                                            />
                                            <span>
                                              I confirm client approval for this request (required on active client/staffing projects).
                                            </span>
                                          </Label>
                                        </div>
                                      ) : null}
                                    </div>
                                    <div className="rounded-xl bg-muted/40 p-5 space-y-5 shadow-sm border border-border/40">
                                      {routesLeaveWfhToHr ? (
                                        <p className="rounded-lg border border-wt-border/70 bg-wt-surface-2/40 px-3 py-2 text-xs leading-relaxed text-wt-text-muted">
                                          You are in the talent pool (bench or no client allocation). This WFH
                                          request will go directly to HR for approval.
                                        </p>
                                      ) : (
                                        <LeaveManagerSelector
                                          label="Select Managers"
                                          required
                                          selectedEmails={selectedWfhManagerEmails}
                                          onChange={setSelectedWfhManagerEmails}
                                          disabled={actionLoading || profileAssignedProjectsLoading}
                                        />
                                      )}
                                      <TextAreaField label="Comments" required value={leaveRequestForm.comments} onChange={(v) => setLeaveRequestForm((p) => ({ ...p, comments: v }))} />
                                      <div className="flex justify-end pt-4 border-t border-border/40 mt-6">
                                        <div className="flex items-center gap-3">
                                          <Button variant="brand" type="button" className="px-6 h-10 font-medium" disabled={actionLoading || profileAssignedProjectsLoading} onClick={() =>
                                              runAction(
                                                userRequestActionLabel("WFH", editingLeaveRequestId ? "update" : "submit"),
                                                async () => {
                                                const fromDate = normalizeToApiDate(
                                                  leaveRequestForm.request_from_date.trim()
                                                );
                                                const toDate = leaveRequestForm.is_half_day
                                                  ? fromDate
                                                  : normalizeToApiDate(
                                                      leaveRequestForm.request_to_date.trim()
                                                    );
                                                if (!fromDate || !parseApiDate(fromDate)) {
                                                  throw new Error("Please provide a valid From date (dd/mm/yyyy).");
                                                }
                                                if (!toDate || !parseApiDate(toDate)) {
                                                  throw new Error("Please provide a valid To date (dd/mm/yyyy).");
                                                }
                                                if (parseApiDate(toDate)! < parseApiDate(fromDate)!) {
                                                  throw new Error("To date cannot be earlier than From date.");
                                                }
                                                const comments = leaveRequestForm.comments.trim();
                                                if (!comments) {
                                                  throw new Error("Comments are required.");
                                                }
                                                if (comments.length > 200) {
                                                  throw new Error("Comments must be 200 characters or less.");
                                                }
                                                const needsClientApproval = requiresClientApproval;
                                                if (needsClientApproval && !leaveRequestForm.client_approval) {
                                                  throw new Error("Client approval is required for client users.");
                                                }
                                                if (!routesLeaveWfhToHr && !selectedWfhManagerEmails.length) {
                                                  throw new Error("Select at least one manager to notify.");
                                                }
                                                const payload = buildUserRequestBody(
                                                  {
                                                    request_from_date: fromDate,
                                                    request_to_date: toDate,
                                                    request_type: "WFH",
                                                    comments,
                                                    is_half_day: leaveRequestForm.is_half_day,
                                                    client_approval: needsClientApproval
                                                      ? leaveRequestForm.client_approval
                                                      : undefined,
                                                    selected_manager_emails: routesLeaveWfhToHr
                                                      ? []
                                                      : selectedWfhManagerEmails,
                                                  },
                                                  editingLeaveRequestId
                                                    ? { userRequestId: Number(editingLeaveRequestId) }
                                                    : undefined
                                                );
                                                if (editingLeaveRequestId) {
                                                  await apiClient.put(endpoints.userRequest.root, {
                                                    contentType: "application/json",
                                                    body: JSON.stringify(payload),
                                                  });
                                                } else {
                                                  await apiClient.post(endpoints.userRequest.root, {
                                                    contentType: "application/json",
                                                    body: JSON.stringify(payload),
                                                  });
                                                }
                                                setLeaveRequestForm(createDefaultLeaveRequestForm());
                                                setSelectedWfhManagerEmails([]);
                                                setSelectedAdditionalRecipientEmails([]);
                                                setEditingLeaveRequestId("");
                                                try {
                                                  await loadMyLeaveRequests();
                                                } catch {
                                                  /* submission succeeded; ignore refresh issue */
                                                }
                                                invalidateLeaveBalance();
                                              })
                                            }
                                            disabled={actionLoading}
                                          >
                                            {editingLeaveRequestId ? "Save Changes" : "Submit Request"}
                                          </Button>
                                          {editingLeaveRequestId ? (
                                            <Button variant="ghost" type="button" className="px-6 h-10 font-medium" onClick={() => {
                                                setLeaveRequestForm(createDefaultLeaveRequestForm());
                                                setEditingLeaveRequestId("");
                                              }}
                                              disabled={actionLoading}
                                            >
                                              Cancel Edit
                                            </Button>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                                <TabsContent value="view" className="pt-3">
                                  <MyLeaveRequestsView
                                    rows={filteredWfhTabRequests}
                                    loading={myLeaveRequestsLoading}
                                    showRequestType
                                    sortId={myLeaveSortId}
                                    onSortChange={setMyLeaveSortId}
                                    sortOptions={LEAVE_REQUEST_SORT_OPTIONS}
                                    pagination={myLeavePagination}
                                    actionLoading={actionLoading}
                                    onRefresh={() => runAction("Refresh my requests", loadMyLeaveRequests)}
                                    fromDate={myRequestsFromDate}
                                    toDate={myRequestsToDate}
                                    onFromDateChange={setMyRequestsFromDate}
                                    onToDateChange={setMyRequestsToDate}
                                    onEdit={(row) => {
                                      const rowType = String(
                                        row.request_type ?? row.requestType ?? "WFH"
                                      );
                                      setLeaveRequestForm({
                                        request_from_date: String(row.request_from_date ?? row.requestFromDate ?? ""),
                                        request_to_date: String(row.request_to_date ?? row.requestToDate ?? ""),
                                        request_type: rowType,
                                        comments: String(row.comments ?? ""),
                                        is_half_day: Boolean(row.is_half_day ?? row.isHalfDay ?? false),
                                        client_approval: false,
                                      });
                                      const requestId = String(
                                        row.user_request_id ??
                                          row.userRequestId ??
                                          row.request_id ??
                                          row.requestId ??
                                          row.id ??
                                          ""
                                      ).trim();
                                      setEditingLeaveRequestId(requestId);
                                      setWfhRequestViewTab("request");
                                    }}
                                    onRevoke={(requestId) =>
                                      runAction(
                                        userRequestActionLabel("WFH", "revoke"),
                                        async () => {
                                        await apiClient.delete(endpoints.userRequest.root, {
                                          contentType: "application/json",
                                          body: JSON.stringify({
                                            user_request_id: Number(requestId),
                                          }),
                                        });
                                        if (editingLeaveRequestId === requestId) {
                                          setEditingLeaveRequestId("");
                                          setLeaveRequestForm(createDefaultLeaveRequestForm());
                                        }
                                        await loadMyLeaveRequests();
                                      })
                                    }
                                  />
                                </TabsContent>
                              </Tabs>
                            </div>
                          ) : (
                            <>
                              {submitsToHrForReview ? <HrReviewNoticeBanner /> : null}
                              <div className="mb-6"><LeaveBalanceSummary selectedType={normalizeUserRequestType(leaveRequestForm.request_type)} /></div>
                              <Tabs value={requestViewTab} onValueChange={(v) => setRequestViewTab(v as "request" | "view")} orientation="horizontal">
                                <TabsList variant="line" className="w-full justify-start border-b border-wt-border/80">
                                  <TabsTrigger value="request">Apply for Leave</TabsTrigger>
                                  <TabsTrigger value="view">History</TabsTrigger>
                                </TabsList>
                                <TabsContent value="request" className="pt-6">
                                  <LeaveRequestForm
                                    values={leaveRequestForm}
                                    onChange={(v) => setLeaveRequestForm(v)}
                                    selectedManagerEmails={selectedLeaveManagerEmails}
                                    onManagerEmailsChange={setSelectedLeaveManagerEmails}
                                    selectedAdditionalEmails={selectedAdditionalRecipientEmails}
                                    onAdditionalEmailsChange={setSelectedAdditionalRecipientEmails}
                                    editingLeaveRequestId={editingLeaveRequestId}
                                    requiresClientApproval={requiresClientApproval}
                                    routesToHr={routesLeaveWfhToHr}
                                    actionLoading={actionLoading || profileAssignedProjectsLoading}
                                    leaveRequestTypeOptions={leaveRequestTypeOptions}
                                    onViewCompOffCredits={() => setCompOffCreditsOpen(true)}
                                    onSubmit={() =>
                                      runAction(
                                        userRequestActionLabel(
                                          leaveRequestForm.request_type,
                                          editingLeaveRequestId ? "update" : "submit"
                                        ),
                                        async () => {
                                        const fromDate = normalizeToApiDate(
                                          leaveRequestForm.request_from_date.trim()
                                        );
                                        const toDate = normalizeToApiDate(
                                          leaveRequestForm.request_to_date.trim()
                                        );
                                        if (!fromDate || !toDate) {
                                          throw new Error("From Date and To Date are required (dd/mm/yyyy).");
                                        }
                                        if (!parseApiDate(fromDate) || !parseApiDate(toDate)) {
                                          throw new Error("Please provide valid dates (dd/mm/yyyy).");
                                        }
                                        if (compareApiDates(toDate, fromDate) < 0) {
                                          throw new Error("To Date cannot be earlier than From Date.");
                                        }
                                        const comments = leaveRequestForm.comments.trim();
                                        if (!comments) {
                                          throw new Error("Comments are required.");
                                        }
                                        if (comments.length > 200) {
                                          throw new Error("Comments must be 200 characters or less.");
                                        }
                                        if (leaveRequestForm.is_half_day && fromDate !== toDate) {
                                          throw new Error("Half-day request must be for one day.");
                                        }
                                        const requestType = leaveRequestForm.request_type;
                                        const needsClientApproval =
                                          requiresClientApproval &&
                                          (normalizeUserRequestType(requestType) === "LEAVE" ||
                                           normalizeUserRequestType(requestType) === "OPTIONAL");
                                        if (needsClientApproval && !leaveRequestForm.client_approval) {
                                          throw new Error("Client approval is required for client users.");
                                        }
                                        if (
                                          !routesLeaveWfhToHr &&
                                          (normalizeUserRequestType(requestType) === "LEAVE" ||
                                           normalizeUserRequestType(requestType) === "OPTIONAL") &&
                                          !selectedLeaveManagerEmails.length
                                        ) {
                                          throw new Error("Select at least one primary manager.");
                                        }
                                        if (
                                          !routesLeaveWfhToHr &&
                                          (normalizeUserRequestType(requestType) === "LEAVE" ||
                                           normalizeUserRequestType(requestType) === "OPTIONAL") &&
                                          !selectedAdditionalRecipientEmails.length
                                        ) {
                                          throw new Error("Select at least one secondary manager.");
                                        }
                                        const isCompOffUsage =
                                          normalizeCompOffRequestType(requestType) === "COMP_OFF";
                                        if (isCompOffUsage) {
                                          const days = calendarDaysInclusive(fromDate, toDate);
                                          if (days < 1) {
                                            throw new Error("Select at least one calendar day.");
                                          }
                                          const available =
                                            await compOffService.resolveAvailableUnits(fromDate);
                                          if (available < days) {
                                            throw new Error(
                                              `Insufficient comp-off balance. Available: ${
                                                Number.isFinite(available) ? available : 0
                                              }, requested: ${days} day(s).`
                                            );
                                          }
                                          const managerCompOffEmail =
                                            await compOffService.resolveUsageManagerCompOffEmail();
                                          if (!managerCompOffEmail) {
                                            throw new Error(
                                              "Could not resolve project manager for comp-off. Ensure you are allocated to a project with a manager."
                                            );
                                          }
                                          await compOffService.createUsageRequest({
                                            request_from_date: fromDate,
                                            request_to_date: toDate,
                                            request_type: "COMP_OFF",
                                            comments,
                                            manager_comp_off_email: managerCompOffEmail,
                                          });
                                          setLeaveRequestForm(createDefaultLeaveRequestForm());
                                          setSelectedLeaveManagerEmails([]);
                                          setSelectedWfhManagerEmails([]);
                                          setSelectedAdditionalRecipientEmails([]);
                                          setEditingLeaveRequestId("");
                                          try {
                                            await loadMyLeaveRequests();
                                          } catch {
                                            /* submission succeeded */
                                          }
                                          return;
                                        }
                                        const isLeaveOrOptional =
                                          normalizeUserRequestType(requestType) === "LEAVE" ||
                                          normalizeUserRequestType(requestType) === "OPTIONAL";
                                        const payload = buildUserRequestBody(
                                          {
                                            request_from_date: fromDate,
                                            request_to_date: toDate,
                                            request_type: requestType,
                                            comments,
                                            is_half_day: leaveRequestForm.is_half_day,
                                            client_approval: needsClientApproval
                                              ? leaveRequestForm.client_approval
                                              : undefined,
                                            selected_manager_emails:
                                              isLeaveOrOptional && !routesLeaveWfhToHr
                                                ? selectedLeaveManagerEmails
                                                : undefined,
                                            secondary_manager_emails:
                                              isLeaveOrOptional &&
                                              !routesLeaveWfhToHr &&
                                              selectedAdditionalRecipientEmails.length
                                                ? selectedAdditionalRecipientEmails
                                                : undefined,
                                          },
                                          editingLeaveRequestId
                                            ? { userRequestId: Number(editingLeaveRequestId) }
                                            : undefined
                                        );
                                        if (editingLeaveRequestId) {
                                          await apiClient.put(endpoints.userRequest.root, {
                                            contentType: "application/json",
                                            body: JSON.stringify(payload),
                                          });
                                        } else {
                                          await apiClient.post(endpoints.userRequest.root, {
                                            contentType: "application/json",
                                            body: JSON.stringify(payload),
                                          });
                                        }
                                        setLeaveRequestForm(createDefaultLeaveRequestForm());
                                        setSelectedLeaveManagerEmails([]);
                                        setSelectedWfhManagerEmails([]);
                                        setSelectedAdditionalRecipientEmails([]);
                                        setEditingLeaveRequestId("");
                                        try {
                                          await loadMyLeaveRequests();
                                        } catch {
                                          /* submission succeeded; ignore refresh issue */
                                        }
                                      })
                                    }
                                    onCancelEdit={() => {
                                      setLeaveRequestForm(createDefaultLeaveRequestForm());
                                      setSelectedLeaveManagerEmails([]);
                                      setSelectedAdditionalRecipientEmails([]);
                                      setEditingLeaveRequestId("");
                                    }}
                                  />
                                </TabsContent>
                                <TabsContent value="view" className="pt-3">
                                  <MyLeaveRequestsView
                                    rows={filteredLeaveTabRequests}
                                    loading={myLeaveRequestsLoading}
                                    sortId={myLeaveSortId}
                                    onSortChange={setMyLeaveSortId}
                                    sortOptions={LEAVE_REQUEST_SORT_OPTIONS}
                                    pagination={myLeavePagination}
                                    actionLoading={actionLoading}
                                    onRefresh={() => runAction("Refresh my requests", loadMyLeaveRequests)}
                                    fromDate={myRequestsFromDate}
                                    toDate={myRequestsToDate}
                                    onFromDateChange={setMyRequestsFromDate}
                                    onToDateChange={setMyRequestsToDate}
                                    onEdit={(row) => {
                                      const rowType = String(
                                        row.request_type ?? row.requestType ?? "LEAVE"
                                      );
                                      setLeaveRequestForm({
                                        request_from_date: String(row.request_from_date ?? row.requestFromDate ?? ""),
                                        request_to_date: String(row.request_to_date ?? row.requestToDate ?? ""),
                                        request_type: rowType,
                                        comments: String(row.comments ?? ""),
                                        is_half_day: Boolean(row.is_half_day ?? row.isHalfDay ?? false),
                                        client_approval: false,
                                      });
                                      const primaryManagers =
                                        row.primary_managers ?? row.primaryManagers ?? [];
                                      const secondaryManagers =
                                        row.secondary_managers ?? row.secondaryManagers ?? [];
                                      setSelectedLeaveManagerEmails(
                                        Array.isArray(primaryManagers)
                                          ? primaryManagers.map(String)
                                          : []
                                      );
                                      setSelectedAdditionalRecipientEmails(
                                        Array.isArray(secondaryManagers)
                                          ? secondaryManagers.map(String)
                                          : []
                                      );
                                      const requestId = String(
                                        row.user_request_id ??
                                          row.userRequestId ??
                                          row.request_id ??
                                          row.requestId ??
                                          row.id ??
                                          ""
                                      ).trim();
                                      setEditingLeaveRequestId(requestId);
                                      setRequestViewTab("request");
                                    }}
                                    onRevoke={(requestId) =>
                                      runAction(
                                        userRequestActionLabel("LEAVE", "revoke"),
                                        async () => {
                                        await apiClient.delete(endpoints.userRequest.root, {
                                          contentType: "application/json",
                                          body: JSON.stringify({
                                            user_request_id: Number(requestId),
                                          }),
                                        });
                                        if (editingLeaveRequestId === requestId) {
                                          setEditingLeaveRequestId("");
                                          setLeaveRequestForm(createDefaultLeaveRequestForm());
                                        }
                                        await loadMyLeaveRequests();
                                      })
                                    }
                                  />
                                </TabsContent>
                              </Tabs>
                            </>
                          )}
                        </div>
                          ) : null}
                          {(leaveSubTab === "team" || leaveSubTab === "org") && canViewTeamLeave ? (
                          <div className="space-y-5">
                        <div className={FILTER_BAR_CLASS}>
                          <div className="flex flex-col gap-3">
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
                              <div className="w-full sm:min-w-[140px] sm:flex-1">
                                <SelectField
                                  label="Request Type"
                                  value={employeeRequestFilters.requestType}
                                  options={[...USER_REQUEST_FILTER_TYPE_OPTIONS]}
                                  onChange={(v) => setEmployeeRequestFilters((p) => ({ ...p, requestType: v }))}
                                  className="min-w-0"
                                />
                              </div>
                              <div className="w-full sm:min-w-[140px] sm:flex-1">
                                <DatePicker
                                  label="From Date"
                                  value={employeeRequestFilters.fromDate}
                                  onChange={(v) =>
                                    setEmployeeRequestFilters((p) => ({
                                      ...p,
                                      fromDate: v,
                                    }))
                                  }
                                />
                              </div>
                              <div className="w-full sm:min-w-[140px] sm:flex-1">
                                <DatePicker
                                  label="To Date"
                                  value={employeeRequestFilters.toDate}
                                  onChange={(v) => setEmployeeRequestFilters((p) => ({ ...p, toDate: v }))}
                                />
                              </div>
                            </div>
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <input
                                type="search"
                                value={teamLeaveSearch}
                                onChange={(e) => setTeamLeaveSearch(e.target.value)}
                                placeholder="Search by employee name…"
                                className="h-11 w-full min-w-0 rounded-xl border border-wt-border bg-wt-surface-1 px-3.5 text-sm text-wt-text outline-none transition-colors placeholder:text-wt-text-faint focus-visible:border-[var(--wt-brand)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)] dark:border-wt-border-md dark:bg-wt-surface-1 sm:max-w-md"
                              />
                              {teamLeavePagination.totalItems > 0 ? (
                                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                                  <span className="text-xs text-wt-text-muted">Rows</span>
                                  <select
                                    aria-label="Rows per page"
                                    className="h-9 rounded-lg border border-wt-border bg-wt-surface-1 px-2 text-xs tabular-nums text-wt-text outline-none focus-visible:border-[var(--wt-brand)]"
                                    value={teamLeavePagination.pageSize}
                                    onChange={(event) => {
                                      const next = Number(event.target.value);
                                      if (Number.isFinite(next) && next > 0) {
                                        teamLeavePagination.setPageSize(next);
                                      }
                                    }}
                                  >
                                    {teamLeavePagination.pageSizeOptions.map((size) => (
                                      <option key={size} value={size}>
                                        {size}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>

                          <ScrollableTable
                            maxHeightClass="max-h-[min(70vh,520px)]"
                            className={LEAVE_REQUESTS_TABLE_MIN_HEIGHT}
                          >
                            <WtTable>
                              <TableHeader className={`${WT_STICKY_TABLE_HEAD_CLASS} text-[11px] font-semibold tracking-wider text-muted-foreground/70 bg-muted/30`}>
                                <TableRow className="hover:bg-transparent h-10">
                                  <TableHead className="font-semibold px-4">
                                    <TableSortHeader
                                      label="Employee"
                                      activeDirection={activeSortDirectionForColumn(
                                        "employee",
                                        teamLeaveSortId,
                                        LEAVE_REQUEST_SORT_OPTIONS
                                      )}
                                      sortable
                                      onSort={() =>
                                        setTeamLeaveSortId(
                                          toggleColumnSort(
                                            "employee",
                                            teamLeaveSortId,
                                            LEAVE_REQUEST_SORT_OPTIONS
                                          )
                                        )
                                      }
                                    />
                                  </TableHead>
                                  <TableHead className="font-semibold px-4">
                                    <TableSortHeader
                                      label="Duration"
                                      activeDirection={activeSortDirectionForColumn(
                                        "from",
                                        teamLeaveSortId,
                                        LEAVE_REQUEST_SORT_OPTIONS
                                      )}
                                      sortable
                                      onSort={() =>
                                        setTeamLeaveSortId(
                                          toggleColumnSort(
                                            "from",
                                            teamLeaveSortId,
                                            LEAVE_REQUEST_SORT_OPTIONS
                                          )
                                        )
                                      }
                                    />
                                  </TableHead>
                                  <TableHead className="font-semibold px-4 text-center">Days</TableHead>
                                  <TableHead className="font-semibold px-4">Manager status</TableHead>
                                  <TableHead className="font-semibold px-4">Details</TableHead>
                                  {showTeamActionsColumn ? (
                                    <TableHead className="font-semibold px-4 text-right">Actions</TableHead>
                                  ) : null}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {teamRequestsLoading ? (
                                  Array.from({ length: 5 }).map((_, rowIndex) => (
                                    <TableRow key={`team-leave-skeleton-${rowIndex}`}>
                                      {Array.from({ length: teamTableColCount }).map((_, colIndex) => (
                                        <TableCell key={colIndex} className="px-4 py-3">
                                          <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))
                                ) : teamLeavePagination.pageItems.length ? (
                                  teamLeavePagination.pageItems.map((row, idx) => {
                                    const requestId = String(
                                      row.user_request_id ??
                                        row.userRequestId ??
                                        row.request_id ??
                                        row.requestId ??
                                        row.id ??
                                        ""
                                    ).trim();
                                    const status = requestFinalStatus(row as Record<string, unknown>);
                                    const managerStatus = requestManagerStatus(row as Record<string, unknown>);
                                    const managerReason = String(
                                      pickRowField(
                                        row as Record<string, unknown>,
                                        "manager_reason",
                                        "managerReason"
                                      ) ?? ""
                                    ).trim();
                                    const rowRecord = row as Record<string, unknown>;
                                    const rowRequestType = rowRecord.request_type ?? rowRecord.requestType;
                                    const isEarnRequest = isCompOffEarnRequestType(rowRequestType);
                                    const hrCanActOnRow =
                                      leaveSubTab !== "org" &&
                                      status === "PENDING" &&
                                      !isEarnRequest &&
                                      canHrShowTeamRequestActions(rowRecord, {
                                        hasHrAccess,
                                      });
                                    // Assigned primary/secondary managers can act even without ROLE_MANAGER.
                                    const assignedPrimaryAct = canPrimaryManagerActOnLeave(
                                      rowRecord,
                                      userEmail
                                    );
                                    const assignedSecondaryApprove = canSecondaryManagerApproveOnLeave(
                                      rowRecord,
                                      userEmail
                                    );
                                    const assignedSecondaryReject = canSecondaryManagerRejectOnLeave(
                                      rowRecord,
                                      userEmail
                                    );
                                    const earnManagerAct =
                                      !hrCanActOnRow &&
                                      canManagerActOnCompOffEarn(rowRecord, {
                                        hasManagerAccess: hasManagerAccess || hasDmAccess,
                                        actorEmail: userEmail,
                                      });
                                    const legacyManagerAct =
                                      !hrCanActOnRow &&
                                      !isEarnRequest &&
                                      status === "PENDING" &&
                                      canManagerActOnRequest(rowRecord, {
                                        hasManagerAccess: hasManagerAccess || hasDmAccess,
                                        hasDmAccess,
                                        actorEmail: userEmail,
                                      }) &&
                                      !assignedPrimaryAct &&
                                      !assignedSecondaryReject;
                                    const showManagerApprove =
                                      !hrCanActOnRow &&
                                      status === "PENDING" &&
                                      (earnManagerAct ||
                                        assignedPrimaryAct ||
                                        assignedSecondaryApprove ||
                                        legacyManagerAct);
                                    const showManagerReject =
                                      !hrCanActOnRow &&
                                      status === "PENDING" &&
                                      (earnManagerAct ||
                                        assignedPrimaryAct ||
                                        assignedSecondaryReject ||
                                        (legacyManagerAct &&
                                          canManagerRejectRequest(rowRecord, {
                                            hasManagerAccess: hasManagerAccess || hasDmAccess,
                                            hasDmAccess,
                                            actorEmail: userEmail,
                                          })));
                                    const showManagerActions = showManagerApprove || showManagerReject;
                                    const secondaryStage = requestSecondaryManagerStatus(rowRecord);
                                    const hasDualManagers = hasSecondaryLeaveManagers(rowRecord);
                                    const blockedHint = showTeamActionsColumn
                                        ? hrTeamActionBlockedHint(rowRecord, { hasHrAccess })
                                        : null;
                                    const isRowUpdating = teamStatusUpdatingId === requestId;
                                    const rowEmail = requestRowEmail(row as Record<string, unknown>);
                                    const isAm = rowEmail ? accountManagerEmails.has(rowEmail) : false;
                                    const employee = String(
                                      row.employee_display ??
                                        row.name ??
                                        row.employee_name ??
                                        row.employeeName ??
                                        row.email ??
                                        row.user_email ??
                                        "—"
                                    ).trim();
                                    const fromDate = String(row.request_from_date ?? row.requestFromDate ?? "").trim();
                                    const toDate = String(row.request_to_date ?? row.requestToDate ?? "").trim();
                                    const isHalfDay = Boolean(
                                      row.is_half_day ?? row.isHalfDay ?? false
                                    );
                                    const duration = fromDate && toDate ? `${fromDate} – ${toDate}` : "—";
                                    const durationDays = isEarnRequest
                                      ? "1"
                                      : formatLeaveDaysCount(
                                          fromDate,
                                          toDate,
                                          isHalfDay,
                                          holidayDates
                                        );
                                    const comments = String(row.comments ?? "").trim();
                                    const requestTypeLabel = formatUserRequestTypeLabel(
                                      rowRequestType,
                                      isHalfDay
                                    );
                                    const hasDetails = managerReason || comments || requestTypeLabel;
                                    const statusBadgeClass =
                                      status === "APPROVED"
                                        ? filledBadgeClass("success")
                                        : status === "REJECTED"
                                          ? filledBadgeClass("danger")
                                          : status === "PENDING"
                                            ? filledBadgeClass("warning")
                                            : "";
                                    return (
                                      <TableRow
                                        key={`${requestId || "req"}-${idx}`}
                                        data-leave-request-id={requestId || undefined}
                                        className={
                                          [
                                            idx % 2 === 1 ? "bg-muted/20" : "",
                                            highlightRequestId && requestId === highlightRequestId
                                              ? "bg-[var(--wt-brand-soft)]/40 ring-1 ring-inset ring-[var(--wt-brand)]/30"
                                              : "",
                                          ]
                                            .filter(Boolean)
                                            .join(" ")
                                        }
                                      >
                                        <TableCell className="px-4 py-3 whitespace-nowrap">
                                          <span className="font-medium text-foreground">{employee || "—"}</span>
                                          {isAm ? (
                                            <Badge variant="secondary" className={`ml-2 text-[10px] ${filledBadgeClass("info")}`}>
                                              AM
                                            </Badge>
                                          ) : null}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                                          <span>{duration}</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 whitespace-nowrap text-center text-xs font-medium text-foreground/70">
                                          {durationDays && durationDays !== "—" ? durationDays : "—"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 whitespace-nowrap">
                                          <div className="flex flex-col items-start gap-1">
                                            {status ? (
                                              <RequestStatusBadge status={status} />
                                            ) : managerStatus ? (
                                              <RequestStatusBadge status={managerStatus} />
                                            ) : (
                                              <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                            {hasDualManagers &&
                                            (managerStatus !== "PENDING" ||
                                              secondaryStage !== "PENDING") ? (
                                              <p className="text-[11px] text-muted-foreground">
                                                Primary: {managerStatus || "PENDING"} · Secondary:{" "}
                                                {secondaryStage || "PENDING"}
                                              </p>
                                            ) : null}
                                          </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                          {hasDetails ? (
                                            <div
                                              className="text-xs text-muted-foreground space-y-0.5 max-w-[220px]"
                                              title={`${requestTypeLabel ? `Type: ${requestTypeLabel}` : ""}${requestTypeLabel && (managerReason || comments) ? " | " : ""}${managerReason ? `Reason: ${managerReason}` : ""}${managerReason && comments ? " | " : ""}${comments ? `Comments: ${comments}` : ""}`}
                                            >
                                              {requestTypeLabel ? (
                                                <p className="font-medium text-foreground/80">{requestTypeLabel}</p>
                                              ) : null}
                                              {comments ? (
                                                <p className="truncate">{comments}</p>
                                              ) : null}
                                              {managerReason ? (
                                                <p className="truncate text-rose-700/80">{managerReason}</p>
                                              ) : null}
                                            </div>
                                          ) : (
                                            <span className="text-xs text-muted-foreground/50">—</span>
                                          )}
                                        </TableCell>
                                        {showTeamActionsColumn ? (
                                          <TableCell className="px-4 py-3 text-right">
                                            {hrCanActOnRow ? (
                                              <div className="inline-flex items-center justify-end gap-1">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="xs"
                                                  className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10"
                                                  disabled={actionLoading || !requestId || isRowUpdating}
                                                  onClick={() =>
                                                    runAction(
                                                      userRequestActionLabel(
                                                        row.request_type ?? row.requestType,
                                                        "approve"
                                                      ),
                                                      async () => {
                                                        setTeamStatusUpdatingId(requestId);
                                                        try {
                                                          await updateEmployeeRequestStatus(
                                                            requestId,
                                                            "APPROVED",
                                                            {
                                                              requireReasonOnReject: false,
                                                              requestType: rowRequestType,
                                                            }
                                                          );
                                                          // Actions column is team-only (hidden on org / All Employee Requests).
                                                          invalidateTeamCache();
                                                          invalidateLeaveBalance();
                                                          await loadEmployeeRequestsForApprover("team", 0, 200, true);
                                                        } finally {
                                                          setTeamStatusUpdatingId(null);
                                                        }
                                                      }
                                                    )
                                                  }
                                                >
                                                  {isRowUpdating ? "…" : "Approve"}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="xs"
                                                  className="border-rose-600/30 text-rose-700 hover:bg-rose-500/10"
                                                  disabled={actionLoading || !requestId || isRowUpdating}
                                                  onClick={() =>
                                                    openRejectDialog(
                                                      requestId,
                                                      row.request_type ?? row.requestType
                                                    )
                                                  }
                                                >
                                                  Reject
                                                </Button>
                                              </div>
                                            ) : showManagerActions ? (
                                              <div className="inline-flex flex-col items-end gap-1">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                  {showManagerApprove ? (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="xs"
                                                      className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10"
                                                      disabled={actionLoading || !requestId}
                                                      onClick={() =>
                                                        runAction(
                                                          userRequestActionLabel(
                                                            row.request_type ?? row.requestType,
                                                            "approve"
                                                          ),
                                                          async () => {
                                                            await updateEmployeeRequestStatus(
                                                              requestId,
                                                              "APPROVED",
                                                              {
                                                                requireReasonOnReject: false,
                                                                requestType: rowRequestType,
                                                              }
                                                            );
                                                            invalidateTeamCache();
                                                            invalidateLeaveBalance();
                                                            await loadEmployeeRequestsForApprover(
                                                              "team",
                                                              0,
                                                              200,
                                                              true
                                                            );
                                                          }
                                                        )
                                                      }
                                                    >
                                                      Approve
                                                    </Button>
                                                  ) : null}
                                                  {showManagerReject ? (
                                                    <Button
                                                      type="button"
                                                      variant="outline"
                                                      size="xs"
                                                      className="border-rose-600/30 text-rose-700 hover:bg-rose-500/10"
                                                      disabled={actionLoading || !requestId}
                                                      onClick={() =>
                                                        openRejectDialog(
                                                          requestId,
                                                          rowRequestType
                                                        )
                                                      }
                                                    >
                                                      Reject
                                                    </Button>
                                                  ) : null}
                                                </div>
                                              </div>
                                            ) : blockedHint ? (
                                              <span className="text-xs text-muted-foreground">{blockedHint}</span>
                                            ) : (
                                              <span className="text-muted-foreground/50">—</span>
                                            )}
                                          </TableCell>
                                        ) : null}
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow className="hover:bg-transparent">
                                    <TableCell
                                      colSpan={teamTableColCount}
                                      className="h-[280px] text-center align-middle"
                                    >
                                      <div className="flex flex-col items-center gap-2">
                                        <Users className="size-8 text-muted-foreground/30" />
                                        <span className="text-sm text-muted-foreground">
                                          {employeeRequests.length
                                            ? "No requests match your search."
                                            : "No Data"}
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </WtTable>
                          </ScrollableTable>
                          {teamLeavePagination.showPagination ? (
                            <div className="border-t border-border/40 pt-4">
                              <ListPagination
                                page={teamLeavePagination.page}
                                totalPages={teamLeavePagination.totalPages}
                                totalItems={teamLeavePagination.totalItems}
                                rangeStart={teamLeavePagination.rangeStart}
                                rangeEnd={teamLeavePagination.rangeEnd}
                                pageSize={teamLeavePagination.pageSize}
                                pageSizeOptions={teamLeavePagination.pageSizeOptions}
                                onPageChange={teamLeavePagination.setPage}
                                onPageSizeChange={teamLeavePagination.setPageSize}
                              />
                            </div>
                          ) : null}
                        </div>
                          ) : null}
                          </div>
                        </section>
        </OnboardingGate>
      </DashboardPageShell>
            <UserRequestRejectDialog
              open={Boolean(pendingReject)}
              title={
                pendingReject
                  ? userRequestActionLabel(pendingReject.requestType, "reject")
                  : "Reject request"
              }
              description="A reason is required when rejecting a leave or work-from-home request."
              reasonPlaceholder="Enter rejection reason"
              confirmLabel="Reject"
              confirmingLabel="Rejecting…"
              reason={rejectReason}
              onReasonChange={setRejectReason}
              onCancel={closeRejectDialog}
              onConfirm={() =>
                runAction(
                  pendingReject
                    ? userRequestActionLabel(pendingReject.requestType, "reject")
                    : "Reject request",
                  confirmRejectRequest
                )
              }
              loading={actionLoading}
            />
            <CompOffCreditsDialog open={compOffCreditsOpen} onClose={() => setCompOffCreditsOpen(false)} />
            <WfhExceptionModal
              open={wfhExceptionOpen}
              onClose={() => setWfhExceptionOpen(false)}
              onSubmit={handleSubmitWfhException}
            />
    </>
  );
}
