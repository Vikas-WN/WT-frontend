export const INTERNAL_PROJECT_CODE = "INTERNAL";
export const GENERAL_PROJECT_CODE = "GENERAL";

export const TASK_DEVELOPMENT = "DEVELOPMENT";
export const TASK_TESTING = "TESTING";
export const TASK_MEETING = "MEETING";
export const TASK_GENERAL = "GENERAL";

export const TASK_CATEGORY_LABELS: Record<string, string> = {
  DEVELOPMENT: "Development",
  TESTING: "Testing",
  MEETING: "Meeting",
  GENERAL: "General",
};

export const SUB_CATEGORIES: Record<string, string[]> = {
  DEVELOPMENT: ["Dev", "Testing", "Code review", "Bug fix"],
  TESTING: [
    "Write test cases",
    "Test execution",
    "Functional testing",
    "Automation",
    "Regression testing",
  ],
  MEETING: [
    "Sprint planning",
    "Retrospective",
    "Daily stand up",
    "Client call",
    "Project discussion",
  ],
  GENERAL: ["Holiday", "Leave", "Comp Off", "POC"],
};

export type TimelogProjectOption = {
  project_code: string;
  project_name: string;
  kind: string;
  task_categories: Array<{ value: string; label: string }>;
};

export type TimelogOptionsPayload = {
  client_projects: Array<{ project_code: string; project_name: string }>;
  project_options: TimelogProjectOption[];
  sub_categories_by_task: Record<string, string[]>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function normalizeTimelogProjectOption(raw: unknown): TimelogProjectOption | null {
  const row = asRecord(raw);
  if (!row) return null;
  const project_code = readString(row.project_code, row.projectCode).toUpperCase();
  if (!project_code) return null;
  const project_name = readString(row.project_name, row.projectName, project_code);
  const kind = readString(row.kind, "CLIENT");
  const taskRaw = row.task_categories ?? row.taskCategories;
  const task_categories = asArray(taskRaw)
    .map((taskValue) => {
      const task = asRecord(taskValue);
      if (!task) return null;
      const value = readString(task.value);
      if (!value) return null;
      return { value, label: readString(task.label, TASK_CATEGORY_LABELS[value] ?? value) };
    })
    .filter((task): task is { value: string; label: string } => Boolean(task));
  return {
    project_code,
    project_name,
    kind,
    task_categories,
  };
}

/** Normalize GET /timelog/options (camelCase or snake_case, nested or flat). */
export function normalizeTimelogOptionsPayload(payload: unknown): TimelogOptionsPayload {
  const root = asRecord(payload);
  const nested = asRecord(root?.data);
  const deep = asRecord(nested?.data);

  let source: Record<string, unknown> | null = null;
  for (const candidate of [root, nested, deep]) {
    if (!candidate) continue;
    if (candidate.project_options ?? candidate.projectOptions) {
      source = candidate;
      break;
    }
  }

  if (!source) {
    return {
      client_projects: [],
      project_options: [],
      sub_categories_by_task: SUB_CATEGORIES,
    };
  }

  const client_projects = asArray(source.client_projects ?? source.clientProjects)
    .map((row) => {
      const item = asRecord(row);
      if (!item) return null;
      const project_code = readString(item.project_code, item.projectCode).toUpperCase();
      if (!project_code) return null;
      return {
        project_code,
        project_name: readString(item.project_name, item.projectName, project_code),
      };
    })
    .filter((item): item is { project_code: string; project_name: string } => Boolean(item));

  const project_options = asArray(source.project_options ?? source.projectOptions)
    .map(normalizeTimelogProjectOption)
    .filter((item): item is TimelogProjectOption => Boolean(item));

  const subRaw = source.sub_categories_by_task ?? source.subCategoriesByTask;
  const sub_categories_by_task =
    subRaw && typeof subRaw === "object" && !Array.isArray(subRaw)
      ? (subRaw as Record<string, string[]>)
      : SUB_CATEGORIES;

  return {
    client_projects,
    project_options,
    sub_categories_by_task,
  };
}

export function projectOptionsFromPayload(payload: TimelogOptionsPayload | null): TimelogProjectOption[] {
  return payload?.project_options ?? [];
}

export function taskCategoriesForProject(projectCode: string): string[] {
  const code = projectCode.trim().toUpperCase();
  if (code === GENERAL_PROJECT_CODE) return [TASK_GENERAL];
  if (code === INTERNAL_PROJECT_CODE) return [TASK_DEVELOPMENT, TASK_MEETING, TASK_GENERAL];
  return [TASK_DEVELOPMENT, TASK_TESTING, TASK_MEETING, TASK_GENERAL];
}

export function subCategoriesFor(projectCode: string, taskCategory: string): string[] {
  const code = projectCode.trim().toUpperCase();
  const task = taskCategory.trim().toUpperCase();
  if (task === TASK_GENERAL && code !== INTERNAL_PROJECT_CODE && code !== GENERAL_PROJECT_CODE) {
    return [];
  }
  return SUB_CATEGORIES[task] ?? [];
}

export function subCategoryRequired(projectCode: string, taskCategory: string): boolean {
  return subCategoriesFor(projectCode, taskCategory).length > 0;
}
