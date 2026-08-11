export type IntegrationsNavItem = {
  id: string;
  label: string;
  path?: string;
};

export type IntegrationsNavGroup = {
  title: string;
  items: IntegrationsNavItem[];
};

export type IntegrationsEndpoint = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  scope?: string;
  queryParams?: { name: string; type: string; required: boolean; notes: string }[];
  exampleRequest?: string;
  exampleResponse?: string;
};

export const INTEGRATIONS_BASE_PATH = "/api/v1/integrations";

// Placeholders resolved at render time from window.location.origin.
// {{ORIGIN}}   → window.location.origin
// {{BASE_URL}} → window.location.origin + /api/v1/integrations
export const INTEGRATIONS_ORIGIN_TOKEN = "{{ORIGIN}}";
export const INTEGRATIONS_BASE_URL_TOKEN = "{{BASE_URL}}";

export const INTEGRATIONS_NAV: IntegrationsNavGroup[] = [
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
      { id: "health", label: "Health check", path: "/integrations/health" },
      { id: "projects", label: "Projects", path: "/integrations/projects" },
      { id: "project-detail", label: "Project detail", path: "/integrations/projects/{code}" },
      { id: "project-employees", label: "Project employees", path: "/integrations/projects/{code}/employees" },
      { id: "allocations", label: "Allocations", path: "/integrations/allocations" },
      { id: "employees", label: "Employees", path: "/integrations/employees" },
      { id: "employee-detail", label: "Employee detail", path: "/integrations/employees/{emp_id}" },
      { id: "employee-allocations", label: "Employee allocations", path: "/integrations/employees/{emp_id}/allocations" },
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

export const INTEGRATIONS_ENDPOINTS: Record<string, IntegrationsEndpoint> = {
  health: {
    method: "GET",
    path: "/integrations/health",
    description: "Liveness probe for the WebTrak integrations gateway. No authentication required.",
    exampleRequest: `curl --location '{{BASE_URL}}/health'`,
    exampleResponse: `{\n  "status": "ok"\n}`,
  },
  projects: {
    method: "GET",
    path: "/integrations/projects",
    description: "Full list of all projects in WebTrak. Returns project name, code, client association, status, and manager details.",
    scope: "API key required (ROLE_HR)",
    queryParams: [
      { name: "search", type: "string", required: false, notes: "Filter by project name or code (case-insensitive)." },
    ],
    exampleRequest: `curl --location '{{BASE_URL}}/projects' \\\n  --header 'Authorization: Bearer wtak_your_api_key'`,
    exampleResponse: `{\n  "message": "success",\n  "data": {\n    "items": [\n      {\n        "id": 3,\n        "project_code": "P00708769",\n        "project_name": "Cenomi",\n        "project_type": "PRODUCT",\n        "is_active": true,\n        "client_name": "Cenomi client",\n        "start_date": "01/01/2026",\n        "end_date": "01/01/2027"\n      }\n    ],\n    "total": 14\n  }\n}`,
  },
  allocations: {
    method: "GET",
    path: "/integrations/allocations",
    description: "Full list of employee-project allocations. Optionally filter by project code or employee email.",
    scope: "API key required (ROLE_HR)",
    queryParams: [
      { name: "projectCode", type: "string", required: false, notes: "Filter allocations for a specific project." },
      { name: "userEmail", type: "string", required: false, notes: "Filter allocations for a specific employee." },
      { name: "search", type: "string", required: false, notes: "Free-text search across employee name or project." },
    ],
    exampleRequest: `curl --location '{{BASE_URL}}/allocations' \\\n  --header 'Authorization: Bearer wtak_your_api_key'`,
    exampleResponse: `{\n  "message": "success",\n  "data": {\n    "items": [\n      {\n        "id": "a1b2c3d4-0000-0000-0000-000000000001",\n        "employeeEmail": "john.doe@example.com",\n        "employeeName": "John Doe",\n        "projectCode": "PRJ-001",\n        "projectName": "Acme Platform",\n        "allocationPercentage": 100,\n        "startDate": "2025-01-01",\n        "endDate": "2025-12-31",\n        "status": "ACTIVE"\n      }\n    ],\n    "total": 1,\n    "page": 0,\n    "size": 10\n  }\n}`,
  },
  employees: {
    method: "GET",
    path: "/integrations/employees",
    description: "Full list of onboarded employees. Returns name, email, employee ID, designation, and employment status.",
    scope: "API key required (ROLE_HR)",
    queryParams: [
      { name: "search", type: "string", required: false, notes: "Filter by employee name or email." },
    ],
    exampleRequest: `curl --location '{{BASE_URL}}/employees' \\\n  --header 'Authorization: Bearer wtak_your_api_key'`,
    exampleResponse: `{\n  "message": "success",\n  "data": {\n    "items": [\n      {\n        "empId": "WK-001",\n        "name": "Jane Smith",\n        "email": "jane.smith@example.com",\n        "designation": "Software Engineer",\n        "status": "ACTIVE",\n        "joiningDate": "2024-03-01"\n      }\n    ],\n    "total": 1,\n    "page": 0,\n    "size": 10\n  }\n}`,
  },
  "project-detail": {
    method: "GET",
    path: "/integrations/projects/{project_code}",
    description: "Full details for a single project by its project code.",
    scope: "API key required (ROLE_HR)",
    exampleRequest: `curl --location '{{BASE_URL}}/projects/P00708769' \\\n  --header 'Authorization: Bearer wtak_your_api_key'`,
    exampleResponse: `{\n  "message": "success",\n  "data": {\n    "id": 3,\n    "project_code": "P00708769",\n    "project_name": "Cenomi",\n    "project_type": "PRODUCT",\n    "is_active": true,\n    "client_name": "Cenomi client",\n    "start_date": "2026-01-01",\n    "end_date": "2027-01-01",\n    "manager_email": "manager@example.com"\n  }\n}`,
  },
  "project-employees": {
    method: "GET",
    path: "/integrations/projects/{project_code}/employees",
    description: "List of employees currently allocated to a project.",
    scope: "API key required (ROLE_HR)",
    queryParams: [
      { name: "search", type: "string", required: false, notes: "Filter by employee name or email." },
    ],
    exampleRequest: `curl --location '{{BASE_URL}}/projects/P00708769/employees' \\\n  --header 'Authorization: Bearer wtak_your_api_key'`,
    exampleResponse: `{\n  "message": "success",\n  "data": {\n    "employees": [\n      {\n        "emp_id": "GW1480",\n        "name": "Jane Doe",\n        "email": "jane.doe@example.com",\n        "role": "Android Developer",\n        "allocated_percent": 100,\n        "start_date": "2026-01-01",\n        "end_date": "2027-01-01"\n      }\n    ]\n  }\n}`,
  },
  "employee-detail": {
    method: "GET",
    path: "/integrations/employees/{emp_id}",
    description: "Full profile for a single employee by their employee ID (e.g. GW1480).",
    scope: "API key required (ROLE_HR)",
    exampleRequest: `curl --location '{{BASE_URL}}/employees/GW1480' \\\n  --header 'Authorization: Bearer wtak_your_api_key'`,
    exampleResponse: `{\n  "message": "success",\n  "data": {\n    "emp_id": "GW1480",\n    "name": "Jane Doe",\n    "email": "jane.doe@example.com",\n    "status": "ACTIVE",\n    "user_type": "FULLTIME",\n    "designation": "Senior Engineer",\n    "department": "Engineering",\n    "band": "B5",\n    "doj": "2022-07-14"\n  }\n}`,
  },
  "employee-allocations": {
    method: "GET",
    path: "/integrations/employees/{emp_id}/allocations",
    description: "Allocations for a single employee. Use the scope param to filter by time range.",
    scope: "API key required (ROLE_HR)",
    queryParams: [
      { name: "scope", type: "string", required: false, notes: "Time filter: current, current_and_future (default), or all." },
    ],
    exampleRequest: `curl --location '{{BASE_URL}}/employees/GW1480/allocations?scope=current_and_future' \\\n  --header 'Authorization: Bearer wtak_your_api_key'`,
    exampleResponse: `{\n  "message": "success",\n  "data": {\n    "allocations": [\n      {\n        "id": 8,\n        "project_code": "P00708769",\n        "project_name": "Cenomi",\n        "role": "Android Developer",\n        "allocated_percent": 100,\n        "start_date": "2026-01-01",\n        "end_date": "2027-01-01",\n        "is_active": true\n      }\n    ]\n  }\n}`,
  },
};
