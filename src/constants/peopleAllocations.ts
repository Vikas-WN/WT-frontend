import { ALLOCATION_STATUS_OPTIONS, ALLOCATION_TYPE_OPTIONS } from "@/constants/allocationOptions";
import { ALL_FILTER, NO_STATUS_FILTER } from "@/utils/peopleAllocations";

export { ALL_FILTER, NO_STATUS_FILTER };

/** Wording for the People allocations list (one row per employee allocation, with filters). */
export const PEOPLE_ALLOCATIONS_COPY = {
  tab: "People allocations",
  title: "People allocations",
  description: "Every employee allocation in one list. Narrow it by end date, status, allocation type, project or client.",
  searchLabel: "Search",
  searchPlaceholder: "Employee, role or project",
  endFrom: "End date from",
  endTo: "End date to",
  status: "Status",
  type: "Allocation type",
  project: "Project",
  client: "Client",
  all: "All",
  noStatus: "No status (NB)",
  clear: "Clear filters",
  empty: "No allocations match these filters",
  count: (shown: number, total: number) => (shown === total ? `${total} allocations` : `${shown} of ${total} allocations`),
} as const;

export const PEOPLE_ALLOCATION_STATUS_FILTER_OPTIONS = [
  { value: ALL_FILTER, label: PEOPLE_ALLOCATIONS_COPY.all },
  ...ALLOCATION_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  { value: NO_STATUS_FILTER, label: PEOPLE_ALLOCATIONS_COPY.noStatus },
];

export const PEOPLE_ALLOCATION_TYPE_FILTER_OPTIONS = [
  { value: ALL_FILTER, label: PEOPLE_ALLOCATIONS_COPY.all },
  ...ALLOCATION_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
];

export const PEOPLE_ALLOCATION_COLUMNS = [
  "employee_name",
  "project_name",
  "client_name",
  "role",
  "allocated_percent",
  "allocation_type",
  "billing_status",
  "start_date",
  "end_date",
] as const;
