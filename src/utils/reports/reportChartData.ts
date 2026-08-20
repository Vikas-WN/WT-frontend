/** Pure helpers to turn report table rows into chart series (no API changes). */

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const ym = value.trim().match(/^(\d+)\s*Y(?:\s+(\d+)\s*M)?$/i);
    if (ym) {
      const years = Number(ym[1]) || 0;
      const months = Number(ym[2] ?? 0) || 0;
      return years + months / 12;
    }
  }
  const parsed = Number(String(value ?? "").replace(/[,%]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function asLabel(value: unknown, fallback = "—"): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function topN<T extends { value: number }>(items: T[], limit: number): T[] {
  return [...items].sort((a, b) => b.value - a.value).slice(0, limit);
}

export function aggregateNumericByKey(
  rows: Array<Record<string, unknown>>,
  categoryKey: string,
  valueKey: string,
  options?: { limit?: number; otherLabel?: string }
): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = asLabel(row[categoryKey]);
    map.set(name, (map.get(name) ?? 0) + asNumber(row[valueKey]));
  }
  const all = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  const limit = options?.limit ?? 8;
  if (all.length <= limit) {
    return all.sort((a, b) => b.value - a.value);
  }
  const top = topN(all, limit - 1);
  const topNames = new Set(top.map((t) => t.name));
  const other = all
    .filter((item) => !topNames.has(item.name))
    .reduce((sum, item) => sum + item.value, 0);
  if (other > 0) {
    top.push({ name: options?.otherLabel ?? "Other", value: other });
  }
  return top;
}

export function rowsToBarSeries(
  rows: Array<Record<string, unknown>>,
  categoryKey: string,
  valueKeys: Array<{ key: string; name: string }>,
  options?: { limit?: number }
): Array<Record<string, string | number>> {
  const limit = options?.limit ?? 10;
  const prepared = rows
    .map((row) => {
      const entry: Record<string, string | number> = {
        name: asLabel(row[categoryKey]),
      };
      let total = 0;
      for (const vk of valueKeys) {
        const n = asNumber(row[vk.key]);
        entry[vk.key] = n;
        total += n;
      }
      return { entry, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map(({ entry }) => entry);
  return prepared;
}

export function benchDaysBuckets(
  rows: Array<Record<string, unknown>>
): Array<{ name: string; value: number }> {
  const buckets = [
    { name: "0–14 days", min: 0, max: 14, value: 0 },
    { name: "15–30 days", min: 15, max: 30, value: 0 },
    { name: "31–60 days", min: 31, max: 60, value: 0 },
    { name: "61–90 days", min: 61, max: 90, value: 0 },
    { name: "90+ days", min: 91, max: Number.POSITIVE_INFINITY, value: 0 },
  ];
  let investment = 0;
  for (const row of rows) {
    const raw = row.bench_days ?? row.benchDays;
    if (typeof raw === "string" && /investment/i.test(raw)) {
      investment += 1;
      continue;
    }
    const days = asNumber(raw);
    const bucket = buckets.find((b) => days >= b.min && days <= b.max);
    if (bucket) bucket.value += 1;
  }
  const result = buckets
    .filter((b) => b.value > 0)
    .map(({ name, value }) => ({ name, value }));
  if (investment > 0) {
    result.push({ name: "Investment", value: investment });
  }
  return result;
}

export function countByKey(
  rows: Array<Record<string, unknown>>,
  key: string,
  options?: { limit?: number }
): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = asLabel(row[key], "Unknown");
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  const all = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  return topN(all, options?.limit ?? 8);
}

function skillTokensFromValue(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    const tokens: string[] = [];
    for (const item of raw) {
      if (typeof item === "string") {
        const text = item.trim();
        if (text) tokens.push(text);
        continue;
      }
      if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        const skill = String(rec.skill ?? rec.name ?? "").trim();
        if (skill) tokens.push(skill);
      }
    }
    return tokens;
  }
  return String(raw ?? "")
    .split(/[,|;/]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function countSkillTokens(
  rows: Array<Record<string, unknown>>,
  key: string,
  options?: { limit?: number }
): Array<{ name: string; value: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    for (const token of skillTokensFromValue(row[key])) {
      map.set(token, (map.get(token) ?? 0) + 1);
    }
  }
  const all = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  return topN(all, options?.limit ?? 10);
}

export function experienceBandBuckets(
  rows: Array<Record<string, unknown>>,
  experienceKey: "webknot_experience" | "total_experience" = "total_experience"
): Array<{ name: string; value: number }> {
  const bands = [
    { name: "0–1 yrs", min: 0, max: 1 },
    { name: "1–3 yrs", min: 1, max: 3 },
    { name: "3–5 yrs", min: 3, max: 5 },
    { name: "5–8 yrs", min: 5, max: 8 },
    { name: "8+ yrs", min: 8, max: Number.POSITIVE_INFINITY },
  ];
  const counts = bands.map((b) => ({ name: b.name, value: 0 }));
  for (const row of rows) {
    const years = asNumber(row[experienceKey]);
    const idx = bands.findIndex((b, i) =>
      i === bands.length - 1 ? years >= b.min : years >= b.min && years < b.max
    );
    if (idx >= 0) counts[idx].value += 1;
  }
  return counts.filter((c) => c.value > 0);
}
