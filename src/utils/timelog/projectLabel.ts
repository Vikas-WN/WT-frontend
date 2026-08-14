/**
 * Resolve a human-readable project label for timelog UI.
 * Prefer API/project-option names; never surface raw project codes (e.g. P00779719).
 */

type ProjectRef = {
  project_code?: string | null;
  project_name?: string | null;
  projectName?: string | null;
  projectCode?: string | null;
};

type ProjectOptionRef = {
  project_code: string;
  project_name: string;
};

function readCode(entry: ProjectRef): string {
  return String(entry.project_code ?? entry.projectCode ?? "").trim();
}

function readName(entry: ProjectRef): string {
  return String(entry.project_name ?? entry.projectName ?? "").trim();
}

/** True when value is empty or is just a project code token. */
export function looksLikeProjectCode(value: string, code?: string): boolean {
  const text = value.trim();
  if (!text) return true;
  const codeUpper = String(code ?? "").trim().toUpperCase();
  if (codeUpper && text.toUpperCase() === codeUpper) return true;
  // Auto-generated / catalog style codes
  if (/^P\d{5,}$/i.test(text)) return true;
  if (/^(BENCH|GLOBAL|INTERNAL|GENERAL)$/i.test(text) && (!codeUpper || text.toUpperCase() === codeUpper)) {
    // Bare system codes without a separate display name still need mapping below.
    return true;
  }
  return false;
}

function systemProjectLabel(codeUpper: string): string | null {
  if (codeUpper === "BENCH" || codeUpper === "GLOBAL") return "Talent Pool";
  if (codeUpper === "INTERNAL") return "Internal Project";
  if (codeUpper === "GENERAL") return "General";
  return null;
}

export function resolveTimelogProjectLabel(
  entry: ProjectRef,
  projectOptions: ProjectOptionRef[] = []
): string {
  const code = readCode(entry);
  const codeUpper = code.toUpperCase();
  const rawName = readName(entry);

  if (rawName && !looksLikeProjectCode(rawName, code)) {
    return rawName;
  }

  const fromOptions = projectOptions.find(
    (option) => option.project_code.trim().toUpperCase() === codeUpper
  )?.project_name?.trim();
  if (fromOptions && !looksLikeProjectCode(fromOptions, code)) {
    return fromOptions;
  }

  const systemLabel = systemProjectLabel(codeUpper);
  if (systemLabel) return systemLabel;

  // Last resort: never show opaque project IDs in the UI.
  return "—";
}
