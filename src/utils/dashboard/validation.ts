import { allocatedHoursToPercent, MAX_ALLOCATION_HOURS_PER_DAY, resolveAllocatedPercentFromRow } from "@/utils/allocationPercent";

/** Letters and spaces only; 2–120 chars (matches HR onboarding). */
export function isValidPersonName(name: string): boolean {
  const t = name.trim();
  if (t.length < 2 || t.length > 120) return false;
  return /^[a-zA-ZÀ-ÿ]+(?: [a-zA-ZÀ-ÿ]+)*$/u.test(t);
}

/** Collapse spaces/dashes so "B8 - Intern", "B8-intern", and "B8 Intern" all match B8INTERN. */
export function bandNameMatchKey(name: string): string {
  return name.trim().toUpperCase().replace(/[\s\-_–—]+/g, "");
}

/** Intern-only bands — mirrors backend INTERN_ONLY_BAND_NAMES ("B8", "B8 - Intern"). */
export function isInternOnlyBand(name: string): boolean {
  const key = bandNameMatchKey(name);
  return key === "B8" || key === "B8INTERN" || (key.includes("B8") && key.includes("INTERN"));
}

export function bandDisplayLabel(row: Record<string, unknown>): string {
  return String(row.name ?? row.band_name ?? row.bandName ?? row.id ?? "").trim();
}

export function bandsForDepartment(
  bands: Array<Record<string, unknown>>,
  department: string
): Array<Record<string, unknown>> {
  const dept = department.trim();
  if (!dept) return bands;
  const filtered = bands.filter((row) => {
    const stream = String(row.stream ?? row.department ?? row.dept ?? "").trim();
    if (!stream) return true;
    return stream.toLowerCase() === dept.toLowerCase();
  });
  return filtered.length ? filtered : bands;
}

export function bandSelectOptions(
  bands: Array<Record<string, unknown>>
): Array<{ value: string; label: string }> {
  return bands
    .map((row) => {
      const value = String(row.id ?? "").trim();
      const label = bandDisplayLabel(row) || (value ? `Band ${value}` : "");
      return { value, label };
    })
    .filter((item) => item.value && item.label);
}

export function internBandDisplayLabel(
  bands: Array<Record<string, unknown>>,
  internBandId: number
): string {
  if (internBandId > 0) {
    const row = bands.find((band) => Number(band.id) === internBandId);
    const label = row ? bandDisplayLabel(row) : "";
    if (label) return label;
  }
  return internBandId === 8 ? "B8 - Intern" : internBandId > 0 ? `Band ${internBandId}` : "";
}

export function resolveInternBandId(bands: Array<Record<string, unknown>>): number {
  const internHit = bands.find((row) => {
    const key = bandNameMatchKey(String(row.name ?? row.band_name ?? ""));
    return key === "B8INTERN" || (key.includes("B8") && key.includes("INTERN"));
  });
  const internId = internHit?.id != null ? Number(internHit.id) : NaN;
  if (Number.isFinite(internId) && internId > 0) return internId;

  const internFallback = bands.find((row) => {
    const key = bandNameMatchKey(String(row.name ?? row.band_name ?? ""));
    return key.includes("INTERN");
  });
  const fallbackId = internFallback?.id != null ? Number(internFallback.id) : NaN;
  if (Number.isFinite(fallbackId) && fallbackId > 0) return fallbackId;

  const genericB8 = bands.find(
    (row) => bandNameMatchKey(String(row.name ?? row.band_name ?? "")) === "B8"
  );
  const genericId = genericB8?.id != null ? Number(genericB8.id) : NaN;
  return Number.isFinite(genericId) && genericId > 0 ? genericId : 8;
}

export function bandSelectOptionsForUserType(
  bands: Array<Record<string, unknown>>,
  department: string,
  userType: string,
  internBandId: number
): Array<{ value: string; label: string }> {
  const scoped = bandsForDepartment(bands, department);
  const isIntern = userType === "INTERN";

  // Full-time / consultant must never see intern-only bands (B8, B8 - Intern).
  const visible = isIntern
    ? scoped
    : scoped.filter(
        (row) => !isInternOnlyBand(String(row.name ?? row.band_name ?? row.bandName ?? ""))
      );

  const opts = bandSelectOptions(visible);
  if (!isIntern || internBandId <= 0) return opts;
  if (opts.some((option) => option.value === String(internBandId))) return opts;

  const internRow = bands.find((row) => Number(row.id) === internBandId);
  if (!internRow) {
    return [{ value: String(internBandId), label: `Band ${internBandId}` }, ...opts];
  }

  return [{ value: String(internBandId), label: bandDisplayLabel(internRow) }, ...opts];
}

/** India mobile: optional +91, then 10 digits starting 6–9 */
export function isValidIndiaMobile(phone: string): boolean {
  const d = phone.replace(/[\s-]/g, "");
  if (!d) return false;
  return /^(\+91)?[6-9]\d{9}$/.test(d);
}

export function generateAutomaticProjectCode(): string {
  const part = `${Date.now()}`.slice(-6);
  return `P00${part}`;
}

/** Designations that use allocated hours 1–8 (others use 4 or 8 only). */
export function designationAllowsFlexibleHours(designation: string): boolean {
  const r = designation.trim().toLowerCase();
  if (!r) return false;
  return (
    r.includes("design") ||
    r.includes("devops") ||
    r.includes("project manager") ||
    r.includes("delivery manager") ||
    /\bpm\b/.test(r) ||
    /\bdm\b/.test(r) ||
    r.includes("chief") ||
    r.includes("ceo") ||
    r.includes("cto") ||
    r.includes("cfo") ||
    r.includes("coo") ||
    r.includes("c-suite") ||
    r.includes("csuite") ||
    r.includes("c suite") ||
    r.includes("chair")
  );
}

export const FLEXIBLE_ALLOCATION_HOUR_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
export const RESTRICTED_ALLOCATION_HOUR_OPTIONS = ["4", "8"] as const;

/** Display allocation as percent (supports allocatedPercent or legacy 1–8 hours/day). */
export function formatAllocatedHoursPercentLabel(hoursRaw: unknown): string {
  const raw = String(hoursRaw ?? "").trim();
  if (!raw || raw === "—") return "—";

  // Prefer full-row resolution when a record is passed.
  if (hoursRaw && typeof hoursRaw === "object" && !Array.isArray(hoursRaw)) {
    const pct = resolveAllocatedPercentFromRow(hoursRaw as Record<string, unknown>);
    if (pct != null) return `${pct}%`;
  }

  const cleaned = raw.replace(/%/g, "").trim();
  const n = Number(String(cleaned).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return raw;

  // Ambiguous scalar: 1–8 are daily hours (4h → 50%); 9–100 are percent codes.
  if (n <= MAX_ALLOCATION_HOURS_PER_DAY) {
    return `${allocatedHoursToPercent(n)}%`;
  }
  if (n <= 100) return `${Math.round(n)}%`;
  return raw;
}
