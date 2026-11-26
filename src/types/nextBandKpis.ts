export type NextBandKpi = {
  kpi_name: string;
  weightage: number;
};

export type NextBandDesignationKpis = {
  designation: string;
  kpis: NextBandKpi[];
};

export type NextBandKpisData = {
  emp_id: string | null;
  name: string;
  department: string | null;
  current_band: string | null;
  current_designation: string | null;
  next_band: string | null;
  next_band_designations: NextBandDesignationKpis[];
  /** Set by the API when there is nothing to show (band/department missing, top band, no KPIs defined). */
  message: string | null;
};
