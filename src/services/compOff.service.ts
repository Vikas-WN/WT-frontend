import { endpoints } from "@/api/endpoints";
import { ApiError } from "@/api/error";
import { apiClient, type ApiEnvelope } from "@/api/httpClient";
import { hrmsService } from "@/services/hrms.service";
import type { CompOffBalanceData, CompOffExpiryData, CompOffExpiryItem, CompOffGrant } from "@/types/compOff";
import { applyApiDateFields, applyApiDateQuery, requireApiDateParam, toApiDateParam } from "@/utils/apiDate";
import {
  availableUnitsFromGrants,
  dedupeCompOffRequestRows,
  inferStatusFromAlreadyActedError,
  isAlreadyActedOnRequestError,
  mapEarnListRow,
} from "@/utils/compOff";
import { toPagedRows, toRows } from "@/utils/apiRows";
import { emailFromOnboardRow } from "@/utils/learning/onboardOptions";
import {
  loadCompOffProjectCatalog,
  resolveCompOffManagerEmail,
} from "@/services/compOffProjectCatalog.service";

async function listRequestsByTypes(params: {
  fromDate: string;
  toDate: string;
  requestTypes: string[];
  empEmails?: string;
}): Promise<Array<Record<string, unknown>>> {
  const { fromDate, toDate, requestTypes, empEmails } = params;
  const responses = await Promise.allSettled(
    requestTypes.map((requestType) =>
      compOffService.listRequests({ fromDate, toDate, requestType, empEmails })
    )
  );
  return dedupeCompOffRequestRows(
    responses
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof compOffService.listRequests>>> =>
          r.status === "fulfilled"
      )
      .flatMap((r) => compOffService.parseRequestRows(r.value))
  );
}

