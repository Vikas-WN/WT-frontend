export type ClientProjectSummary = {
  projectCode: string;
  projectName: string;
  isActive: boolean;
};

export type ClientRecord = {
  id: number;
  name: string;
  spocExternalName: string | null;
  spocExternalEmail: string | null;
  spocExternalPhone: string | null;
  pocInternalUserId: number | null;
  pocInternalEmail: string | null;
  pocInternalName: string | null;
  accountManagerUserId: number | null;
  accountManagerEmail: string | null;
  accountManagerName: string | null;
  deliveryManagerUserId: number | null;
  deliveryManagerEmail: string | null;
  deliveryManagerName: string | null;
  isActive: boolean;
  projectCount: number;
  projects?: ClientProjectSummary[];
};

export type ClientFormState = {
  name: string;
  spoc_external_name: string;
  spoc_external_email: string;
  spoc_external_phone: string;
  poc_internal_email: string;
  account_manager_email: string;
  delivery_manager_email: string;
  is_active: boolean;
};

export function createEmptyClientForm(): ClientFormState {
  return {
    name: "",
    spoc_external_name: "",
    spoc_external_email: "",
    spoc_external_phone: "",
    poc_internal_email: "",
    account_manager_email: "",
    delivery_manager_email: "",
    is_active: true,
  };
}
