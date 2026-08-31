import { compareApiDates, formatApiDateDisplay, normalizeToApiDate } from "@/utils/apiDate";

export type ProjectDateBounds = {
  start_date?: string | null;
  end_date?: string | null;
};

/** Returns a user-facing error when allocation dates fall outside the project window. */
export function validateAllocationWithinProjectDates(
  allocationStart: string,
  allocationEnd: string,
  project: ProjectDateBounds
): string | null {
  const projectStart = normalizeToApiDate(String(project.start_date ?? "").trim());
  const projectEnd = normalizeToApiDate(String(project.end_date ?? "").trim());

  if (projectStart && compareApiDates(allocationStart, projectStart) < 0) {
    return "Allocation dates must fall within the project start and end dates.";
  }
  if (projectEnd && compareApiDates(allocationStart, projectEnd) > 0) {
    const endLabel = formatApiDateDisplay(projectEnd) || projectEnd;
    return `Allocation dates must fall within the project start and end dates. This project ended on ${endLabel}.`;
  }
  if (projectEnd && compareApiDates(allocationEnd, projectEnd) > 0) {
    return "Allocation dates must fall within the project start and end dates.";
  }
  if (projectStart && compareApiDates(allocationEnd, projectStart) < 0) {
    return "Allocation dates must fall within the project start and end dates.";
  }
  return null;
}
