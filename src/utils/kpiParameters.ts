/** KPIs roll up to parameters (Technical Excellence, Delivery Reliability, …);
 *  a parameter's weight is the sum of its KPIs' weightage. */
export interface KpiParameterGroup<T> {
  /** null for KPIs defined without a parameter. */
  parameter: string | null;
  weight: number;
  items: T[];
}

/** Groups in first-appearance order (the order HR defined them in). */
export function groupKpisByParameter<T extends { parameter?: string | null; weightage: number | string }>(
  rows: T[]
): KpiParameterGroup<T>[] {
  const groups = new Map<string, KpiParameterGroup<T>>();
  for (const row of rows) {
    const parameter = row.parameter?.trim() || null;
    const key = parameter ? parameter.toLowerCase() : "";
    let group = groups.get(key);
    if (!group) {
      group = { parameter, weight: 0, items: [] };
      groups.set(key, group);
    }
    group.weight += Number(row.weightage) || 0;
    group.items.push(row);
  }
  return Array.from(groups.values()).map((g) => ({ ...g, weight: Math.round(g.weight * 100) / 100 }));
}

/** True when at least one KPI carries a parameter — screens fall back to a
 *  flat list with per-KPI weights for older KPI sets that have none. */
export function hasKpiParameters(rows: Array<{ parameter?: string | null }>): boolean {
  return rows.some((row) => Boolean(row.parameter?.trim()));
}

export function formatWeight(value: number | string): string {
  const n = Math.round((Number(value) || 0) * 100) / 100;
  return `${n}%`;
}