export const compOffService = {
  getManagerOptions() {
    return apiClient.get<ApiEnvelope<unknown>>(endpoints.compOff.earnManagerOptions);
  },

  /** GET /comp-off/earn/projects — active allocation projects for comp-off earn. */
  getEarnProjects() {
    return apiClient.get<ApiEnvelope<unknown[]>>(endpoints.compOff.earnProjects);
  },

  cancelEarnRequest(userRequestId: number) {
    return apiClient.put<ApiEnvelope<unknown>>(endpoints.compOff.earnCancel, {
      query: { userRequestId: String(userRequestId) },
    });
  },

  createEarnRequest(body: Record<string, unknown>) {
    const payload = applyApiDateFields(body, ["workedDate", "worked_date"]);
    const workedDate =
      toApiDateParam(String(payload.workedDate ?? payload.worked_date ?? "")) ?? "";
    const projectCode = String(payload.projectCode ?? payload.project_code ?? "").trim();
    const workDescription = String(
      payload.workDescription ?? payload.work_description ?? ""
    ).trim();
    const normalizeEmails = (value: unknown): string[] => [
      ...new Set(
        (Array.isArray(value) ? value : [])
          .map((email) => String(email).trim().toLowerCase())
          .filter(Boolean)
      ),
    ];
    const managerEmails = normalizeEmails(payload.manager_emails ?? payload.managerEmails);
    const secondaryManagerEmails = normalizeEmails(
      payload.secondary_manager_emails ?? payload.secondaryManagerEmails
    );
    const requestBody: Record<string, unknown> = {
      worked_date: workedDate,
      workedDate,
      project_code: projectCode,
      projectCode,
      work_description: workDescription,
      workDescription,
    };
    if (managerEmails.length) {
      requestBody.manager_emails = managerEmails;
      requestBody.managerEmails = managerEmails;
    }
    if (secondaryManagerEmails.length) {
      requestBody.secondary_manager_emails = secondaryManagerEmails;
      requestBody.secondaryManagerEmails = secondaryManagerEmails;
    }
    return apiClient.post<ApiEnvelope<unknown>>(endpoints.compOff.earn, {
      contentType: "application/json",
      body: JSON.stringify(requestBody),
    });
  },

  listEarnRequests(params: {
    fromDate: string;
    toDate: string;
    page?: number;
    size?: number;
    managerOnly?: boolean;
    selfOnly?: boolean;
  }) {
    const { fromDate, toDate, page = 0, size = 200, managerOnly, selfOnly } = params;
    const query: Record<string, string> = {
      page: String(page),
      size: String(size),
      fromDate,
      toDate,
    };
    if (managerOnly) {
      query.managerOnly = "true";
    }
    if (selfOnly) {
      query.selfOnly = "true";
    }
    return apiClient.get<ApiEnvelope<unknown>>(endpoints.compOff.earn, {
      query: applyApiDateQuery(query, ["fromDate", "toDate"]),
    });
  },

  createUsageRequest(body: Record<string, unknown>) {
    const payload = applyApiDateFields(body, [
      "requestFromDate",
      "requestToDate",
      "request_from_date",
      "request_to_date",
    ]);
    const normalized: Record<string, unknown> = {
      requestFromDate: payload.requestFromDate ?? payload.request_from_date,
      requestToDate: payload.requestToDate ?? payload.request_to_date,
      requestType: payload.requestType ?? payload.request_type ?? "COMP_OFF",
      comments: payload.comments ?? "",
      isHalfDay: false,
      primaryManagerEmails: payload.primary_manager_emails ?? payload.primaryManagerEmails ?? [],
      secondaryManagerEmails: payload.secondary_manager_emails ?? payload.secondaryManagerEmails ?? [],
      primary_manager_emails: payload.primary_manager_emails ?? payload.primaryManagerEmails ?? [],
      secondary_manager_emails: payload.secondary_manager_emails ?? payload.secondaryManagerEmails ?? [],
    };
    // Omit when unresolved — the API rejects an empty string and routes by manager scope instead.
    const managerCompOffEmail = String(
      payload.managerCompOffEmail ?? payload.manager_comp_off_email ?? ""
    ).trim();
    if (managerCompOffEmail) {
      normalized.managerCompOffEmail = managerCompOffEmail;
    }
    return apiClient.post<ApiEnvelope<unknown>>(endpoints.userRequest.root, {
      contentType: "application/json",
      body: JSON.stringify(normalized),
    });
  },

  /** Returns mapped earn rows; empty list when the earn API is unreachable or errors. */
  async listEarnRequestRows(params: {
    fromDate: string;
    toDate: string;
    page?: number;
    size?: number;
    managerOnly?: boolean;
    selfOnly?: boolean;
  }): Promise<Array<Record<string, unknown>>> {
    try {
      const res = await this.listEarnRequests(params);
      return this.parseRequestRows(res).map(mapEarnListRow);
    } catch {
      return [];
    }
  },

  /** Available units as of date — backed by GET /comp-off/expiry (not /balance). */
  getBalance(asOfDate?: string) {
    const normalized = toApiDateParam(asOfDate);
    const query: Record<string, string> = {};
    if (normalized) {
      query.asOfDate = normalized;
    }
    return apiClient.get<ApiEnvelope<CompOffBalanceData | CompOffExpiryData>>(
      endpoints.compOff.expiry,
      {
        query: Object.keys(query).length ? query : undefined,
      }
    );
  },

  getExpiry(asOfDate?: string) {
    const normalized = toApiDateParam(asOfDate);
    const query: Record<string, string> = {};
    if (normalized) {
      query.asOfDate = normalized;
    }
    return apiClient.get<ApiEnvelope<CompOffExpiryData>>(endpoints.compOff.expiry, {
      query: Object.keys(query).length ? query : undefined,
    });
  },

  getGrants(empId?: string) {
    const path = empId?.trim()
      ? endpoints.compOff.grantsForEmployee(empId.trim())
      : endpoints.compOff.grants;
    return apiClient.get<ApiEnvelope<CompOffGrant[] | { grants?: CompOffGrant[] }>>(path);
  },

  parseGrantsResponse(res: ApiEnvelope<unknown>): CompOffGrant[] {
    const data = res.data;
    if (Array.isArray(data)) return data as CompOffGrant[];
    if (data && typeof data === "object") {
      const grants = (data as { grants?: unknown }).grants;
      if (Array.isArray(grants)) return grants as CompOffGrant[];
      return toRows(data) as CompOffGrant[];
    }
    return [];
  },

  /** Manager emails from GET /comp-off/earn/manager-options (managers on the caller's allocations). */
  async resolveManagerEmailFromManagerOptions(projectCode?: string): Promise<string> {
    try {
      const res = await this.getManagerOptions();
      const payload = (res as { data?: unknown }).data ?? res;
      const items = toRows(
        (payload as { items?: unknown })?.items ?? payload
      ) as Array<Record<string, unknown>>;
      const code = projectCode?.trim().toLowerCase();
      const emailOf = (row: Record<string, unknown>) =>
        String(row.email ?? "").trim().toLowerCase();
      if (code) {
        const forCode = items.find(
          (row) =>
            String(row.project_code ?? row.projectCode ?? "")
              .trim()
              .toLowerCase() === code && emailOf(row).includes("@")
        );
        if (forCode) return emailOf(forCode);
      }
      const first = items.find((row) => emailOf(row).includes("@"));
      return first ? emailOf(first) : "";
    } catch {
      return "";
    }
  },

  async resolveUsageManagerCompOffEmail(projectCode?: string): Promise<string> {
    try {
      const catalog = await loadCompOffProjectCatalog();
      const code = projectCode?.trim();
      if (code) {
        const forCode = (await resolveCompOffManagerEmail(code, catalog)).trim().toLowerCase();
        if (forCode) return forCode;
        const fromOptions = await this.resolveManagerEmailFromManagerOptions(code);
        if (fromOptions) return fromOptions;
      }
      // First, try to find a project with a manager email in the catalog
      const withManager = catalog.options.find((p) => p.managerEmail?.trim());
      if (withManager?.managerEmail) {
        return withManager.managerEmail.trim().toLowerCase();
      }
      // Managers of the caller's active allocations — the authoritative source.
      const fromManagerOptions = await this.resolveManagerEmailFromManagerOptions();
      if (fromManagerOptions) return fromManagerOptions;
      // Fallback: try to find any manager email from assigned/earn projects
      const allOptions = [...catalog.options, ...catalog.assignedRows, ...catalog.allocationRows];
      for (const row of allOptions) {
        const rowRecord = row as Record<string, unknown>;
        const email = String(
          rowRecord.manager_email ?? rowRecord.managerEmail ?? rowRecord.account_manager_email ?? rowRecord.accountManagerEmail ?? ""
        ).trim().toLowerCase();
        if (email && email.includes("@")) return email;
      }
      // Last resort: check the onboard list for account/delivery/project managers
      try {
        const onboardRes = await hrmsService.getOnboardList({ page: "0", size: "500" });
        const onboardRows = toPagedRows((onboardRes as { data?: unknown }).data ?? onboardRes);
        for (const row of onboardRows) {
          const email = String(
            row.account_manager_email ?? row.accountManagerEmail ??
            row.delivery_manager_email ?? row.deliveryManagerEmail ??
            row.project_manager_email ?? row.projectManagerEmail ??
            row.manager_email ?? row.managerEmail ?? ""
          ).trim().toLowerCase();
          if (email && email.includes("@")) return email;
        }
      } catch {
        /* ignore */
      }
      return "";
    } catch {
      return "";
    }
  },

  parseBalanceResponse(res: ApiEnvelope<unknown>): CompOffBalanceData | null {
    const data = res.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const record = data as Record<string, unknown>;
      const direct = Number(record.available_units ?? record.availableUnits);
      const usableRaw = Number(record.usable_units ?? record.usableUnits);
      const usable = Number.isFinite(usableRaw) ? usableRaw : undefined;
      if (Number.isFinite(direct)) {
        const asOf = String(record.as_of_date ?? record.asOfDate ?? "").trim();
        return {
          available_units: direct,
          availableUnits: direct,
          ...(usable !== undefined
            ? { usable_units: usable, usableUnits: usable }
            : {}),
          ...(asOf ? { as_of_date: asOf, asOfDate: asOf } : {}),
        };
      }
    }
    const expiry = this.parseExpiryResponse(res);
    // expiry.total is a grant COUNT from the API, not available units — always sum remaining.
    const units = expiry.rows.reduce((sum, row) => {
      const status = String(row.status ?? "")
        .trim()
        .toUpperCase();
      if (status === "EXPIRED" || status === "EXHAUSTED" || status === "CONSUMED") {
        return sum;
      }
      const n = Number(row.remaining_units ?? row.remainingUnits ?? row.units ?? 0);
      return sum + (Number.isFinite(n) ? Math.max(0, n) : 0);
    }, 0);
    if (!Number.isFinite(units)) return null;
    return {
      available_units: units,
      availableUnits: units,
      ...(expiry.asOfDate ? { as_of_date: expiry.asOfDate, asOfDate: expiry.asOfDate } : {}),
    };
  },

  async resolveAvailableUnits(asOfDate: string): Promise<number> {
    const asOf = toApiDateParam(asOfDate) ?? asOfDate.trim();
    try {
      const res = await this.getBalance(asOf);
      const balance = this.parseBalanceResponse(res);
      // Prefer usable (after pending reservations); fall back to credit inventory.
      const usable = Number(balance?.usable_units ?? balance?.usableUnits);
      if (Number.isFinite(usable)) return usable;
      const units = Number(balance?.available_units ?? balance?.availableUnits);
      if (Number.isFinite(units)) return units;
    } catch {
      /* fall through to grants */
    }
    try {
      const grantsRes = await this.getGrants();
      return availableUnitsFromGrants(this.parseGrantsResponse(grantsRes), asOf);
    } catch {
      return 0;
    }
  },

  parseExpiryResponse(res: ApiEnvelope<unknown>): {
    asOfDate: string | null;
    total: number;
    rows: CompOffExpiryItem[];
  } {
    const data = res.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { asOfDate: null, total: 0, rows: [] };
    }
    const record = data as Record<string, unknown>;
    const rawRows = Array.isArray(record.data) ? (record.data as CompOffExpiryItem[]) : [];
    const total = Number(record.total ?? rawRows.length ?? 0);
    const asOfDate = String(record.as_of_date ?? record.asOfDate ?? "").trim() || null;
    return {
      asOfDate,
      total: Number.isFinite(total) ? total : rawRows.length,
      rows: rawRows,
    };
  },

  listRequests(params: {
    fromDate: string;
    toDate: string;
    requestType: string;
    empEmails?: string;
    page?: number;
    size?: number;
  }) {
    const { fromDate, toDate, requestType, empEmails, page = 0, size = 200 } = params;
    const normalizedFrom = requireApiDateParam(fromDate, "From date");
    const normalizedTo = requireApiDateParam(toDate, "To date");
    return apiClient
      .get<ApiEnvelope<unknown>>(endpoints.userRequest.root, {
        query: applyApiDateQuery(
          {
            fromDate: normalizedFrom,
            toDate: normalizedTo,
            requestType,
            page: String(page),
            size: String(size),
          },
          ["fromDate", "toDate"]
        ),
      })
      .catch((error) => {
        if (!(error instanceof ApiError) || error.status !== 405) throw error;
        const path = empEmails?.trim()
          ? endpoints.userRequest.getByEmployees(
              empEmails,
              normalizedFrom,
              normalizedTo,
              requestType
            )
          : endpoints.userRequest.getRange(normalizedFrom, normalizedTo, requestType);
        return apiClient.get<ApiEnvelope<unknown>>(path, {
          query: { page: String(page), size: String(size) },
        });
      });
  },

  parseRequestRows(res: ApiEnvelope<unknown>): Array<Record<string, unknown>> {
    return toPagedRows(res.data ?? res);
  },

  /** HR team review — merge employee-scoped and org-wide comp-off lists (same pattern as Leave). */
  async fetchHrTeamRequests(params: {
    fromDate: string;
    toDate: string;
    requestTypes: string[];
  }): Promise<Array<Record<string, unknown>>> {
    const { fromDate, toDate, requestTypes } = params;
    const collected: Array<Record<string, unknown>> = [];

    try {
      const onboardRes = await hrmsService.getOnboardList({ page: "0", size: "500" });
      const onboardRows = toPagedRows((onboardRes as { data?: unknown }).data ?? onboardRes);
      const emailCsv = [
        ...new Set(
          onboardRows.map((row) => emailFromOnboardRow(row)).filter(Boolean)
        ),
      ].join(",");
      if (emailCsv) {
        collected.push(
          ...(await listRequestsByTypes({
            fromDate,
            toDate,
            requestTypes,
            empEmails: emailCsv,
          }))
        );
      }
    } catch {
      /* continue with range fetch */
    }

    collected.push(
      ...(await listRequestsByTypes({
        fromDate,
        toDate,
        requestTypes,
      }))
    );

    return dedupeCompOffRequestRows(collected);
  },

  createRequest(body: Record<string, unknown>) {
    return apiClient.post<ApiEnvelope<unknown>>(endpoints.userRequest.root, {
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  },

  updateRequest(body: Record<string, unknown>) {
    return apiClient.put<ApiEnvelope<unknown>>(endpoints.userRequest.root, {
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  },

  deleteRequest(userRequestId: number) {
    return apiClient.delete<ApiEnvelope<unknown>>(endpoints.userRequest.root, {
      contentType: "application/json",
      body: JSON.stringify({ user_request_id: userRequestId }),
    });
  },

  /** PUT /api/v1/userRequest/status — comp-off usage (manager + HR). */
  async updateRequestStatus(
    userRequestId: number,
    status: "APPROVED" | "REJECTED",
    options?: { reason?: string | null; requireReasonOnReject?: boolean }
  ) {
    const idNum = Number(userRequestId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      throw new Error("Invalid request id.");
    }
    const requireReason = options?.requireReasonOnReject ?? false;
    const trimmedReason = options?.reason?.trim() ?? "";
    if (status === "REJECTED" && requireReason && !trimmedReason) {
      throw new Error("Reason is required when rejecting a request.");
    }
    const body: Record<string, unknown> = {
      user_request_id: idNum,
      userRequestId: idNum,
      user_request_status: status,
      userRequestStatus: status,
    };
    if (status === "REJECTED" && requireReason && trimmedReason) {
      body.reason = trimmedReason;
      body.message = trimmedReason;
    }
    try {
      return await apiClient.put<ApiEnvelope<unknown>>(endpoints.userRequest.status, {
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    } catch (firstError) {
      if (isAlreadyActedOnRequestError(firstError)) {
        const inferred = inferStatusFromAlreadyActedError(firstError);
        if (inferred === status) {
          return { message: "ok", data: null } as ApiEnvelope<unknown>;
        }
        throw firstError;
      }
      try {
        const legacy: Record<string, unknown> = {
          user_request_id: idNum,
          user_request_status: status === "APPROVED" ? "APPROVE" : "REJECT",
        };
        if (status === "REJECTED" && requireReason && trimmedReason) {
          legacy.reason = trimmedReason;
          legacy.message = trimmedReason;
        }
        return await apiClient.put<ApiEnvelope<unknown>>(endpoints.userRequest.status, {
          contentType: "application/json",
          body: JSON.stringify(legacy),
        });
      } catch (secondError) {
        if (isAlreadyActedOnRequestError(secondError)) {
          const inferred = inferStatusFromAlreadyActedError(secondError);
          if (inferred === status) {
            return { message: "ok", data: null } as ApiEnvelope<unknown>;
          }
        }
        throw firstError;
      }
    }
  },

  /** PUT /api/v1/comp-off/earn/status — manager only. */
  async updateEarnRequestStatus(
    userRequestId: number,
    status: "APPROVED" | "REJECTED",
    reason?: string | null
  ) {
    const idNum = Number(userRequestId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      throw new Error("Invalid request id.");
    }
    const trimmedReason = reason?.trim() ?? "";
    if (status === "REJECTED" && !trimmedReason) {
      throw new Error("Reason is required when rejecting an earn request.");
    }
    const body: Record<string, unknown> = {
      user_request_id: idNum,
      userRequestId: idNum,
      user_request_status: status,
      userRequestStatus: status,
    };
    if (status === "REJECTED" && trimmedReason) {
      body.message = trimmedReason;
    }
    return apiClient.put<ApiEnvelope<unknown>>(endpoints.compOff.earnStatus, {
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  },
};
