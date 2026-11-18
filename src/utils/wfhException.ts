/** Keep in step with the API's WFH_EXCEPTION_MANAGER_MAX_DAYS (app/domain/request_hr_policy.py). */
export const WFH_EXCEPTION_MANAGER_MAX_DAYS = 3;

/** Mon–Fri days in the inclusive range. Public holidays are not excluded (the API does not either). */
export function workingDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  for (; day <= last; day.setDate(day.getDate() + 1)) {
    const weekday = day.getDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

/** True when a custom WFH spans more working days than a manager may decide, so only HR can. Unknown dates count as long (the API still decides). */
export function wfhExceptionNeedsHr(start: Date | null, end: Date | null): boolean {
  if (!start || !end) return true;
  return workingDaysBetween(start, end) > WFH_EXCEPTION_MANAGER_MAX_DAYS;
}
