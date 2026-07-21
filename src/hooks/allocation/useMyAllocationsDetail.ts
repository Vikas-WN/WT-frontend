"use client";

import { useQuery } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import { MY_ALLOCATIONS_DETAIL_QUERY_KEY } from "@/utils/allocationQueryInvalidation";

export type ProjectManagerContact = {
  userId: number;
  employeeEmail: string;
  employeeName: string;
  empId: string | null;
};

export type TeamMemberRow = {
  employeeEmail: string;
  employeeName: string;
  userId: number;
  empId: string | null;
  role: string;
  allocatedPercent: string;
  startDate: string;
  endDate: string;
};

export type MyAllocationProject = {
  projectCode: string;
  projectName: string;
  clientName: string | null;
  capacity: "team_member" | "project_manager" | "both";
  myAllocation: MyAllocationRow | null;
  projectManagers: ProjectManagerContact[];
  teamMembers: TeamMemberRow[];
};

export type MyAllocationRow = {
  id: number;
  projectCode: string;
  projectName: string;
  role: string;
  allocatedPercent: string;
  startDate: string;
  endDate: string;
  billingStatus: string;
  allocationType: string;
};

function readString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function readNullableString(row: Record<string, unknown>, ...keys: string[]): string | null {
  const value = readString(row, ...keys);
  return value || null;
}

function normalizeAllocationRow(row: Record<string, unknown>): MyAllocationRow | null {
  const id = Number(row.id);
  if (!Number.isFinite(id)) return null;
  const projectCode = readString(row, "project_code", "projectCode");
  const projectName = readString(row, "project_name", "projectName") || projectCode;
  const allocatedRaw =
    row.allocated_percent ?? row.allocatedPercent ?? row.allocated_hours ?? row.allocatedHours;
  const allocatedPercent =
    allocatedRaw !== undefined && allocatedRaw !== null && allocatedRaw !== ""
      ? `${Number(allocatedRaw)}%`
      : "—";

  return {
    id,
    projectCode,
    projectName,
    role: readString(row, "role") || "—",
    allocatedPercent,
    startDate: readString(row, "start_date", "startDate") || "—",
    endDate: readString(row, "end_date", "endDate") || "—",
    billingStatus: readString(row, "billing_status", "billingStatus") || "—",
    allocationType: readString(row, "allocation_type", "allocationType") || "—",
  };
}

function normalizeManager(row: Record<string, unknown>): ProjectManagerContact | null {
  const userId = Number(row.user_id ?? row.userId);
  const email = readString(row, "employee_email", "employeeEmail", "email");
  if (!Number.isFinite(userId) || !email) return null;
  return {
    userId,
    employeeEmail: email.toLowerCase(),
    employeeName: readString(row, "employee_name", "employeeName", "name") || email,
    empId: readNullableString(row, "emp_id", "empId"),
  };
}

function normalizeTeamMember(row: Record<string, unknown>): TeamMemberRow | null {
  const userId = Number(row.user_id ?? row.userId);
  const email = readString(row, "employee_email", "employeeEmail", "email");
  if (!Number.isFinite(userId) || !email) return null;
  const allocatedRaw =
    row.allocated_percent ?? row.allocatedPercent ?? row.allocated_hours ?? row.allocatedHours;
  const allocatedPercent =
    allocatedRaw !== undefined && allocatedRaw !== null && allocatedRaw !== ""
      ? `${Number(allocatedRaw)}%`
      : "—";
  return {
    userId,
    employeeEmail: email.toLowerCase(),
    employeeName: readString(row, "employee_name", "employeeName", "name") || email,
    empId: readNullableString(row, "emp_id", "empId"),
    role: readString(row, "role") || "—",
    allocatedPercent,
    startDate: readString(row, "start_date", "startDate") || "—",
    endDate: readString(row, "end_date", "endDate") || "—",
  };
}

function normalizeProject(row: Record<string, unknown>): MyAllocationProject | null {
  const projectCode = readString(row, "project_code", "projectCode");
  if (!projectCode) return null;
  const myAllocationRaw = row.my_allocation ?? row.myAllocation;
  const myAllocation =
    myAllocationRaw && typeof myAllocationRaw === "object"
      ? normalizeAllocationRow(myAllocationRaw as Record<string, unknown>)
      : null;
  const capacityRaw = readString(row, "capacity").toLowerCase();
  const capacity: MyAllocationProject["capacity"] =
    capacityRaw === "project_manager" || capacityRaw === "both" || capacityRaw === "team_member"
      ? capacityRaw
      : myAllocation
        ? "team_member"
        : "project_manager";

  const managersRaw = Array.isArray(row.project_managers ?? row.projectManagers)
    ? ((row.project_managers ?? row.projectManagers) as unknown[])
    : [];
  const teamRaw = Array.isArray(row.team_members ?? row.teamMembers)
    ? ((row.team_members ?? row.teamMembers) as unknown[])
    : [];

  if (!myAllocation && capacity === "team_member") return null;

  return {
    projectCode,
    projectName: readString(row, "project_name", "projectName") || projectCode,
    clientName: readNullableString(row, "client_name", "clientName"),
    capacity,
    myAllocation,
    projectManagers: managersRaw
      .map((item) => normalizeManager(item as Record<string, unknown>))
      .filter((item): item is ProjectManagerContact => Boolean(item)),
    teamMembers: teamRaw
      .map((item) => normalizeTeamMember(item as Record<string, unknown>))
      .filter((item): item is TeamMemberRow => Boolean(item)),
  };
}

function parseMyAllocationsDetail(data: unknown): {
  currentProjects: MyAllocationProject[];
  history: MyAllocationRow[];
} {
  const payload = (data as { data?: unknown })?.data ?? data;
  if (!payload || typeof payload !== "object") {
    return { currentProjects: [], history: [] };
  }
  const root = payload as Record<string, unknown>;
  const currentRaw = Array.isArray(root.current_projects ?? root.currentProjects)
    ? ((root.current_projects ?? root.currentProjects) as unknown[])
    : Array.isArray(root.current)
      ? (root.current as unknown[])
      : [];
  const historyRaw = Array.isArray(root.history) ? root.history : [];

  const currentProjects = currentRaw
    .map((row) => {
      if (
        row &&
        typeof row === "object" &&
        ("my_allocation" in (row as object) ||
          "myAllocation" in (row as object) ||
          "capacity" in (row as object) ||
          "project_managers" in (row as object) ||
          "projectManagers" in (row as object))
      ) {
        return normalizeProject(row as Record<string, unknown>);
      }
      const allocation = normalizeAllocationRow(row as Record<string, unknown>);
      if (!allocation) return null;
      return {
        projectCode: allocation.projectCode,
        projectName: allocation.projectName,
        clientName: null,
        capacity: "team_member",
        myAllocation: allocation,
        projectManagers: [],
        teamMembers: [],
      } satisfies MyAllocationProject;
    })
    .filter((row): row is MyAllocationProject => Boolean(row));

  const history = historyRaw
    .map((row) => normalizeAllocationRow(row as Record<string, unknown>))
    .filter((row): row is MyAllocationRow => Boolean(row));

  return { currentProjects, history };
}

export function useMyAllocationsDetail(enabled = true) {
  return useQuery({
    queryKey: MY_ALLOCATIONS_DETAIL_QUERY_KEY,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const res = await hrmsService.getMyAllocationsDetail();
      return parseMyAllocationsDetail(res);
    },
  });
}
