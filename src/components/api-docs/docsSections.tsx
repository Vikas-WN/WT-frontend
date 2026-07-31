export type ApiDocsNavItem = {
  id: string;
  label: string;
  path?: string;
};

export type ApiDocsNavGroup = {
  title: string;
  items: ApiDocsNavItem[];
};

export type ApiDocsEndpoint = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  scope?: string;
  queryParams?: { name: string; type: string; notes: string }[];
  exampleRequest?: string;
  exampleResponse?: string;
};

export const API_DOCS_BASE_URL = "/api/v1";

export const API_DOCS_NAV: ApiDocsNavGroup[] = [
  {
    title: "Introduction",
    items: [
      { id: "overview", label: "Overview" },
      { id: "getting-started", label: "Getting started" },
    ],
  },
  {
    title: "Reference",
    items: [
      { id: "authentication", label: "Authentication" },
      { id: "conventions", label: "Conventions" },
    ],
  },
  {
    title: "API docs",
    items: [
      { id: "health", label: "Health check", path: "/health" },
      { id: "clients", label: "Clients", path: "/masters/clients" },
      { id: "projects", label: "Projects", path: "/projects" },
      { id: "allocation", label: "Allocation", path: "/allocation" },
      { id: "leave-wfh", label: "Leave & WFH", path: "/userRequest" },
      { id: "timelog", label: "Timelog", path: "/timelog" },
    ],
  },
  {
    title: "Appendix",
    items: [
      { id: "errors", label: "Errors" },
      { id: "support", label: "Support" },
    ],
  },
];

export const API_DOCS_ENDPOINTS: Record<string, ApiDocsEndpoint> = {
  health: {
    method: "GET",
    path: "/health",
    description: "Liveness probe for the WebTrak API gateway.",
    exampleRequest: `curl "${API_DOCS_BASE_URL.replace("/api/v1", "")}/health"`,
    exampleResponse: `{\n  "status": "ok"\n}`,
  },
  clients: {
    method: "GET",
    path: "/masters/clients",
    description:
      "Lists clients visible to the signed-in user. When WK Business integration is configured on the server, this endpoint proxies the WK Business clients feed and maps it into the WebTrak client shape.",
    scope: "Authenticated (ROLE_EMPLOYEE+)",
    queryParams: [
      { name: "search", type: "string", notes: "Case-insensitive substring match on client name." },
      { name: "active_only", type: "boolean", notes: "When true, returns only active clients." },
      { name: "include_projects", type: "boolean", notes: "Include linked project summaries when available." },
    ],
    exampleRequest: `curl -b "accessToken=..." \\\n  "${API_DOCS_BASE_URL}/masters/clients?active_only=true"`,
    exampleResponse: `{\n  "message": "Clients fetched successfully",\n  "data": {\n    "items": [\n      {\n        "id": "a1b2c3d4-1111-2222-3333-444455556666",\n        "external_id": "a1b2c3d4-1111-2222-3333-444455556666",\n        "name": "Acme Corp",\n        "spoc_external_name": "Jane Doe",\n        "spoc_external_email": "jane@acme.com",\n        "is_active": true,\n        "project_count": 0\n      }\n    ],\n    "total": 1\n  }\n}`,
  },
  projects: {
    method: "GET",
    path: "/projects",
    description: "Paginated list of projects the caller can access.",
    scope: "Authenticated",
    queryParams: [
      { name: "page", type: "number", notes: "Zero-based page index." },
      { name: "size", type: "number", notes: "Page size (default 10)." },
      { name: "search", type: "string", notes: "Filter by project name or code." },
    ],
    exampleRequest: `curl -b "accessToken=..." \\\n  "${API_DOCS_BASE_URL}/projects?page=0&size=10"`,
  },
  allocation: {
    method: "GET",
    path: "/allocation/user/detail",
    description: "Returns the signed-in employee's current project allocations and talent-pool availability.",
    scope: "Authenticated",
    exampleRequest: `curl -b "accessToken=..." \\\n  "${API_DOCS_BASE_URL}/allocation/user/detail"`,
  },
  "leave-wfh": {
    method: "POST",
    path: "/userRequest",
    description:
      "Create a leave, optional leave, WFH, or comp-off request. Talent-pool employees (bench / no client allocation) route leave and WFH directly to HR reviewers.",
    scope: "Authenticated",
    exampleRequest: `curl -b "accessToken=..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "requestType": "LEAVE",\n    "requestFromDate": "2026-08-04",\n    "requestToDate": "2026-08-04",\n    "comments": "Personal work",\n    "primaryManagerEmails": ["manager@webknot.in"],\n    "secondaryManagerEmails": ["backup@webknot.in"]\n  }' \\\n  "${API_DOCS_BASE_URL}/userRequest"`,
  },
  timelog: {
    method: "GET",
    path: "/timelog/week",
    description: "Weekly timesheet entries for the signed-in employee or managed scope.",
    scope: "Authenticated",
    queryParams: [
      { name: "week_start", type: "date", notes: "ISO date for the week start (Monday)." },
    ],
    exampleRequest: `curl -b "accessToken=..." \\\n  "${API_DOCS_BASE_URL}/timelog/week?week_start=2026-07-28"`,
  },
};
