export type OpportunityRecord = {
  id: string;
  oppId: string | null;
  opportunityName: string;
  clientId: string | null;
  clientName: string | null;
  currentStatus: string | null;
  businessType: string | null;
  billingType: string | null;
  techType: string | null;
  contractType: string | null;
  domain: string | null;
  location: string | null;
  probabilityPercent: number | null;
  pursuitStartDate: string | null;
  pursuitCloseDate: string | null;
  projectStartDate: string | null;
  projectEndDate: string | null;
  description: string | null;
};

export type OpportunityListResult = {
  items: OpportunityRecord[];
  total: number;
};
