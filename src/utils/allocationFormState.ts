export type ProjectFormState = {
  project_name: string;
  /** Project type code from GET /project/types */
  project_type: string;
  client_id: string;
  client_name: string;
  account_manager_email: string;
  delivery_manager_email: string;
  project_manager_emails: string[];
  start_date: string;
  end_date: string;
  opportunity_ids: string[];
};

export type AllocationFormState = {
  allocation_id: string;
  employee_email: string;
  project_code: string;
  role: string;
  /** Allocation percent code from GET /allocation/percentages (e.g. "50", "100") */
  allocated_percent: string;
  start_date: string;
  end_date: string;
  allocation_type: string;
  billing_status: "" | "BILLED" | "BUFFER" | "INVESTMENT" | "TALENT_POOL";
  locked_in_date: string;
};

export function createEmptyProjectForm(): ProjectFormState {
  return {
    project_name: "",
    project_type: "",
    client_id: "",
    client_name: "",
    account_manager_email: "",
    delivery_manager_email: "",
    project_manager_emails: [],
    start_date: "",
    end_date: "",
    opportunity_ids: [],
  };
}

export function createEmptyAllocationForm(): AllocationFormState {
  return {
    allocation_id: "",
    employee_email: "",
    project_code: "",
    role: "",
    allocated_percent: "",
    start_date: "",
    end_date: "",
    allocation_type: "",
    billing_status: "",
    locked_in_date: "",
  };
}

export function createEmptyAllocationExtensionForm() {
  return {
    userEmails: [] as string[],
    projectCode: "",
    requestedEndDate: "",
    reason: "",
  };
}
